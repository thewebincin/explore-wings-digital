'use strict';
/**
 * Test Maintenance Mode Interception & Admin Controls
 */
const http = require('http');
const path = require('path');

process.env.PORT = '3457';
process.env.NODE_ENV = 'development';

const app = require('../server');
const { Settings, Uptime } = require('../db/queries');

const BASE_URL = 'http://127.0.0.1:3457';

function fetchUrl(pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathname, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING MAINTENANCE MODE VERIFICATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Ensure initial state is LIVE (maintenance_mode = 'off')
    Settings.set('maintenance_mode', 'off');
    Settings.set('maintenance_bypass_token', 'ew-test-token');
    Settings.set('maintenance_message', 'Trivandrum studio maintenance test in progress.');
    Settings.set('maintenance_end', 'Today at 6:00 PM IST');
    Settings.set('maintenance_allow_notify', '1');

    console.log('Test 1: Public site when maintenance is OFF');
    const resLive = await fetchUrl('/');
    assert(resLive.statusCode === 200, 'Public homepage returns 200 when maintenance is off');
    assert(resLive.body.includes('Explore Wings Digital Technologies'), 'Live homepage content is rendered');

    // 2. Enable maintenance mode
    console.log('\nTest 2: Turn Maintenance Mode ON');
    Settings.set('maintenance_mode', 'on');

    const resMaint = await fetchUrl('/');
    assert(resMaint.statusCode === 503, 'Public homepage returns 503 when maintenance is on');
    assert(resMaint.headers['retry-after'] === '3600', 'Retry-After: 3600 header is sent for SEO bots');
    assert(resMaint.body.includes('Scheduled Maintenance in Progress'), '503 page renders maintenance badge');
    assert(resMaint.body.includes('Trivandrum studio maintenance test in progress.'), 'Custom maintenance message is displayed');
    assert(resMaint.body.includes('Today at 6:00 PM IST'), 'Estimated back online time is displayed');
    assert(resMaint.body.includes('action="/api/maintenance/notify"'), 'Visitor notification form is present');

    // 3. Verify other public pages are blocked
    console.log('\nTest 3: Verify all public pages are blocked');
    for (const page of ['/services', '/pricing', '/about', '/contact']) {
      const resPage = await fetchUrl(page);
      assert(resPage.statusCode === 503, `Page ${page} returns 503`);
      assert(resPage.body.includes('Scheduled Maintenance in Progress'), `Page ${page} shows maintenance card`);
    }

    // 4. Test Secret Bypass Token
    console.log('\nTest 4: Secret Bypass Token allows live site preview');
    const resBypass = await fetchUrl('/?bypass=ew-test-token');
    assert(resBypass.statusCode === 200, 'Request with valid ?bypass=token returns 200 (Live Site)');
    assert(resBypass.body.includes('Explore Wings Digital Technologies'), 'Bypassed request renders actual site');

    // 5. Test Invalid Bypass Token is still blocked
    const resBadBypass = await fetchUrl('/?bypass=wrong-token');
    assert(resBadBypass.statusCode === 503, 'Request with invalid bypass token returns 503');

    // 6. Test Admin login page is never blocked
    console.log('\nTest 5: Admin routes are never blocked');
    const resAdmin = await fetchUrl('/admin/login');
    assert(resAdmin.statusCode === 200, 'Admin login page returns 200 during maintenance');
    assert(resAdmin.body.includes('Admin Console'), 'Admin login page renders successfully');

    // 7. Test Visitor Notification Subscription Form
    console.log('\nTest 6: Visitor Notification Subscription');
    const postData = JSON.stringify({ contact: 'client@trivandrum.com' });
    const resNotify = await fetchUrl('/api/maintenance/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      body: postData
    });
    assert(resNotify.statusCode === 200, 'POST /api/maintenance/notify returns 200');
    const notifyJson = JSON.parse(resNotify.body);
    assert(notifyJson.success === true, 'Notification response contains success: true');

    const subscribers = Uptime.listMaintenanceSubscribers();
    assert(subscribers.some(s => s.contact === 'client@trivandrum.com'), 'Subscriber saved to database');

    // 8. Turn Maintenance Mode OFF and restore defaults
    console.log('\nTest 7: Turn Maintenance Mode back OFF');
    Settings.set('maintenance_mode', 'off');
    Settings.set('maintenance_bypass_token', 'ew-preview');

    const resRestored = await fetchUrl('/');
    assert(resRestored.statusCode === 200, 'Public homepage returns 200 after maintenance is turned off');

    console.log(`\n=========================================`);
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`=========================================`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

// Give server time to bind and run tests
setTimeout(runTests, 1000);
