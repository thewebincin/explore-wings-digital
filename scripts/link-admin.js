'use strict';
const fs = require('fs');
const path = require('path');
const dir = 'C:\\Users\\NAVANEETH\\Downloads\\explore-wing-digital';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const f of files) {
  const p = path.join(dir, f);
  let html = fs.readFileSync(p, 'utf8');

  // Link admin panel in navbar
  html = html.replace(/href=["']contact\.html["'] class=["']nav-login-link["']/g, 'href="admin/index.html" class="nav-login-link"');
  html = html.replace(/>Log in \/ Contact<\/a>/g, '>Admin Panel</a>');

  // Add Admin Dashboard in footer
  if (!html.includes('admin/index.html') && html.includes('Book a Consultation</a></li>')) {
    html = html.replace('Book a Consultation</a></li>', 'Book a Consultation</a></li>\n            <li><a href="admin/index.html">Admin Panel</a></li>');
  }

  // Ensure store.js is injected
  if (!html.includes('store.js') && html.includes('</body>')) {
    html = html.replace('</body>', '  <script src="store.js"></script>\n</body>');
  }

  fs.writeFileSync(p, html, 'utf8');
  console.log('[link-admin] Linked admin and store.js in', f);
}
