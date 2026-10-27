'use strict';
/**
 * Explore Wings Digital Technologies - Server Entry Point
 * Production-grade Node.js LTS + Express server with SQLite, EJS, and Admin Console.
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const config = require('./lib/config');
const { db } = require('./db');
const { startUptimeMonitor } = require('./lib/uptime');
const { maintenanceMiddleware } = require('./middleware/maintenance');
const { analyticsTrackerMiddleware } = require('./middleware/analytics');
const { initSessionUser, csrfTokenMiddleware } = require('./middleware/auth');
const { Analytics } = require('./db/queries');
const { iconSvg, ICON_OPTIONS } = require('./lib/icons');

const app = express();

// 1. Trust proxy if in production
if (config.isProd) {
  app.set('trust proxy', 1);
}

// 2. View Engine: EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 3. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Allowed for theme wiper, analytics, and GA4 tag
          'https://www.googletagmanager.com',
          'https://www.google-analytics.com'
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com'
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", 'https://www.google-analytics.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 4. Compression (Gzip/Brotli)
app.use(compression());

// 5. Body Parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// 6. Static Assets with Cache-Control
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: config.isProd ? '7d' : '0',
    etag: true
  })
);

// 7. Express Session Store
app.use(
  session({
    name: 'ew_sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.isProd, // HTTPS in production
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  })
);

app.use(initSessionUser);
app.use(csrfTokenMiddleware);

// 8. Custom Layout & Flash Message Helper Middleware
app.use((req, res, next) => {
  res.locals.iconSvg = iconSvg;
  // Flash messages stored in session
  res.locals.success = req.session.success || '';
  res.locals.error = req.session.error || '';
  delete req.session.success;
  delete req.session.error;

  // Intercept res.render to support layout nesting for site and admin
  const originalRender = res.render.bind(res);
  res.render = function (view, locals = {}, callback) {
    if (view.startsWith('site/') && !view.includes('maintenance')) {
      originalRender(view, locals, (err, html) => {
        if (err) return next(err);
        originalRender('site/layout', { ...locals, body: html }, callback);
      });
    } else if (view.startsWith('admin/') && view !== 'admin/login') {
      originalRender(view, locals, (err, html) => {
        if (err) return next(err);
        originalRender('admin/layout', { ...locals, body: html }, callback);
      });
    } else {
      originalRender(view, locals, callback);
    }
  };
  next();
});

// 9. First-Party Analytics Middleware (Cookieless)
app.use(analyticsTrackerMiddleware);

// 10. Maintenance Mode Middleware
app.use(maintenanceMiddleware);

// 11. Mount Routers
const adminRouter = require('./admin/routes/admin');
const siteRouter = require('./routes/site');

app.use('/admin', adminRouter);
app.use('/', siteRouter);

// 12. 404 Not Found Handler
app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) {
    return res.status(404).render('admin/error', {
      title: '404 - Not Found',
      errorTitle: 'Admin Page Not Found',
      errorMessage: `The requested admin URL '${req.path}' does not exist.`
    });
  }

  // Log 404 in database for SEO Manager audit
  try {
    Analytics.log404(req.path);
  } catch (err) {}

  res.status(404).render('site/404', {
    page: { title: '404 - Page Not Found | Explore Wings' },
    currentPath: req.path
  });
});

// 13. Global 500 Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  if (res.headersSent) return next(err);

  if (req.path.startsWith('/admin')) {
    return res.status(500).render('admin/error', {
      title: '500 - Server Error',
      errorTitle: 'Internal System Error',
      errorMessage: config.isProd ? 'An error occurred processing your request.' : err.message
    });
  }

  res.status(500).render('site/500', {
    page: { title: '500 - Server Error | Explore Wings' },
    currentPath: req.path
  });
});

// 14. Server Bootstrap & Monitoring
const { Users } = require('./db/queries');
const { seed } = require('./scripts/seed');

// Auto-seed if database is new or empty (essential when cloning from GitHub onto a fresh environment)
try {
  if (Users.count() === 0) {
    console.log('[Server] Database is empty. Running initial content seed...');
    seed().then(() => {
      console.log('[Server] Initial seed completed.');
    }).catch(err => {
      console.error('[Server] Seed error:', err);
    });
  }
} catch (e) {
  console.warn('[Server] Auto-seed check warning:', e.message);
}

let server;
if (require.main === module) {
  server = app.listen(config.port, config.host || '0.0.0.0', () => {
    console.log(`Explore Wings server running on http://${config.host || 'localhost'}:${config.port}`);
    console.log(`Admin Console: http://${config.host || 'localhost'}:${config.port}/admin (Login: /admin/login)`);
    
    // Start autonomous 60-second uptime pinger
    startUptimeMonitor();
  });
}

// Graceful Shutdown
function handleShutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      try {
        db.close();
        console.log('Database connection closed.');
      } catch (e) {}
      process.exit(0);
    });
  } else {
    try { db.close(); } catch (e) {}
    process.exit(0);
  }
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = app;
