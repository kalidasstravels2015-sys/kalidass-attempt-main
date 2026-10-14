const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/services/tirupati-package/', { waitUntil: 'networkidle' });

  const booking = page.locator('#booking');
  await booking.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);

  const engine = page.locator('section[aria-label="Tirupati Pilgrimage Booking Engine"]');
  await engine.waitFor({ state: 'visible', timeout: 10000 });

  // 1. Initial State Screenshot (Booking Engine Top Header)
  await engine.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'tests/tirupati_thumb_friendly_initial.png' });

  // 2. Filled State Screenshot
  const pickup = engine.locator('input[placeholder*="Pickup address in Chennai"], input[placeholder*="pickup address in Chennai"]');
  await pickup.fill('Chennai Central Station, Park Town');

  const dts = engine.locator('input[type="datetime-local"]');
  await dts.nth(0).fill('2026-10-15T06:00');
  await dts.nth(1).fill('2026-10-15T21:00');

  const selects = engine.locator('select');
  await selects.nth(0).selectOption('4');
  await page.waitForTimeout(200);
  await selects.nth(1).selectOption('dzire');
  await page.waitForTimeout(400);

  await page.screenshot({ path: 'tests/tirupati_thumb_friendly_calculated.png' });

  await browser.close();
  console.log('Screenshots captured successfully!');
})();
