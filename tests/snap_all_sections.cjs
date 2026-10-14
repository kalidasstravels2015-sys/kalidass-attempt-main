const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4321/services/tirupati-package/', { waitUntil: 'networkidle' });

  // 1. Hero & Trust Chips
  const hero = page.locator('#booking');
  await hero.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tests/audit_section_hero_mobile.png' });

  // 2. Fleet Section
  const tariff = page.locator('#tariff');
  await tariff.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tests/audit_section_tariff_mobile.png' });

  // 3. Compare section
  const compare = page.locator('#compare');
  if (await compare.count() > 0) {
    await compare.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'tests/audit_section_compare_mobile.png' });
  }

  // 4. Route section
  const route = page.locator('#route');
  if (await route.count() > 0) {
    await route.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'tests/audit_section_route_mobile.png' });
  }

  // 5. Guide section
  const guide = page.locator('#guide');
  if (await guide.count() > 0) {
    await guide.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'tests/audit_section_guide_mobile.png' });
  }

  // 6. FAQ section
  const faq = page.locator('#faq');
  if (await faq.count() > 0) {
    await faq.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'tests/audit_section_faq_mobile.png' });
  }

  console.log('Section screenshots captured!');
  await browser.close();
})();
