const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('COMPREHENSIVE GOOGLE SEARCH CENTRAL & SCHEMA.ORG FULL AUDIT');
console.log('================================================================\n');

const distDir = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory not found. Please run npm run build first.');
  process.exit(1);
}

// Recursively find all HTML files
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}

const htmlFiles = getHtmlFiles(distDir);
console.log(`Found ${htmlFiles.length} generated HTML pages to audit.\n`);

let totalErrors = 0;
let totalWarnings = 0;
let totalSchemasInspected = 0;

const summaryByType = {};

htmlFiles.forEach(fileFullPath => {
  const relPath = path.relative(distDir, fileFullPath).replace(/\\/g, '/');
  const html = fs.readFileSync(fileFullPath, 'utf8');
  const ldJsonRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  const schemas = [];

  while ((match = ldJsonRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      schemas.push(json);
    } catch (e) {
      console.error(`❌ JSON Syntax Error in ${relPath}: ${e.message}`);
      totalErrors++;
    }
  }

  schemas.forEach((s, idx) => {
    totalSchemasInspected++;

    // 1. Check root @context
    if (!s['@context']) {
      console.warn(`   ⚠️ [${relPath}] Block #${idx + 1} missing root @context`);
      totalWarnings++;
    }

    // 2. Check @graph nodes
    if (s['@graph'] && Array.isArray(s['@graph'])) {
      s['@graph'].forEach((node, nIdx) => {
        const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
        types.forEach(t => {
          summaryByType[t] = (summaryByType[t] || 0) + 1;
        });

        // Nested @context check
        if (node['@context']) {
          console.error(`   ❌ [${relPath}] Node #${nIdx} inside @graph contains illegal nested @context: ${node['@type']}`);
          totalErrors++;
        }

        // LocalBusiness validation
        if (types.includes('LocalBusiness') || types.includes('TravelAgency') || types.includes('AutoRental')) {
          if (!node.name) { console.error(`   ❌ [${relPath}] LocalBusiness missing name`); totalErrors++; }
          if (!node.address) { console.error(`   ❌ [${relPath}] LocalBusiness missing address`); totalErrors++; }
          if (!node.telephone) { console.error(`   ❌ [${relPath}] LocalBusiness missing telephone`); totalErrors++; }
          if (!node.priceRange) { console.error(`   ❌ [${relPath}] LocalBusiness missing priceRange`); totalErrors++; }
          if (!node.geo) { console.error(`   ❌ [${relPath}] LocalBusiness missing geo`); totalErrors++; }
          if (types.includes('TaxiService')) {
            console.error(`   ❌ [${relPath}] LocalBusiness contains invalid subtype TaxiService`);
            totalErrors++;
          }
        }

        // Product validation
        if (types.includes('Product')) {
          if (!node.name) { console.error(`   ❌ [${relPath}] Product missing name`); totalErrors++; }
          if (!node.offers) { console.error(`   ❌ [${relPath}] Product missing offers`); totalErrors++; }
          if (node.offers) {
            const price = parseInt(node.offers.price, 10);
            if (!price || isNaN(price)) {
              console.error(`   ❌ [${relPath}] Product offer price invalid: ${node.offers.price}`);
              totalErrors++;
            }
            // Check for corrupted prices (e.g. 32003500)
            if (price > 100000 && !relPath.includes('corporate')) {
              console.error(`   ❌ [${relPath}] Product price suspicious (corrupted range?): ₹${price}`);
              totalErrors++;
            }
            // Check for per-km rate misclassified as package cost
            if (price < 50 && (relPath.includes('pondicherry') || relPath.includes('temple'))) {
              console.error(`   ❌ [${relPath}] Product price too low (per-km rate?): ₹${price}`);
              totalErrors++;
            }
          }
          if (!node.brand || !node.brand.name) {
            console.warn(`   ⚠️ [${relPath}] Product brand missing or missing name`);
            totalWarnings++;
          }
          if (!node.sku) {
            console.warn(`   ⚠️ [${relPath}] Product missing sku`);
            totalWarnings++;
          }
        }

        // TaxiService vs TouristTrip validation
        if (types.includes('TaxiService') && node.itinerary) {
          console.error(`   ❌ [${relPath}] TaxiService contains invalid itinerary property`);
          totalErrors++;
        }

        // TouristTrip validation
        if (types.includes('TouristTrip')) {
          if (!node.name) {
            console.error(`   ❌ [${relPath}] TouristTrip missing name`);
            totalErrors++;
          }
          if (node.providerMobility) {
            console.error(`   ❌ [${relPath}] TouristTrip contains invalid providerMobility property (belongs to Service)`);
            totalErrors++;
          }
        }
      });
    }

    // 3. BreadcrumbList validation
    if (s['@type'] === 'BreadcrumbList') {
      summaryByType['BreadcrumbList'] = (summaryByType['BreadcrumbList'] || 0) + 1;
      if (!s.itemListElement || !Array.isArray(s.itemListElement)) {
        console.error(`   ❌ [${relPath}] BreadcrumbList missing itemListElement`);
        totalErrors++;
      } else {
        s.itemListElement.forEach(item => {
          if (!item.item || !item.item.startsWith('http')) {
            console.error(`   ❌ [${relPath}] Breadcrumb item URL not absolute: ${item.item}`);
            totalErrors++;
          }
        });
      }
    }

    // 4. Standalone FAQPage validation
    if (s['@type'] === 'FAQPage') {
      summaryByType['FAQPage'] = (summaryByType['FAQPage'] || 0) + 1;
      if (!s.mainEntity || !Array.isArray(s.mainEntity)) {
        console.error(`   ❌ [${relPath}] FAQPage missing mainEntity array`);
        totalErrors++;
      } else {
        s.mainEntity.forEach(q => {
          if (!q.name || !q.acceptedAnswer || !q.acceptedAnswer.text) {
            console.error(`   ❌ [${relPath}] Incomplete FAQ question/answer`);
            totalErrors++;
          }
        });
      }
    }
  });
});

console.log('--- SCHEMA TYPES DISCOVERED & VALIDATED ---');
Object.entries(summaryByType).sort((a,b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`  • ${type.padEnd(26)}: ${count} instances`);
});

console.log('\n================================================================');
console.log(`FULL AUDIT COMPLETE: ${totalErrors} Errors, ${totalWarnings} Warnings across ${htmlFiles.length} pages`);
console.log('================================================================');

if (totalErrors > 0) {
  process.exit(1);
}
