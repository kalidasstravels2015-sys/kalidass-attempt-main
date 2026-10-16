const http = require('http');

const urlPath = process.argv[2] || '/services/tours/temple-tours/';
const fullUrl = `http://localhost:4321${urlPath}`;

http.get(fullUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`\n========================================`);
    console.log(`AUDIT FOR: ${urlPath}`);
    console.log(`Status: ${res.statusCode}`);
    console.log(`========================================`);

    // Title
    const titleMatch = data.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'NONE';
    console.log(`\nTITLE (${title.length} chars): ${title}`);

    // Meta Description
    const metaDescMatch = data.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1] : 'NONE';
    console.log(`META DESC (${metaDesc.length} chars): ${metaDesc}`);

    // Meta Keywords
    const metaKeywordsMatch = data.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']*)["']/i);
    console.log(`META KEYWORDS: ${metaKeywordsMatch ? metaKeywordsMatch[1] : 'NONE'}`);

    // Canonical
    const canonicalMatch = data.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    console.log(`CANONICAL: ${canonicalMatch ? canonicalMatch[1] : 'NONE'}`);

    // H1
    const h1Matches = [...data.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));
    console.log(`\nH1 MATCHES (${h1Matches.length}):`, h1Matches);

    // H2s
    const h2Matches = [...data.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));
    console.log(`H2 MATCHES (${h2Matches.length}):`, h2Matches.slice(0, 8));

    // Speakable check
    const speakableMatches = [...data.matchAll(/data-speakable=["']true["']/gi)];
    console.log(`DATA-SPEAKABLE ATTRIBUTES FOUND: ${speakableMatches.length}`);

    // Schemas
    const schemas = [...data.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    console.log(`\nSCHEMAS FOUND: ${schemas.length}`);
    schemas.forEach((s, idx) => {
      try {
        const parsed = JSON.parse(s[1]);
        console.log(`\n--- SCRIPT #${idx + 1} ---`);
        if (parsed['@graph']) {
          console.log(`@graph contains ${parsed['@graph'].length} items:`);
          parsed['@graph'].forEach((item, i) => {
            console.log(`  [${i}] Type: ${JSON.stringify(item['@type'])}, @id: ${item['@id'] || 'none'}, Name: ${item.name || item.headline || 'none'}`);
          });
        } else {
          console.log(`Single Item: Type: ${JSON.stringify(parsed['@type'])}, @id: ${parsed['@id'] || 'none'}, Name: ${parsed.name || 'none'}`);
        }
      } catch (err) {
        console.error(`JSON Parse Error in Script #${idx + 1}:`, err.message);
      }
    });
  });
}).on('error', (err) => console.error('Request Error:', err.message));
