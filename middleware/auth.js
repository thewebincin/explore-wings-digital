'use strict';
/**
 * Authentication, RBAC (Owner, Editor, Viewer),
 * and CSRF protection middleware.
 */
const crypto = require('crypto');
const { Users } = require('../db/queries');

function initSessionUser(req, res, next) {
  if (req.session && req.session.userId) {
    const user = Users.findById(req.session.userId);
    if (user && user.active) {
      req.user = user;
      res.locals.user = user;
    } else {
      req.session.destroy();
      req.user = null;
      res.locals.user = null;
    }
  } else {
    req.user = null;
    res.locals.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/admin/login');
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.redirect('/admin/login');
    if (roles.includes(req.user.role) || req.user.role === 'Owner') {
      return next();
    }
    res.status(403).render('admin/error', {
      title: '403 Forbidden',
      message: 'You do not have permission to access this resource.'
    });
  };
}

// CSRF Protection via session token
function csrfTokenMiddleware(req, res, next) {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = crypto.randomBytes(24).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfSecret;

  // Verify on state changing methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (!safeMethods.includes(req.method)) {
    // Exclude public lead capture API endpoints and login
    if (req.path.startsWith('/api/') || req.path === '/admin/login' || req.path === '/login') {
      return next();
    }

    const submittedToken = req.body._csrf || req.headers['x-csrf-token'];
    if (!submittedToken || submittedToken !== req.session.csrfSecret) {
      return res.status(403).render('admin/error', {
        title: '403 Invalid CSRF Token',
        message: 'Security token expired or invalid. Please refresh the page and try again.'
      });
    }
  }

  next();
}

module.exports = {
  initSessionUser,
  requireAuth,
  requireRole,
  csrfTokenMiddleware
};
