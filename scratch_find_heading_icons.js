const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.astro') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/<h2\b/i.test(lines[i])) {
      const start = Math.max(0, i - 12);
      const end = Math.min(lines.length, i + 8);
      const block = lines.slice(start, end).join('\n');
      if (block.includes('<svg') || /<[A-Z]\w+[^>]*class(Name)?=/.test(block)) {
        console.log(`MATCH: ${file} Line ${i + 1}`);
        for (let j = start; j < end; j++) {
          console.log(`  ${j + 1}: ${lines[j]}`);
        }
        console.log('--------------------------------------------------');
      }
    }
  }
}
