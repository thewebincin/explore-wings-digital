'use strict';
/**
 * apply-red-shopify.js
 * Restores and synchronizes the complete Shopify-inspired Explore Wings Digital
 * marketing platform in the bold RED theme (#E11D2E) across:
 * 1. C:\Users\NAVANEETH\Downloads\explore-wing-digital (User source)
 * 2. C:\Users\NAVANEETH\.gemini\antigravity\scratch\explore-wing-digital\public
 * 3. C:\Users\NAVANEETH\.gemini\antigravity\scratch\explore-wing-digital\views
 * 4. C:\Users\NAVANEETH\.gemini\antigravity\scratch\explore-wing-digital\docs (GitHub Pages)
 * 5. SQLite database settings (default_theme = 'red')
 */
const fs = require('fs');
const path = require('path');

const downloadsDir = 'C:\\Users\\NAVANEETH\\Downloads\\explore-wing-digital';
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const docsDir = path.join(rootDir, 'docs');
const viewsDir = path.join(rootDir, 'views');

console.log('[apply-red-shopify] Starting synchronization to RED theme Shopify store...');

// ============================================================================
// 1. UPDATE DOWNLOADS CSS: SET RED THEME AS DEFAULT
// ============================================================================
const downloadsCssPath = path.join(downloadsDir, 'style.css');
if (fs.existsSync(downloadsCssPath)) {
  let css = fs.readFileSync(downloadsCssPath, 'utf8');

  // Replace default theme comment and root assignment
  css = css.replace(
    /Default:\s*data-theme="green"/g,
    'Default: data-theme="red"'
  );

  // Ensure :root and html[data-theme="red"] defines red variables first
  const redThemeBlock = `:root,
html[data-theme="red"] {
  --theme-primary: #E11D2E;
  --theme-primary-hover: #BE1221;
  --theme-deep: #7A0A14;
  --theme-tint: #FFF1F2;
  --theme-accent: #F6C744;
  --theme-accent-hover: #FAD66B;
  --theme-accent-ink: #0B1020;
  --theme-rgb: 225, 29, 46;
  --accent-rgb: 246, 199, 68;
}

html[data-theme="green"] {
  --theme-primary: #00A36C;
  --theme-primary-hover: #008A5B;
  --theme-deep: #0B3D2E;
  --theme-tint: #ECFDF5;
  --theme-accent: #B7E34D;
  --theme-accent-hover: #C8EE6B;
  --theme-accent-ink: #0B1020;
  --theme-rgb: 0, 163, 108;
  --accent-rgb: 183, 227, 77;
}`;

  // Replace existing :root / html[data-theme="green"] block
  css = css.replace(
    /:root,\s*html\[data-theme="green"\]\s*\{[^}]+\}\s*html\[data-theme="red"\]\s*\{[^}]+\}/,
    redThemeBlock
  );

  fs.writeFileSync(downloadsCssPath, css, 'utf8');
  console.log('[apply-red-shopify] Updated Downloads style.css (Red default)');
}

// ============================================================================
// 2. UPDATE DOWNLOADS SCRIPT: DEFAULT currentTheme = 'red'
// ============================================================================
const downloadsScriptPath = path.join(downloadsDir, 'script.js');
if (fs.existsSync(downloadsScriptPath)) {
  let js = fs.readFileSync(downloadsScriptPath, 'utf8');

  js = js.replace(/let\s+currentTheme\s*=\s*'green';/, "let currentTheme = 'red';");
  js = js.replace(
    /const\s+savedTheme\s*=\s*localStorage\.getItem\('ew_theme'\);/,
    "const savedTheme = localStorage.getItem('ew_theme') || 'red';"
  );
  js = js.replace(
    /Default:\s*data-theme="green"/g,
    'Default: data-theme="red"'
  );

  fs.writeFileSync(downloadsScriptPath, js, 'utf8');
  console.log('[apply-red-shopify] Updated Downloads script.js (Red default)');
}

// ============================================================================
// 3. UPDATE DOWNLOADS HTML FILES: data-theme="red" + RED SWATCH ACTIVE
// ============================================================================
const htmlFiles = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.html'));
for (const file of htmlFiles) {
  const filePath = path.join(downloadsDir, file);
  let html = fs.readFileSync(filePath, 'utf8');

  // Set data-theme="red"
  html = html.replace(/<html([^>]*?)data-theme="green"/g, '<html$1data-theme="red"');

  // Set red swatch active and green inactive
  html = html.replace(
    /class="theme-swatch swatch-green active"/g,
    'class="theme-swatch swatch-green"'
  );
  html = html.replace(
    /class="theme-swatch swatch-red"/g,
    'class="theme-swatch swatch-red active"'
  );

  // If using data-set-theme with aria-pressed
  html = html.replace(
    /(class="theme-swatch swatch-green"[^>]*?)aria-pressed="true"/g,
    '$1aria-pressed="false"'
  );
  html = html.replace(
    /(class="theme-swatch swatch-red active"[^>]*?)aria-pressed="false"/g,
    '$1aria-pressed="true"'
  );

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`[apply-red-shopify] Updated Downloads ${file} (data-theme="red")`);
}

// ============================================================================
// 4. COPY ASSETS & STYLES TO public/ AND docs/
// ============================================================================
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// Copy assets
copyRecursive(path.join(downloadsDir, 'assets'), path.join(publicDir, 'assets'));
copyRecursive(path.join(downloadsDir, 'assets'), path.join(docsDir, 'assets'));

// Copy logo
fs.copyFileSync(path.join(downloadsDir, 'logo.png'), path.join(publicDir, 'logo.png'));
fs.copyFileSync(path.join(downloadsDir, 'logo.png'), path.join(docsDir, 'logo.png'));
fs.copyFileSync(path.join(downloadsDir, 'logo.png'), path.join(publicDir, 'images', 'logo.png'));
fs.copyFileSync(path.join(downloadsDir, 'logo.png'), path.join(docsDir, 'images', 'logo.png'));

// Copy full 91KB style.css
fs.copyFileSync(path.join(downloadsDir, 'style.css'), path.join(publicDir, 'css', 'style.css'));
fs.copyFileSync(path.join(downloadsDir, 'style.css'), path.join(docsDir, 'css', 'style.css'));

// Copy full 51KB script.js
fs.copyFileSync(path.join(downloadsDir, 'script.js'), path.join(publicDir, 'js', 'script.js'));
fs.copyFileSync(path.join(downloadsDir, 'script.js'), path.join(docsDir, 'js', 'script.js'));

// Copy chatbot.js
fs.copyFileSync(path.join(downloadsDir, 'chatbot.js'), path.join(publicDir, 'js', 'chatbot.js'));
fs.copyFileSync(path.join(downloadsDir, 'chatbot.js'), path.join(docsDir, 'js', 'chatbot.js'));

console.log('[apply-red-shopify] Copied assets, logo, style.css, script.js, chatbot.js to public/ and docs/');

// ============================================================================
// 5. COPY & ADAPT HTML FILES FOR docs/ (GITHUB PAGES)
// ============================================================================
for (const file of htmlFiles) {
  const srcPath = path.join(downloadsDir, file);
  let html = fs.readFileSync(srcPath, 'utf8');

  // Adjust asset paths for docs/
  html = html.replace(/href="style\.css"/g, 'href="./css/style.css?v=gh-pages"');
  html = html.replace(/src="script\.js"/g, 'src="./js/script.js?v=gh-pages"');
  html = html.replace(/src="chatbot\.js"/g, 'src="./js/chatbot.js?v=gh-pages"');
  html = html.replace(/src="logo\.png"/g, 'src="./logo.png"');

  // Inject store.js bridge right before </body> if not already present
  if (!html.includes('store.js') && html.includes('</body>')) {
    html = html.replace('</body>', '  <script src="./js/store.js"></script>\n</body>');
  }

  const destPath = path.join(docsDir, file);
  fs.writeFileSync(destPath, html, 'utf8');
  console.log(`[apply-red-shopify] Generated docs/${file}`);
}

// ============================================================================
// 6. UPDATE SQLITE DATABASE: default_theme = 'red'
// ============================================================================
try {
  const { Settings } = require('../db/queries');
  Settings.set('default_theme', 'red');
  console.log('[apply-red-shopify] Updated SQLite default_theme to red');
} catch (e) {
  console.error('[apply-red-shopify] SQLite update notice:', e.message);
}

console.log('[apply-red-shopify] Completed successfully!');
