const fs = require('fs');
const path = require('path');

const FORBIDDEN = ['roster', 'profile', 'resources', 'guides', 'featured', 'news', 'blog', 'article', 'coming soon', '[edit'];

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function scanDir(dir, baseDir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'data' || ent.name === 'package-lock.json' || ent.name.endsWith('.db') || ent.name === 'legacy-static') continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      results.push(...scanDir(full, baseDir));
    } else if (/\.(html|ejs|js|css|json)$/i.test(ent.name)) {
      if (ent.name.includes('scan') || ent.name.includes('verify') || ent.name.includes('smoke') || ent.name.includes('test')) continue;
      const content = fs.readFileSync(full, 'utf8');
      FORBIDDEN.forEach(word => {
        const regex = new RegExp(escapeRegex(word), 'gi');
        const matches = [...content.matchAll(regex)];
        if (matches.length > 0) {
          results.push({ file: path.relative(baseDir, full), word, count: matches.length });
        }
      });
    }
  }
  return results;
}

const dir = process.argv[2] || '.';
const res = scanDir(dir, dir);
console.log(`Scan results for ${dir}:`);
if (res.length === 0) {
  console.log('  Clean! No forbidden words found.');
} else {
  res.forEach(r => console.log(`  ${r.file} -> "${r.word}" (${r.count} matches)`));
}
