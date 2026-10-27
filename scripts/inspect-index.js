const fs = require('fs');
const content = fs.readFileSync('C:/Users/NAVANEETH/.gemini/antigravity/scratch/explore-wing-digital/views/site/index.ejs', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('SECTION') || l.includes('<section') || l.includes('id=')) {
    console.log((idx+1) + ': ' + l.trim());
  }
});
