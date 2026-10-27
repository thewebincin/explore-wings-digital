'use strict';
/**
 * SEO metadata, Schema.org generator, dynamic Sitemap,
 * Robots.txt generator, and SEO health auditing.
 */
const { Settings, Pages, Services, FAQs, Media } = require('../db/queries');
const config = require('./config');

function buildJsonLd(pageSlug = 'home', options = {}) {
  const siteUrl = Settings.get('site_url', config.siteUrl);
  const siteName = Settings.get('site_name', 'Explore Wings Digital Technologies');
  const phone = Settings.get('phone_primary', '+91 75104 05067');
  const phoneSecondary = Settings.get('phone_secondary', '+91 62389 76168');
  const email = Settings.get('email', 'hello@explorewings.in');
  const address = Settings.get('address', 'Trivandrum (Thiruvananthapuram), Kerala, India');
  const logo = `${siteUrl}${Settings.get('logo_path', '/images/logo.png')}`;

  const schemas = [];

  // 1. Organization & LocalBusiness
  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}/#organization`,
    name: siteName,
    url: siteUrl,
    logo,
    image: logo,
    telephone: [phone, phoneSecondary],
    email,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Trivandrum',
      addressRegion: 'Kerala',
      addressCountry: 'IN',
      streetAddress: address
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: Settings.get('geo_latitude', '8.5241'),
      longitude: Settings.get('geo_longitude', '76.9366')
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '18:30'
      }
    ],
    sameAs: [
      Settings.get('instagram', ''),
      Settings.get('facebook', ''),
      Settings.get('linkedin', '')
    ].filter(Boolean)
  };
  schemas.push(localBusiness);

  // 2. WebSite schema
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: siteName,
    publisher: { '@id': `${siteUrl}/#organization` }
  };
  schemas.push(website);

  // 3. FAQPage Schema (on home page)
  if (pageSlug === 'home') {
    const faqList = FAQs.getVisible();
    if (faqList.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqList.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer.replace(/<[^>]*>/g, '')
          }
        }))
      });
    }
  }

  // 4. Service Schema (on services page)
  if (pageSlug === 'services') {
    const serviceList = Services.getVisible();
    for (const s of serviceList) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: s.title,
        description: s.short_desc || s.teaser || '',
        provider: { '@id': `${siteUrl}/#organization` },
        areaServed: {
          '@type': 'State',
          name: 'Kerala'
        }
      });
    }
  }

  return schemas;
}

function generateSitemap() {
  const siteUrl = Settings.get('site_url', config.siteUrl).replace(/\/+$/, '');
  const pages = Pages.getAll().filter(p => p.status === 'published');
  const now = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: `${siteUrl}/`, priority: '1.0', changefreq: 'weekly', lastmod: now }
  ];

  for (const p of pages) {
    if (p.slug === 'home') continue;
    urls.push({
      loc: `${siteUrl}/${p.slug}`,
      priority: p.slug === 'services' ? '0.9' : '0.8',
      changefreq: 'weekly',
      lastmod: p.updated_at ? p.updated_at.split(' ')[0] : now
    });
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const u of urls) {
    xml += `  <url>\n`;
    xml += `    <loc>${u.loc}</loc>\n`;
    xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
    xml += `    <priority>${u.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

function generateRobotsTxt() {
  const siteUrl = Settings.get('site_url', config.siteUrl).replace(/\/+$/, '');
  const isMaintenance = Settings.get('maintenance_mode') === 'on';

  let txt = `User-agent: *\n`;
  if (isMaintenance) {
    txt += `Disallow: /\n`;
  } else {
    txt += `Disallow: /admin/\n`;
    txt += `Disallow: /api/\n`;
    txt += `Allow: /\n\n`;
    txt += `Sitemap: ${siteUrl}/sitemap.xml\n`;
  }

  return txt;
}

function auditSeoHealth() {
  const issues = [];
  let score = 100;

  const pages = Pages.getAll();
  for (const p of pages) {
    if (!p.meta_title || p.meta_title.length < 15) {
      issues.push({ page: p.title, type: 'warning', text: `Meta title is too short or missing.` });
      score -= 5;
    }
    if (!p.meta_description || p.meta_description.length < 50) {
      issues.push({ page: p.title, type: 'warning', text: `Meta description is missing or too short (recommend 120-160 chars).` });
      score -= 5;
    }
    if (!p.focus_keyword) {
      issues.push({ page: p.title, type: 'info', text: `Focus keyword is not set.` });
      score -= 2;
    }
  }

  // Check media missing alt text
  const media = Media.list();
  const missingAlt = media.filter(m => !m.alt_text || !m.alt_text.trim());
  if (missingAlt.length > 0) {
    issues.push({
      page: 'Media Library',
      type: 'warning',
      text: `${missingAlt.length} image(s) missing descriptive alt text.`
    });
    score -= Math.min(15, missingAlt.length * 3);
  }

  // Check critical settings
  if (!Settings.get('google_business_url')) {
    issues.push({ page: 'Settings', type: 'info', text: 'Google Business Listing link is not set.' });
    score -= 3;
  }

  return {
    score: Math.max(0, score),
    issues
  };
}

module.exports = {
  buildJsonLd,
  generateSitemap,
  generateRobotsTxt,
  auditSeoHealth
};
