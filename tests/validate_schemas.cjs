const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4321/services/chennai-airport-taxi/', { waitUntil: 'networkidle' });

  const scripts = await page.$$eval('script[type="application/ld+json"]', els => els.map(e => {
    try {
      return JSON.parse(e.textContent);
    } catch (err) {
      return { error: err.message, text: e.textContent };
    }
  }));

  console.log('Found', scripts.length, 'JSON-LD scripts');
  for (let i = 0; i < scripts.length; i++) {
    const s = scripts[i];
    console.log(`\n--- Script ${i + 1} ---`);
    if (s['@graph']) {
      s['@graph'].forEach((item, idx) => {
        console.log(`Graph item ${idx + 1}: @type = ${item['@type']}, @id = ${item['@id']}`);
      });
    } else {
      console.log(`Single item: @type = ${s['@type']}, @id = ${s['@id']}`);
    }
  }

  await browser.close();
})();
