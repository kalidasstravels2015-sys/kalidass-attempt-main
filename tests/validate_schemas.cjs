const fs = require('fs');
const path = require('path');

function getHtmlFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(full));
    } else if (file.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function validateNode(node, file, errors) {
  if (!node || typeof node !== 'object') return;

  const type = Array.isArray(node['@type']) ? node['@type'].join(', ') : node['@type'];

  // Check LocalBusiness
  if (type && type.includes('LocalBusiness')) {
    if (!node.name) errors.push(`${file}: LocalBusiness missing 'name'`);
    if (!node.address) errors.push(`${file}: LocalBusiness missing 'address'`);
    if (!node.telephone) errors.push(`${file}: LocalBusiness missing 'telephone'`);
    if (!node.priceRange) errors.push(`${file}: LocalBusiness missing 'priceRange'`);
    if (node.aggregateRating) {
      if (!node.aggregateRating.ratingValue || !node.aggregateRating.reviewCount) {
        errors.push(`${file}: LocalBusiness aggregateRating missing ratingValue or reviewCount`);
      }
    }
  }

  // Check Organization
  if (type && type.includes('Organization')) {
    if (!node.name) errors.push(`${file}: Organization missing 'name'`);
    if (!node.url) errors.push(`${file}: Organization missing 'url'`);
  }

  // Check Offer / AggregateOffer / UnitPriceSpecification prices
  if (node.priceCurrency && node.priceCurrency !== 'INR') {
    errors.push(`${file}: Invalid priceCurrency '${node.priceCurrency}', expected 'INR'`);
  }
  if (node.price !== undefined) {
    const priceStr = String(node.price);
    if (/[^0-9.]/.test(priceStr)) {
      errors.push(`${file}: Non-numeric price '${priceStr}' in ${type || 'Offer'}`);
    }
  }
  if (node.lowPrice !== undefined) {
    const p = String(node.lowPrice);
    if (/[^0-9.]/.test(p)) {
      errors.push(`${file}: Non-numeric lowPrice '${p}' in ${type || 'AggregateOffer'}`);
    }
  }
  if (node.highPrice !== undefined) {
    const p = String(node.highPrice);
    if (/[^0-9.]/.test(p)) {
      errors.push(`${file}: Non-numeric highPrice '${p}' in ${type || 'AggregateOffer'}`);
    }
  }

  // Check nested priceSpecification validity
  if (node.priceSpecification && node.priceSpecification['@type'] === 'AggregateOffer') {
    errors.push(`${file}: Invalid nested @type: 'AggregateOffer' inside priceSpecification (must be PriceSpecification)`);
  }

  // Check FAQPage
  if (type && type.includes('FAQPage')) {
    if (!node.mainEntity || !Array.isArray(node.mainEntity) || node.mainEntity.length === 0) {
      errors.push(`${file}: FAQPage has empty or missing mainEntity`);
    } else {
      for (const q of node.mainEntity) {
        if (!q.name || !q.acceptedAnswer || !q.acceptedAnswer.text) {
          errors.push(`${file}: FAQ Question missing name or acceptedAnswer.text`);
        }
      }
    }
  }

  // Check BreadcrumbList
  if (type && type.includes('BreadcrumbList')) {
    if (!node.itemListElement || !Array.isArray(node.itemListElement) || node.itemListElement.length === 0) {
      errors.push(`${file}: BreadcrumbList has empty itemListElement`);
    }
  }

  // Recurse into object properties and arrays
  for (const key of Object.keys(node)) {
    if (key === '@context') continue;
    const val = node[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item && typeof item === 'object') validateNode(item, file, errors);
      }
    } else if (val && typeof val === 'object') {
      validateNode(val, file, errors);
    }
  }
}

async function runValidation() {
  const distDir = path.resolve(__dirname, '../dist');
  console.log(`Auditing HTML files in ${distDir}...`);
  const htmlFiles = getHtmlFiles(distDir);

  if (htmlFiles.length === 0) {
    console.error('No HTML files found in dist. Run `npm run build` first.');
    process.exit(1);
  }

  let totalScripts = 0;
  let totalNodes = 0;
  const errors = [];

  for (const file of htmlFiles) {
    const relPath = path.relative(distDir, file);
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/<script[^>]*type=[\x22']application\/ld\+json[\x22'][^>]*>([\s\S]*?)<\/script>/gi) || [];

    for (const m of matches) {
      totalScripts++;
      const jsonStr = m.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (err) {
        errors.push(`${relPath}: Invalid JSON syntax - ${err.message}`);
        continue;
      }

      if (!parsed['@context']) {
        errors.push(`${relPath}: Missing '@context' in JSON-LD script`);
      }

      if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
        for (const item of parsed['@graph']) {
          totalNodes++;
          validateNode(item, relPath, errors);
        }
      } else {
        totalNodes++;
        validateNode(parsed, relPath, errors);
      }
    }
  }

  console.log(`\n=== Schema.org & Google Structured Data Audit Results ===`);
  console.log(`HTML Files Audited: ${htmlFiles.length}`);
  console.log(`JSON-LD Scripts Inspected: ${totalScripts}`);
  console.log(`Knowledge Graph Nodes Verified: ${totalNodes}`);
  console.log(`Validation Errors Found: ${errors.length}\n`);

  if (errors.length > 0) {
    console.error('❌ Schema Validation Failed with the following errors:');
    errors.forEach((e, idx) => console.error(`  ${idx + 1}. ${e}`));
    process.exit(1);
  }

  console.log('✅ All Schema.org structured data passed Google Search Central compliance with 0 errors!');
}

runValidation();
