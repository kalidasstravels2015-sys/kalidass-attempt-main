const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ 
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('Navigating to Tirupati package page...');
  const res = await page.goto('http://localhost:4321/services/tirupati-package/', { waitUntil: 'networkidle' });
  console.log('HTTP Status:', res.status());

  // 1. Mobile Full Page Screenshot
  await page.screenshot({ path: 'tests/audit_tirupati_mobile_full.png', fullPage: true });

  // 2. Desktop Full Page Screenshot
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tests/audit_tirupati_desktop_full.png', fullPage: true });

  // 3. Inspect Headings Hierarchy
  const headings = await page.$$eval('h1, h2, h3, h4', els => els.map(e => ({
    tag: e.tagName,
    text: e.innerText.trim().replace(/\s+/g, ' ').slice(0, 60)
  })));

  // 4. Inspect Meta Tags
  const meta = await page.evaluate(() => {
    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || null,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || null,
      ogDescription: document.querySelector('meta[property="og:description"]')?.getAttribute('content') || null,
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || null,
    };
  });

  // 5. Inspect Schema.org JSON-LD
  const schemas = await page.$$eval('script[type="application/ld+json"]', els => els.map(e => {
    try {
      return JSON.parse(e.innerText);
    } catch (err) {
      return { parseError: err.message };
    }
  }));

  // 6. Inspect Images and Alt texts
  const images = await page.$$eval('img', els => els.map(e => ({
    src: e.getAttribute('src'),
    alt: e.getAttribute('alt') || '',
    loading: e.getAttribute('loading') || 'eager',
    hasAlt: Boolean(e.getAttribute('alt') && e.getAttribute('alt').trim().length > 0)
  })));

  // 7. Check Interactive Tabs and Anchor Links
  const navTabs = await page.$$eval('nav[aria-label="Service Details Quick Navigation"] a', els => els.map(e => ({
    text: e.innerText.trim(),
    href: e.getAttribute('href')
  })));

  // 8. Inspect Accordions (FAQs)
  const faqQuestions = await page.$$eval('#faq details summary, #faq button', els => els.map(e => e.innerText.trim().replace(/\s+/g, ' ').slice(0, 60)));

  // 9. Inspect Fleet Carousel Cards
  const fleetCards = await page.$$eval('#tariff-cards-view .tariff-card, #tariff-cards-view [data-vehicle-name]', els => els.map(e => e.innerText.trim().replace(/\s+/g, ' ').slice(0, 60)));

  const auditReport = {
    httpStatus: res.status(),
    meta,
    headings,
    h1Count: headings.filter(h => h.tag === 'H1').length,
    schemasCount: schemas.length,
    schemasTypes: schemas.map(s => s['@type'] || (Array.isArray(s['@graph']) ? s['@graph'].map(g => g['@type']) : 'Unknown')),
    imageStats: {
      total: images.length,
      missingAlt: images.filter(img => !img.hasAlt).length
    },
    navTabs,
    faqCount: faqQuestions.length,
    consoleErrors,
    consoleWarnings: consoleWarnings.slice(0, 5)
  };

  fs.writeFileSync('tests/tirupati_audit_report.json', JSON.stringify(auditReport, null, 2));
  console.log('AUDIT COMPLETED! Report written to tests/tirupati_audit_report.json');

  await browser.close();
})();
