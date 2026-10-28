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

const files = walk('src');
let out = '';

out += '=== 1. ICONS DIRECTLY INSIDE H2/H3 ===\n';
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const hMatches = [...content.matchAll(/<(h[23])[^>]*>([\s\S]*?)<\/\1>/gi)];
  hMatches.forEach(m => {
    const tag = m[1];
    const inner = m[2];
    if (/<svg|<[A-Z]\w+[^>]*class/i.test(inner)) {
      out += `${file} (${tag}):\n${m[0].trim()}\n---\n`;
    }
  });
}

out += '\n=== 2. ICON BOXES BESIDE HEADINGS IN FLEX ROW ===\n';
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    // Check if line has h2 or h3
    if (/<h[23]\b/i.test(lines[i])) {
      // Check previous 10 lines for flex container with icon
      const prevBlock = lines.slice(Math.max(0, i - 10), i).join('\n');
      if (prevBlock.includes('<svg') || /<[A-Z]\w+.*(w-4|w-5|w-6)/.test(prevBlock)) {
        out += `${file} (Line ${i + 1}):\n`;
        out += lines.slice(Math.max(0, i - 8), i + 4).join('\n') + '\n---\n';
      }
    }
  }
}

fs.writeFileSync('scratch_scan_output.txt', out, 'utf8');
console.log('Done scanning!');
