'use strict';
/**
 * Static Site & Static Admin Generator for GitHub Pages (docs/ directory)
 */
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { exportData } = require('./export-data');

const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const viewsDir = path.join(rootDir, 'views');
const publicDir = path.join(rootDir, 'public');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function renderEjs(templatePath, data) {
  return new Promise((resolve, reject) => {
    ejs.renderFile(templatePath, data, { views: [viewsDir] }, (err, str) => {
      if (err) return reject(err);
      resolve(str);
    });
  });
}

function adjustStaticPaths(html, depth = 0) {
  const prefix = depth > 0 ? '../'.repeat(depth) : './';

  let out = html;
  // Convert root-relative assets
  out = out.replace(/(href|src)=["']\/css\/([^"']+)["']/g, `$1="${prefix}css/$2"`);
  out = out.replace(/(href|src)=["']\/js\/([^"']+)["']/g, `$1="${prefix}js/$2"`);
  out = out.replace(/(href|src)=["']\/images\/([^"']+)["']/g, `$1="${prefix}images/$2"`);
  out = out.replace(/(href|src)=["']\/fonts\/([^"']+)["']/g, `$1="${prefix}fonts/$2"`);
  out = out.replace(/(href|src)=["']\/uploads\/([^"']+)["']/g, `$1="${prefix}uploads/$2"`);

  // Convert root-relative page navigation links
  out = out.replace(/href=["']\/["']/g, `href="${prefix}index.html"`);
  out = out.replace(/href=["']\/services["']/g, `href="${prefix}services.html"`);
  out = out.replace(/href=["']\/pricing["']/g, `href="${prefix}pricing.html"`);
  out = out.replace(/href=["']\/about["']/g, `href="${prefix}about.html"`);
  out = out.replace(/href=["']\/contact["']/g, `href="${prefix}contact.html"`);
  out = out.replace(/href=["']\/admin["']/g, `href="${prefix}admin/index.html"`);
  out = out.replace(/href=["']\/admin\/maintenance["']/g, `href="${prefix}admin/index.html#maintenance"`);
  out = out.replace(/href=["']\/admin\/pages["']/g, `href="${prefix}admin/index.html#pages"`);
  out = out.replace(/href=["']\/admin\/services["']/g, `href="${prefix}admin/index.html#services"`);
  out = out.replace(/href=["']\/admin\/brands["']/g, `href="${prefix}admin/index.html#brands"`);
  out = out.replace(/href=["']\/admin\/plans["']/g, `href="${prefix}admin/index.html#pricing"`);
  out = out.replace(/href=["']\/admin\/faqs["']/g, `href="${prefix}admin/index.html#faqs"`);

  // Inject client-side bridge script
  if (out.includes('</body>')) {
    out = out.replace('</body>', `  <script src="${prefix}js/store.js"></script>\n</body>`);
  }

  return out;
}

async function buildStatic() {
  console.log('[build-static] Starting static site build for GitHub Pages...');

  // 1. Export database content to JSON
  const siteData = exportData();

  // 2. Ensure docs directory exists
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  // 3. Copy public assets into docs
  copyDirRecursive(path.join(publicDir, 'css'), path.join(docsDir, 'css'));
  copyDirRecursive(path.join(publicDir, 'js'), path.join(docsDir, 'js'));
  copyDirRecursive(path.join(publicDir, 'images'), path.join(docsDir, 'images'));
  copyDirRecursive(path.join(publicDir, 'uploads'), path.join(docsDir, 'uploads'));
  copyDirRecursive(path.join(publicDir, 'fonts'), path.join(docsDir, 'fonts'));

  // Copy main logo to docs root
  if (fs.existsSync(path.join(rootDir, 'logo.png'))) {
    fs.copyFileSync(path.join(rootDir, 'logo.png'), path.join(docsDir, 'logo.png'));
  }

  // 4. Create .nojekyll for GitHub Pages so fonts and underscores are served
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '', 'utf8');

  // Shared locals
  const sharedLocals = {
    settings: siteData.settings,
    assetVersion: 'gh-pages',
    siteUrl: '.',
    locals: {
      currentPath: '/',
      isMaintenanceActive: false,
      maintenanceBypass: false
    }
  };

  const pagesToRender = [
    {
      slug: 'home',
      outFile: 'index.html',
      template: 'site/index.ejs',
      locals: {
        page: siteData.pages.home.page,
        sections: siteData.pages.home.sections,
        services: siteData.services,
        brands: siteData.brands,
        faqs: siteData.faqs,
        plans: siteData.plans
      }
    },
    {
      slug: 'services',
      outFile: 'services.html',
      template: 'site/services.ejs',
      locals: {
        page: siteData.pages.services.page,
        sections: siteData.pages.services.sections,
        services: siteData.services
      }
    },
    {
      slug: 'pricing',
      outFile: 'pricing.html',
      template: 'site/pricing.ejs',
      locals: {
        page: siteData.pages.pricing.page,
        sections: siteData.pages.pricing.sections,
        plans: siteData.plans,
        comparisonRows: []
      }
    },
    {
      slug: 'about',
      outFile: 'about.html',
      template: 'site/about.ejs',
      locals: {
        page: siteData.pages.about.page,
        sections: siteData.pages.about.sections,
        brands: siteData.brands
      }
    },
    {
      slug: 'contact',
      outFile: 'contact.html',
      template: 'site/contact.ejs',
      locals: {
        page: siteData.pages.contact.page,
        sections: siteData.pages.contact.sections
      }
    },
    {
      slug: 'maintenance',
      outFile: 'maintenance.html',
      template: 'site/maintenance.ejs',
      locals: {
        siteName: siteData.settings.site_name,
        maintenanceMessage: siteData.settings.maintenance_message,
        estimatedEnd: siteData.settings.maintenance_end,
        allowNotify: true,
        isAdmin: false
      }
    },
    {
      slug: '404',
      outFile: '404.html',
      template: 'site/404.ejs',
      locals: {
        page: { title: '404 Not Found | Explore Wings' }
      }
    }
  ];

  for (const p of pagesToRender) {
    const tplPath = path.join(viewsDir, p.template);
    const data = {
      ...sharedLocals,
      ...p.locals,
      page: p.locals.page || { title: p.slug },
      locals: {
        ...sharedLocals.locals,
        currentPath: p.slug === 'home' ? '/' : `/${p.slug}`
      }
    };

    let innerHtml = await renderEjs(tplPath, data);

    let fullHtml;
    if (p.slug === 'maintenance') {
      fullHtml = innerHtml;
    } else {
      fullHtml = await renderEjs(path.join(viewsDir, 'site/layout.ejs'), {
        ...data,
        body: innerHtml
      });
    }

    const adjustedHtml = adjustStaticPaths(fullHtml, 0);
    fs.writeFileSync(path.join(docsDir, p.outFile), adjustedHtml, 'utf8');
    console.log(`[build-static] Rendered docs/${p.outFile}`);
  }

  console.log('[build-static] Static pages generated successfully.');
}

if (require.main === module) {
  buildStatic().catch(err => {
    console.error('[build-static] Error:', err);
    process.exit(1);
  });
}

module.exports = { buildStatic };
