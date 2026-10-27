/**
 * Explore Wings Digital Technologies - Privacy-First Analytics Beacon (< 1.5 KB)
 * Cookieless, GDPR-compliant. Sends engagement beacon without cookies or third-party trackers.
 */

(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.navigator) return;

  const startTime = Date.now();
  let maxScroll = 0;

  // Track max scroll depth
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      const depth = Math.round((scrollY / docHeight) * 100);
      if (depth > maxScroll) maxScroll = depth;
    }
  }, { passive: true });

  function sendBeaconData(event) {
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    const payload = JSON.stringify({
      path: window.location.pathname,
      referrer: document.referrer || '',
      screen_width: window.innerWidth,
      duration_seconds: elapsedSeconds,
      scroll_depth: maxScroll,
      event: event || 'heartbeat'
    });

    const endpoint = '/api/analytics/beacon';

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  }

  // Initial page view event
  setTimeout(() => sendBeaconData('pageview'), 1000);

  // Periodic heartbeat every 20 seconds
  const heartbeat = setInterval(() => sendBeaconData('heartbeat'), 20000);

  // Send final engagement metrics on unload
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendBeaconData('leave');
    }
  });

  window.addEventListener('pagehide', () => {
    clearInterval(heartbeat);
    sendBeaconData('leave');
  });
})();
