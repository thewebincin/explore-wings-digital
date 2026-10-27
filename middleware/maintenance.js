'use strict';
/**
 * Maintenance mode middleware.
 * Displays branded 503 page with Retry-After header for visitors.
 * Provides explicit live preview for authenticated admins and bypass tokens.
 */
const { Settings } = require('../db/queries');
const config = require('../lib/config');

function maintenanceMiddleware(req, res, next) {
  // Always permit admin routes, static assets, and maintenance api endpoints
  if (
    req.path.startsWith('/admin') ||
    req.path.startsWith('/public') ||
    req.path.startsWith('/images') ||
    req.path.startsWith('/fonts') ||
    req.path.startsWith('/uploads') ||
    req.path.startsWith('/css') ||
    req.path.startsWith('/js') ||
    req.path === '/api/maintenance/notify' ||
    req.path === '/api/uptime' ||
    req.path === '/favicon.ico'
  ) {
    return next();
  }

  const mode = Settings.get('maintenance_mode', 'off');
  const isMaintenanceActive = (mode === 'on' || mode === 'true' || mode === '1');
  if (!isMaintenanceActive) {
    return next();
  }

  const bypassToken = Settings.get('maintenance_bypass_token', 'ew-preview');
  const isAdmin = Boolean(req.user && (req.user.role === 'Owner' || req.user.role === 'Editor'));

  // Handle preview toggle commands
  if (req.query.preview === 'off') {
    delete req.session.previewLive;
    delete req.session.maintenanceBypass;
  } else if (req.query.preview === 'live' || (req.query.bypass && req.query.bypass === bypassToken)) {
    req.session.previewLive = true;
    req.session.maintenanceBypass = true;
  }

  // If live preview is explicitly activated, allow seeing the live site with the preview banner
  if (req.session.previewLive || req.session.maintenanceBypass) {
    res.locals.maintenanceBypass = true;
    res.locals.isMaintenanceActive = true;
    res.locals.isAdmin = isAdmin;
    return next();
  }

  // Otherwise, render the 503 Maintenance Page (for visitors and admins alike, so admin sees the real 503 page)
  res.status(503);
  res.setHeader('Retry-After', '3600'); // 1 hour retry hint for search engine crawlers

  const allSettings = Settings.getAll();
  const siteName = allSettings.site_name || 'Explore Wings Digital Technologies';
  const maintenanceMessage = allSettings.maintenance_message || "We're currently performing a scheduled update to our systems. We'll be back shortly.";
  const estimatedEnd = allSettings.maintenance_end || allSettings.maintenance_return_time || '';
  const allowNotify = allSettings.maintenance_allow_notify !== '0';

  res.render('site/maintenance', {
    title: `Maintenance | ${siteName}`,
    settings: allSettings,
    siteName,
    maintenanceMessage,
    estimatedEnd,
    returnTime: estimatedEnd,
    email: allSettings.email || 'hello@explorewings.com',
    whatsapp: allSettings.whatsapp || '+919446012345',
    theme: allSettings.default_theme || 'green',
    siteMode: allSettings.default_mode || 'light',
    allowNotify,
    isAdmin,
    assetVersion: config.assetVersion || '1.0.0'
  });
}

module.exports = { maintenanceMiddleware };
