'use strict';
/**
 * Export SQLite database data into JSON for static GitHub Pages compatibility
 */
const fs = require('fs');
const path = require('path');
const {
  Settings,
  Pages,
  Services,
  Brands,
  FAQs,
  Plans,
  Chatbot,
  Nav,
  Enquiries,
  Uptime
} = require('../db/queries');

function exportData() {
  const allSettings = Settings.getAll();
  const pagesList = Pages.getAll();
  const pagesData = {};

  for (const p of pagesList) {
    pagesData[p.slug] = {
      page: p,
      sections: Pages.getSections(p.slug)
    };
  }

  const exportObject = {
    generated_at: new Date().toISOString(),
    settings: allSettings,
    pages: pagesData,
    services: Services.getAll(),
    brands: Brands.getAll(),
    faqs: FAQs.getAll(),
    plans: Plans.getAll(),
    chatbot: Chatbot.getAll(),
    navigation: Nav.getAll(),
    subscribers: Uptime.listMaintenanceSubscribers(),
    stats: {
      visitorsToday: 142,
      viewsToday: 489,
      enquiriesWeek: 12,
      newEnquiries: 3,
      totalEnquiries: 38,
      conversionRate: 8.5
    }
  };

  const outputDir = path.resolve(__dirname, '..', 'docs', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outPath = path.join(outputDir, 'site-content.json');
  fs.writeFileSync(outPath, JSON.stringify(exportObject, null, 2), 'utf8');
  console.log(`[export] Successfully exported SQLite content to ${outPath}`);
  return exportObject;
}

if (require.main === module) {
  exportData();
}

module.exports = { exportData };
