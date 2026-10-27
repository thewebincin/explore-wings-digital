'use strict';
const https = require('https');

https.get('https://thewebincin.github.io/explore-wing-digital/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('data-theme=red:', data.includes('data-theme="red"'));
    console.log('Length:', data.length);
  });
}).on('error', err => console.error(err.message));
