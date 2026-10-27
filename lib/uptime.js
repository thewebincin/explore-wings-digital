'use strict';
/**
 * Uptime monitor & periodic scheduler.
 * Pings the local site every minute, records status code and response time,
 * tracks 30-day percentage, and sends downtime alert email if down for > 2 mins.
 */
const http = require('http');
const https = require('https');
const config = require('./config');
const { Uptime, Settings } = require('../db/queries');
const { sendMail } = require('./email');

let consecutiveFailures = 0;
let alertedDowntime = false;
let monitorInterval = null;

function checkUptime() {
  const targetUrl = config.siteUrl;
  const startTime = Date.now();
  const isHttps = targetUrl.startsWith('https');
  const client = isHttps ? https : http;

  const req = client.get(targetUrl, { timeout: 8000 }, (res) => {
    const elapsed = Date.now() - startTime;
    // 200, 301, 302, 503 (maintenance) are valid server responses
    const isUp = res.statusCode < 500 || res.statusCode === 503;

    if (isUp) {
      Uptime.log('UP', elapsed, res.statusCode, null);
      if (consecutiveFailures > 0) {
        if (alertedDowntime) {
          sendRecoveryNotification(elapsed);
          alertedDowntime = false;
        }
        consecutiveFailures = 0;
      }
    } else {
      handleDowntime(elapsed, res.statusCode, `Server error: HTTP ${res.statusCode}`);
    }
  });

  req.on('timeout', () => {
    req.destroy();
    handleDowntime(Date.now() - startTime, 0, 'Connection timed out (> 8s)');
  });

  req.on('error', (err) => {
    handleDowntime(Date.now() - startTime, 0, err.message);
  });
}

function handleDowntime(elapsed, statusCode, errorMsg) {
  consecutiveFailures++;
  Uptime.log('DOWN', elapsed, statusCode, errorMsg);

  // If failed 2 consecutive pings (2 minutes) and haven't alerted yet
  if (consecutiveFailures >= 2 && !alertedDowntime) {
    alertedDowntime = true;
    sendDowntimeNotification(errorMsg);
  }
}

async function sendDowntimeNotification(errorMsg) {
  const alertEmail = Settings.get('uptime_alert_email', config.adminEmail);
  if (!alertEmail) return;

  const siteName = Settings.get('site_name', 'Explore Wings Digital Technologies');
  await sendMail({
    to: alertEmail,
    subject: `🚨 ALERT: ${siteName} is DOWN`,
    text: `Your website ${config.siteUrl} has failed consecutive uptime checks.\n\nReason: ${errorMsg}\nTime: ${new Date().toISOString()}`
  });
}

async function sendRecoveryNotification(responseTime) {
  const alertEmail = Settings.get('uptime_alert_email', config.adminEmail);
  if (!alertEmail) return;

  const siteName = Settings.get('site_name', 'Explore Wings Digital Technologies');
  await sendMail({
    to: alertEmail,
    subject: `✅ RECOVERED: ${siteName} is back UP`,
    text: `Your website ${config.siteUrl} is responding normally again.\nResponse time: ${responseTime}ms\nTime: ${new Date().toISOString()}`
  });
}

function startUptimeMonitor() {
  if (config.disableSchedulers) return;
  // Run check every 60 seconds
  monitorInterval = setInterval(checkUptime, 60000);
}

function stopUptimeMonitor() {
  if (monitorInterval) clearInterval(monitorInterval);
}

module.exports = {
  startUptimeMonitor,
  stopUptimeMonitor,
  checkUptime
};
