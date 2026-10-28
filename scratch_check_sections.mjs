import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.astro') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

let out = '';
const files = walk('src');
for (const file of files) {
  if (file.includes('admin') || file.includes('scratch')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/<h2\b/i.test(line)) {
      const start = Math.max(0, i - 8);
      const end = Math.min(lines.length, i + 4);
      const block = lines.slice(start, end).join('\n');
      
      const hasIconInside = /<h2[^>]*>[\s\S]*?(<svg|<[A-Z]\w+[^>]*class)/i.test(lines.slice(i, i + 5).join('\n'));
      const hasIconBeside = /<(?:span|div)[^>]*class(?:Name)?=[\"'][^\"']*(?:w-7|w-8|w-9|w-10|w-12|rounded-xl|rounded-lg)[^\"']*[\"']>[\s\S]*?(?:<svg|<[A-Z]\w+)[\s\S]*?<\/(?:span|div)>[\s\S]*?<h2/i.test(block);
      const hasIconInEyebrow = /<(?:div|span)[^>]*class(?:Name)?=[\"'][^\"']*(?:rounded-full|rounded-m3-full)[^\"']*[\"']>[\s\S]*?(?:<svg|<[A-Z]\w+[^>]*class)[\s\S]*?<\/(?:div|span)>[\s\S]*?<h2/i.test(block);

      if (hasIconInside || hasIconBeside || hasIconInEyebrow) {
        out += `FILE: ${file}:${i + 1}\n`;
        out += `TYPE: Inside=${hasIconInside}, Beside=${hasIconBeside}, Eyebrow=${hasIconInEyebrow}\n`;
        out += lines.slice(start, Math.min(lines.length, i + 3)).join('\n') + '\n';
        out += '==================================================\n';
      }
    }
  }
}

fs.writeFileSync('scratch_sections_all.txt', out, 'utf8');
console.log('Done writing sections to scratch_sections_all.txt');
