'use strict';
/**
 * First-party, privacy-friendly analytics middleware.
 * Zero cookies used. Generates daily-salted hash of IP + User-Agent.
 * Excludes admin sessions, bots, and users with Do Not Track enabled.
 */
const crypto = require('crypto');
const { Analytics } = require('../db/queries');

const BOT_REGEX = /bot|crawler|spider|crawling|slurp|bingbot|googlebot|yandex|duckduckbot/i;

function getDailySalt() {
  const day = new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(day + 'ew_analytics_salt').digest('hex');
}

function parseDevice(ua) {
  if (!ua) return 'desktop';
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
    return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

function parseBrowser(ua) {
  if (!ua) return 'Other';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/edg/i.test(ua)) return 'Edge';
  if (/opera|opr/i.test(ua)) return 'Opera';
  return 'Other';
}

function parseSource(referrer) {
  if (!referrer) return 'Direct';
  const r = referrer.toLowerCase();
  if (r.includes('google')) return 'Google';
  if (r.includes('instagram')) return 'Instagram';
  if (r.includes('whatsapp') || r.includes('wa.me')) return 'WhatsApp';
  if (r.includes('facebook') || r.includes('fb.com')) return 'Facebook';
  if (r.includes('linkedin')) return 'LinkedIn';
  return 'Other';
}

function analyticsTrackerMiddleware(req, res, next) {
  // Only track GET requests on public HTML pages
  if (req.method !== 'GET') return next();
  if (
    req.path.startsWith('/admin') ||
    req.path.startsWith('/api') ||
    req.path.startsWith('/public') ||
    req.path.startsWith('/images') ||
    req.path.startsWith('/fonts') ||
    req.path.startsWith('/uploads') ||
    req.path.startsWith('/css') ||
    req.path.startsWith('/js') ||
    req.path === '/robots.txt' ||
    req.path === '/sitemap.xml'
  ) {
    return next();
  }

  // Exclude logged in admins from analytics pollution
  if (req.user) return next();

  // Respect Do Not Track
  if (req.headers['dnt'] === '1') return next();

  const ua = req.headers['user-agent'] || '';
  if (BOT_REGEX.test(ua)) return next();

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const dailySalt = getDailySalt();
  const sessionHash = crypto.createHash('sha256').update(ip + ua + dailySalt).digest('hex').slice(0, 32);

  const referrer = req.headers['referer'] || '';
  const source = req.query.utm_source ? req.query.utm_source : parseSource(referrer);
  const utmCampaign = req.query.utm_campaign || '';
  const deviceType = parseDevice(ua);
  const browser = parseBrowser(ua);

  // Region / country estimation
  let country = 'IN';
  let region = 'Kerala';

  try {
    const viewId = Analytics.recordView({
      session_hash: sessionHash,
      path: req.path,
      referrer,
      source,
      utm_campaign: utmCampaign,
      device_type: deviceType,
      browser,
      screen_width: null,
      country,
      region,
      time_on_page: 0
    });

    res.locals.analyticsPageViewId = viewId;
    res.locals.analyticsSessionHash = sessionHash;
  } catch (err) {
    // Non-blocking
  }

  next();
}

module.exports = { analyticsTrackerMiddleware };
