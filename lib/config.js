'use strict';
/**
 * Central configuration. Every value comes from environment variables (.env).
 * No secrets live in the code.
 */
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const env = process.env;
const root = path.resolve(__dirname, '..');
const isProd = env.NODE_ENV === 'production';
const port = parseInt(env.PORT || '3000', 10);

let sessionSecret = env.SESSION_SECRET || '';
let sessionSecretIsTemporary = false;
if (sessionSecret.length < 32) {
  if (isProd) {
    console.error('[config] SESSION_SECRET must be set to a random string of 32+ characters in production. See .env.example');
    process.exit(1);
  }
  sessionSecret = crypto.randomBytes(48).toString('hex');
  sessionSecretIsTemporary = true;
}

const dataDir = path.resolve(root, env.DATA_DIR || 'data');
const uploadsDir = path.resolve(root, env.UPLOADS_DIR || path.join('public', 'uploads'));

module.exports = {
  root,
  isProd,
  port,
  host: env.HOST || '0.0.0.0',
  siteUrl: (env.SITE_URL || `http://localhost:${port}`).replace(/\/+$/, ''),
  trustProxy: env.TRUST_PROXY || '',
  sessionSecret,
  sessionSecretIsTemporary,
  adminEmail: (env.ADMIN_EMAIL || '').trim(),
  adminPassword: env.ADMIN_PASSWORD || '',
  dataDir,
  dbFile: path.join(dataDir, 'site.db'),
  sessionsFile: path.join(dataDir, 'sessions.db'),
  backupDir: path.join(dataDir, 'backups'),
  privateUploadsDir: path.join(dataDir, 'enquiry-files'),
  publicDir: path.join(root, 'public'),
  uploadsDir,
  viewsDir: path.join(root, 'views'),
  smtp: {
    host: env.SMTP_HOST || '',
    port: parseInt(env.SMTP_PORT || '587', 10),
    secure: String(env.SMTP_SECURE).toLowerCase() === 'true',
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.SMTP_FROM || env.SMTP_USER || ''
  },
  ga4Id: env.GA4_ID || '',
  disableSchedulers: env.DISABLE_SCHEDULERS === '1',
  assetVersion: String(Date.now()).slice(-8)
};
