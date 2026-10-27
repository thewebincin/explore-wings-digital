'use strict';
/**
 * Comprehensive Automated Smoke Test for Explore Wings Web Application
 */

const http = require('http');
const app = require('../server');
const { Settings, Pages, Services, Brands, FAQs, Plans, Chatbot, Enquiries } = require('../db/queries');

const TEST_PORT = 3456;
let server;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path,
        method: options.method || 'GET',
        headers: options.headers || {}
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log(' EXPLORE WINGS AUTOMATED SMOKE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Direct Data Layer Checks
  console.log('1. Database Query Layer Validation:');
  const settings = Settings.getAll();
  assert(settings && settings.site_name === 'Explore Wings Digital Technologies', 'Settings table loaded correctly');
  assert(settings && settings.address === 'Trivandrum, Kerala, India', 'Studio address is Trivandrum, Kerala');

  const homePage = Pages.getBySlug('home');
  assert(homePage && homePage.slug === 'home', 'Home page record exists in SQLite');

  const services = Services.getVisible();
  assert(services && services.length === 6, `Visible services count is exactly 6 (Found: ${services.length})`);

  const brands = Brands.getVisible();
  assert(brands && brands.length >= 6, `Visible brands count is >= 6 (Found: ${brands.length})`);

  const faqs = FAQs.getVisible();
  assert(faqs && faqs.length >= 5, `Visible FAQs count is >= 5 (Found: ${faqs.length})`);

  const plans = Plans.getVisible();
  assert(plans && plans.length === 3, `Pricing tiers count is 3 (Found: ${plans.length})`);

  const intents = Chatbot.getAll();
  assert(intents && intents.length >= 8, `Chatbot intents count is >= 8 (Found: ${intents.length})`);

  // 2. HTTP Server Endpoints Checks
  console.log('\n2. HTTP Server Endpoint Verification:');

  try {
    // 2.1 Home Page
    const homeRes = await request('/');
    assert(homeRes.status === 200, 'GET / returned HTTP 200');
    assert(homeRes.body.includes('Explore Wings'), 'Home page contains brand name');
    assert(homeRes.body.includes('Trivandrum'), 'Home page contains "Trivandrum" location');
    assert(homeRes.body.includes('Aadisaktthi Resorts'), 'Home page contains seeded brand');

    // 2.2 Services Page
    const svcRes = await request('/services');
    assert(svcRes.status === 200, 'GET /services returned HTTP 200');
    assert(svcRes.body.includes('Website Design') || svcRes.body.includes('Custom Websites'), 'Services page renders services');

    // 2.3 Pricing Page
    const priceRes = await request('/pricing');
    assert(priceRes.status === 200, 'GET /pricing returned HTTP 200');
    assert(priceRes.body.includes('Essential') && priceRes.body.includes('Signature'), 'Pricing page renders plans');

    // 2.4 About Page
    const aboutRes = await request('/about');
    assert(aboutRes.status === 200, 'GET /about returned HTTP 200');
    assert(aboutRes.body.includes('Technopark') || aboutRes.body.includes('Trivandrum'), 'About page includes Trivandrum landmarks');

    // 2.5 Contact Page
    const contactRes = await request('/contact');
    assert(contactRes.status === 200, 'GET /contact returned HTTP 200');
    assert(contactRes.body.includes('Project Enquiry Form') || contactRes.body.includes('Send us a message') || contactRes.body.includes('luxuryContactForm'), 'Contact page renders enquiry form');

    // 2.6 SEO Sitemap & Robots
    const sitemapRes = await request('/sitemap.xml');
    assert(sitemapRes.status === 200 && sitemapRes.body.includes('<urlset'), 'GET /sitemap.xml returned valid XML');

    const robotsRes = await request('/robots.txt');
    assert(robotsRes.status === 200 && robotsRes.body.includes('Sitemap:'), 'GET /robots.txt returned valid robots');

    // 2.7 301 Legacy Redirects
    const legacyRes = await request('/index.html');
    assert(legacyRes.status === 301, 'GET /index.html redirects 301 to clean URL /');

    // 2.8 404 Error Page
    const missingRes = await request('/non-existent-page-test-12345');
    assert(missingRes.status === 404, 'GET unknown route returns HTTP 404');
    assert(missingRes.body.includes('This page could not be found'), '404 renders branded error template');

    // 2.9 Admin Login Page
    const loginRes = await request('/admin/login');
    assert(loginRes.status === 200, 'GET /admin/login returned HTTP 200');
    assert(loginRes.body.includes('Sign In to Admin'), 'Admin login page renders successfully');

    // 2.10 API: Consultation Submission
    const consultRes = await request('/api/consultation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact: '+91 94460 99999',
        source_page: 'smoke_test',
        _hp: ''
      })
    });
    assert(consultRes.status === 200, 'POST /api/consultation returned HTTP 200');
    const consultJson = JSON.parse(consultRes.body);
    assert(consultJson.success === true, 'Consultation lead saved successfully');

    // 2.11 API: Chatbot Intent
    const chatRes = await request('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'how much is a website in Kerala?' })
    });
    assert(chatRes.status === 200, 'POST /api/chatbot returned HTTP 200');
    const chatJson = JSON.parse(chatRes.body);
    assert(chatJson.reply && chatJson.reply.length > 10, 'Chatbot returned intelligent match');

    // 2.12 API: Analytics Beacon
    const beaconRes = await request('/api/analytics/beacon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: '/pricing',
        referrer: 'https://google.com',
        screen_width: 1440,
        duration_seconds: 35,
        event: 'test_beacon'
      })
    });
    assert(beaconRes.status === 200 || beaconRes.status === 204, 'POST /api/analytics/beacon returned HTTP 200 or 204');

    // 2.13 Admin Login Authentication & Session Dashboard
    const loginPostData = 'email=admin%40explorewings.com&password=AdminExploreWings2026%21';
    const loginPostRes = await request('/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginPostData)
      },
      body: loginPostData
    });
    assert(loginPostRes.status === 302, 'POST /admin/login authenticates and redirects (302)');

    // Extract cookie
    const cookies = loginPostRes.headers['set-cookie'];
    assert(cookies && cookies.length > 0, 'Admin session cookie issued');
    const cookieHeader = cookies ? cookies[0].split(';')[0] : '';

    // 2.14 Authenticated Admin Dashboard
    const dashRes = await request('/admin', {
      headers: { Cookie: cookieHeader }
    });
    assert(dashRes.status === 200, 'GET /admin with session returns HTTP 200');
    assert(dashRes.body.includes('Dashboard Overview') && dashRes.body.includes('Quick Actions'), 'Admin dashboard renders metrics and shortcuts');

    // 2.15 Admin Maintenance Panel & Live Toggle
    const maintViewRes = await request('/admin/maintenance', {
      headers: { Cookie: cookieHeader }
    });
    assert(maintViewRes.status === 200, 'GET /admin/maintenance returns HTTP 200');
    assert(maintViewRes.body.includes('Maintenance Mode &amp; Server Health'), 'Maintenance view renders control panel');

    const csrfMatch = maintViewRes.body.match(/name="_csrf" value="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    // Toggle Maintenance Mode ON via Admin POST
    const toggleOnRes = await request('/admin/maintenance/toggle', {
      method: 'POST',
      headers: { 
        Cookie: cookieHeader,
        'x-csrf-token': csrfToken
      }
    });
    assert(toggleOnRes.status === 302, 'POST /admin/maintenance/toggle redirects (302)');

    // Verify public visitor is now blocked with 503
    const publicBlockedRes = await request('/');
    assert(publicBlockedRes.status === 503, 'Public homepage blocked with HTTP 503 during maintenance');
    assert(publicBlockedRes.body.includes('Scheduled Maintenance in Progress'), 'Public visitor sees branded 503 maintenance screen');

    // Verify secret bypass preview works for public visitor
    const currentBypassToken = Settings.get('maintenance_bypass_token', 'ew-preview');
    const bypassRes = await request(`/?bypass=${encodeURIComponent(currentBypassToken)}`);
    assert(bypassRes.status === 200, 'Secret bypass query returns HTTP 200 live site');

    // Toggle Maintenance Mode back OFF via Admin POST
    const toggleOffRes = await request('/admin/maintenance/toggle', {
      method: 'POST',
      headers: { 
        Cookie: cookieHeader,
        'x-csrf-token': csrfToken
      }
    });
    assert(toggleOffRes.status === 302, 'POST /admin/maintenance/toggle off redirects (302)');

    // Verify public visitor is live again
    const publicRestoredRes = await request('/');
    assert(publicRestoredRes.status === 200, 'Public homepage unblocked with HTTP 200 after maintenance turned off');
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n----------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------');

  if (failed === 0) {
    console.log('\nALL SMOKE TESTS COMPLETED WITH 100% SUCCESS!\n');
    process.exit(0);
  } else {
    console.error(`\n${failed} TEST(S) FAILED.\n`);
    process.exit(1);
  }
}

// Start test server
server = app.listen(TEST_PORT, () => {
  runTests().then(() => {
    server.close();
  });
});
