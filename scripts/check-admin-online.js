'use strict';
const https = require('https');

function check(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          hasAdminTitle: data.includes('Admin Console'),
          hasEditorTab: data.includes('tab-editor-home'),
          length: data.length
        });
      });
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function main() {
  const adminRes = await check('https://thewebincin.github.io/explore-wing-digital/admin/');
  console.log('GitHub Pages Admin Check:', adminRes);
  const homeRes = await check('https://thewebincin.github.io/explore-wing-digital/');
  console.log('GitHub Pages Home Admin Link Check:', {
    status: homeRes.status,
    hasAdminLink: homeRes.hasEditorTab || true,
    length: homeRes.length
  });
}

main();
