'use strict';
/**
 * Test Maintenance Mode Interception & Section-by-Section Editing
 */
const http = require('http');
const path = require('path');

process.env.PORT = '3458';
process.env.NODE_ENV = 'development';

const app = require('../server');
const { Settings, Pages, Uptime } = require('../db/queries');

const BASE_URL = 'http://127.0.0.1:3458';

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
  console.log('=== STARTING MAINTENANCE & SECTION-BY-SECTION TEST SUITE ===\n');
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
    // 1. Initial State: Live
    Settings.set('maintenance_mode', 'off');
    Settings.set('maintenance_bypass_token', 'ew-test-token');
    Settings.set('maintenance_message', 'Trivandrum studio maintenance test in progress.');
    Settings.set('maintenance_end', 'Today at 6:00 PM IST');
    Settings.set('maintenance_allow_notify', '1');

    console.log('--- 1. Live Site Baseline ---');
    const resLive = await fetchUrl('/');
    assert(resLive.statusCode === 200, 'Public homepage returns 200 when maintenance is off');

    // 2. Turn Maintenance Mode ON
    console.log('\n--- 2. Maintenance Mode Enabled (Public 503) ---');
    Settings.set('maintenance_mode', 'on');

    const resMaint = await fetchUrl('/');
    assert(resMaint.statusCode === 503, 'Public visitor receives HTTP 503');
    assert(resMaint.headers['retry-after'] === '3600', 'Retry-After 3600 hint sent for search crawlers');
    assert(resMaint.body.includes('Scheduled Maintenance in Progress'), 'Maintenance badge rendered');
    assert(resMaint.body.includes('Trivandrum studio maintenance test in progress.'), 'Custom maintenance message rendered');
    assert(resMaint.body.includes('Today at 6:00 PM IST'), 'Estimated return time displayed');

    // 3. Verify all other public routes return 503
    for (const route of ['/services', '/pricing', '/about', '/contact']) {
      const r = await fetchUrl(route);
      assert(r.statusCode === 503, `Public route ${route} blocked with 503`);
    }

    // 4. Secret Bypass Token allows viewing live site
    console.log('\n--- 3. Bypass Token & Preview Modes ---');
    const resBypass = await fetchUrl('/?bypass=ew-test-token');
    assert(resBypass.statusCode === 200, 'Request with valid ?bypass=token returns 200 (Live Site)');
    assert(resBypass.body.includes('Live Preview Active'), 'Live preview amber warning banner displayed at top of page');

    // Invalid token still blocked
    const resBadToken = await fetchUrl('/?bypass=wrong-token');
    assert(resBadToken.statusCode === 503, 'Request with wrong token blocked with 503');

    // Turn off preview
    const resPreviewOff = await fetchUrl('/?preview=off');
    assert(resPreviewOff.statusCode === 503, 'Request with ?preview=off clears preview and returns 503');

    // 5. Admin Authentication & Session Maintenance Experience
    console.log('\n--- 4. Admin Session Maintenance & Live Preview Toggle ---');
    const loginData = 'email=admin%40explorewings.com&password=AdminExploreWings2026%21';
    const loginRes = await fetchUrl('/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData)
      },
      body: loginData
    });
    assert(loginRes.statusCode === 302, 'Admin login succeeds and redirects (302)');
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];

    // Admin visiting / while maintenance is on sees the 503 page by default WITH the admin confirmation chip!
    const adminVisitMaint = await fetchUrl('/', { headers: { Cookie: cookie } });
    assert(adminVisitMaint.statusCode === 503, 'Admin visiting homepage sees 503 maintenance page by default');
    assert(adminVisitMaint.body.includes('Admin Logged In'), '503 page shows admin confirmation chip');
    assert(adminVisitMaint.body.includes('href="/?preview=live"'), '503 page includes 1-click "Preview Live Site" button');

    // Admin clicking Preview Live Site
    const adminPreviewLive = await fetchUrl('/?preview=live', { headers: { Cookie: cookie } });
    assert(adminPreviewLive.statusCode === 200, 'Admin with ?preview=live sees 200 live site');
    assert(adminPreviewLive.body.includes('Live Preview Active'), 'Live site displays floating admin preview warning banner');

    // Admin clicking Exit Preview
    const adminExitPreview = await fetchUrl('/?preview=off', { headers: { Cookie: cookie } });
    assert(adminExitPreview.statusCode === 503, 'Admin with ?preview=off returns to 503 maintenance screen');

    // 6. Section-by-Section Content Editing
    console.log('\n--- 5. Section-by-Section Editing Tests ---');
    // Read CSRF token from admin pages
    const pagesRes = await fetchUrl('/admin/pages', { headers: { Cookie: cookie } });
    assert(pagesRes.statusCode === 200, 'GET /admin/pages returns 200');

    const csrfMatch = pagesRes.body.match(/content="([a-f0-9]{48})"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    // Edit Hero Section on Home Page
    const heroPost = `_csrf=${csrfToken}&title=Trivandrum+Digital+Mastery+2026&subtitle=Handcrafted+Websites&body=Custom+software+and+branding+built+directly+in+Kerala.`;
    const editHeroRes = await fetchUrl('/admin/pages/home/section/hero', {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(heroPost)
      },
      body: heroPost
    });
    assert(editHeroRes.statusCode === 302, 'POST /admin/pages/home/section/hero updates section and redirects (302)');

    // Verify in database
    const homeSections = Pages.getSections('home');
    assert(homeSections.hero && homeSections.hero.title === 'Trivandrum Digital Mastery 2026', 'Hero section title updated in SQLite');

    // Add a custom section to Home Page
    const addSecPost = `_csrf=${csrfToken}&section_key=awards_highlight&title=Recognized+in+Kerala&subtitle=Honors&body=Featured+by+local+founders.`;
    const addSecRes = await fetchUrl('/admin/pages/home/section-add', {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(addSecPost)
      },
      body: addSecPost
    });
    assert(addSecRes.statusCode === 302, 'POST /admin/pages/home/section-add creates custom section and redirects');

    const updatedHome = Pages.getSections('home');
    assert(Boolean(updatedHome.awards_highlight), 'Custom section awards_highlight created in SQLite');

    // Delete custom section
    const delSecPost = `_csrf=${csrfToken}`;
    const delSecRes = await fetchUrl('/admin/pages/home/section/awards_highlight/delete', {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(delSecPost)
      },
      body: delSecPost
    });
    assert(delSecRes.statusCode === 302, 'POST /admin/pages/home/section/:secKey/delete deletes section and redirects');
    assert(!Pages.getSections('home').awards_highlight, 'Custom section removed from SQLite');

    // Restore original Hero section title
    Pages.saveSection('home', 'hero', {
      title: 'Websites & digital branding that bring real enquiries to your business.',
      subtitle: 'We work directly with founders, resorts, clinics, and local stores in Trivandrum to fix slow websites, shoot authentic media, and get found on Google.',
      button_text: 'Get free consultation'
    });

    // 7. Turn Maintenance Mode back OFF
    console.log('\n--- 6. Disable Maintenance Mode & Restore Live Site ---');
    const toggleOffPost = `_csrf=${csrfToken}`;
    const toggleOffRes = await fetchUrl('/admin/maintenance/toggle', {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(toggleOffPost)
      },
      body: toggleOffPost
    });
    assert(toggleOffRes.statusCode === 302, 'POST /admin/maintenance/toggle turns off maintenance');

    const resPublicRestored = await fetchUrl('/');
    assert(resPublicRestored.statusCode === 200, 'Public homepage returns 200 live site to all visitors');

    // Cleanup bypass token
    Settings.set('maintenance_bypass_token', 'ew-preview');

    console.log(`\n======================================================`);
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`======================================================`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

setTimeout(runTests, 1000);
