const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('RUNNING GOOGLE SEARCH CENTRAL & SCHEMA.ORG STRUCTURED DATA AUDIT');
console.log('================================================================\n');

const testPages = [
  'dist/index.html',
  'dist/services/tirupati-package/index.html',
  'dist/services/temple-tours/index.html',
  'dist/services/popular-destinations/index.html',
  'dist/services/chennai-airport-taxi/index.html',
  'dist/services/kanchipuram-temple-trip/index.html',
  'dist/services/pondicherry-one-day-trip/index.html',
  'dist/services/employee-pickup-drop/index.html',
  'dist/tariff/index.html',
  'dist/calculator/index.html',
  'dist/fleet/index.html'
];

let totalErrors = 0;
let totalWarnings = 0;

testPages.forEach(fileRel => {
  const filePath = path.join(__dirname, '..', fileRel);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${fileRel}`);
    totalErrors++;
    return;
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const ldJsonRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  const schemas = [];

  while ((match = ldJsonRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      schemas.push(json);
    } catch (e) {
      console.error(`❌ JSON Syntax Error in ${fileRel}:`, e.message);
      totalErrors++;
    }
  }

  console.log(`📄 Auditing: ${fileRel}`);
  console.log(`   Found ${schemas.length} JSON-LD block(s).`);

  schemas.forEach((s, idx) => {
    // 1. Check for @context
    if (!s['@context']) {
      console.warn(`   ⚠️ Warning: Block #${idx + 1} missing root @context`);
      totalWarnings++;
    }

    // 2. If @graph exists, inspect each graph node
    if (s['@graph']) {
      s['@graph'].forEach((node, nodeIdx) => {
        // Check for nested @context leak
        if (node['@context']) {
          console.error(`   ❌ Error: Node #${nodeIdx} inside @graph contains illegal nested @context: ${node['@type']}`);
          totalErrors++;
        }

        // Validate LocalBusiness
        if (node['@type'] && (node['@type'] === 'LocalBusiness' || (Array.isArray(node['@type']) && node['@type'].includes('TravelAgency')))) {
          if (!node.name) { console.error(`   ❌ LocalBusiness missing name`); totalErrors++; }
          if (!node.address) { console.error(`   ❌ LocalBusiness missing address`); totalErrors++; }
          if (!node.telephone) { console.error(`   ❌ LocalBusiness missing telephone`); totalErrors++; }
          if (!node.priceRange) { console.error(`   ❌ LocalBusiness missing priceRange`); totalErrors++; }
          if (!node.geo) { console.error(`   ❌ LocalBusiness missing geo`); totalErrors++; }
          // Check TaxiService not in LocalBusiness @type
          if (Array.isArray(node['@type']) && node['@type'].includes('TaxiService')) {
            console.error(`   ❌ LocalBusiness contains invalid @type: TaxiService (TaxiService is not a LocalBusiness)`);
            totalErrors++;
          }
        }

        // Validate Product (if present)
        if (node['@type'] === 'Product') {
          if (!node.name) { console.error(`   ❌ Product missing name`); totalErrors++; }
          if (!node.offers) { console.error(`   ❌ Product missing offers`); totalErrors++; }
          if (node.offers) {
            const price = node.offers.price;
            if (!price) { console.error(`   ❌ Product offer missing price`); totalErrors++; }
            if (parseInt(price, 10) > 200000 && !fileRel.includes('corporate')) {
              console.error(`   ❌ Suspicious corrupted price in Product offer: ₹${price}`);
              totalErrors++;
            }
            if (parseInt(price, 10) < 50 && fileRel.includes('pondicherry')) {
              console.error(`   ❌ Suspicious per-km price used as package total in Product offer: ₹${price}`);
              totalErrors++;
            }
          }
          if (!node.brand) { console.error(`   ❌ Product missing brand`); totalErrors++; }
          if (node.brand && !node.brand.name) { console.warn(`   ⚠️ Warning: Product brand missing name attribute`); totalWarnings++; }
        }

        // Validate TouristTrip / TaxiService
        if (node['@type'] === 'TaxiService') {
          if (node.itinerary) {
            console.error(`   ❌ TaxiService contains invalid 'itinerary' property (only TouristTrip supports itinerary)`);
            totalErrors++;
          }
        }
      });
    }

    // Validate BreadcrumbList
    if (s['@type'] === 'BreadcrumbList') {
      if (!s.itemListElement || !Array.isArray(s.itemListElement)) {
        console.error(`   ❌ BreadcrumbList missing itemListElement array`);
        totalErrors++;
      } else {
        s.itemListElement.forEach(item => {
          if (!item.item.startsWith('http')) {
            console.error(`   ❌ Breadcrumb item URL is not fully qualified: ${item.item}`);
            totalErrors++;
          }
        });
      }
    }
  });

  console.log(`   ✅ Passed standard checks for ${fileRel}\n`);
});

console.log('================================================================');
console.log(`AUDIT COMPLETE: ${totalErrors} Errors, ${totalWarnings} Warnings`);
console.log('================================================================');

if (totalErrors > 0) {
  process.exit(1);
}
