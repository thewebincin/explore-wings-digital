'use strict';
const fs = require('fs');
const path = require('path');

const scratchDir = path.resolve(__dirname, '..');
const docsDir = path.join(scratchDir, 'docs');
const publicDir = path.join(scratchDir, 'public');
const downloadsDir = 'C:\\Users\\NAVANEETH\\Downloads\\explore-wing-digital';

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git') continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

console.log('[sync] Synchronizing clean docs to Downloads repo...');

// 1. Copy entire docs directory contents to Downloads
copyRecursive(docsDir, downloadsDir);

// 2. Also place root copies of style.css, script.js, chatbot.js, store.js in Downloads root
fs.copyFileSync(path.join(publicDir, 'css', 'style.css'), path.join(downloadsDir, 'style.css'));
fs.copyFileSync(path.join(publicDir, 'js', 'script.js'), path.join(downloadsDir, 'script.js'));
fs.copyFileSync(path.join(publicDir, 'js', 'chatbot.js'), path.join(downloadsDir, 'chatbot.js'));
if (fs.existsSync(path.join(publicDir, 'js', 'store.js'))) {
  fs.copyFileSync(path.join(publicDir, 'js', 'store.js'), path.join(downloadsDir, 'store.js'));
}

// 3. Admin assets
const dlAdminDir = path.join(downloadsDir, 'admin');
if (!fs.existsSync(dlAdminDir)) fs.mkdirSync(dlAdminDir, { recursive: true });
fs.copyFileSync(path.join(docsDir, 'admin', 'index.html'), path.join(dlAdminDir, 'index.html'));
fs.copyFileSync(path.join(publicDir, 'css', 'admin.css'), path.join(dlAdminDir, 'admin.css'));

// 4. Ensure portfolio.html is removed if present
const dlPortfolio = path.join(downloadsDir, 'portfolio.html');
if (fs.existsSync(dlPortfolio)) {
  fs.unlinkSync(dlPortfolio);
  console.log('[sync] Removed obsolete portfolio.html');
}

// 5. Clean README.md
fs.copyFileSync(path.join(scratchDir, 'README.md'), path.join(downloadsDir, 'README.md'));

console.log('[sync] Synchronization complete.');
