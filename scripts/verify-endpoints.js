'use strict';
const http = require('http');

function check(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          hasRedTheme: data.includes('data-theme="red"'),
          hasMockup: data.includes('ui-browser-mockup'),
          hasRedActive: data.includes('swatch-red active'),
          length: data.length
        });
      });
    }).on('error', (e) => resolve({ error: e.message }));
  });
}

async function main() {
  const home = await check('http://127.0.0.1:3000/');
  console.log('Homepage Check:', home);
  const services = await check('http://127.0.0.1:3000/services');
  console.log('Services Check:', services);
  const admin = await check('http://127.0.0.1:3000/admin/login');
  console.log('Admin Login Check:', admin);

  const fs = require('fs');
  const files = ['index.html', 'services.html', 'pricing.html', 'about.html', 'contact.html', 'portfolio.html', '404.html', 'maintenance.html'];
  console.log('\nGitHub Pages docs/ checks:');
  for (const f of files) {
    const content = fs.readFileSync('docs/' + f, 'utf8');
    console.log(f, 'has data-theme=red:', content.includes('data-theme="red"'), 'length:', content.length);
  }
}

main();
