const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:4321/services/tirupati-package/', { waitUntil: 'networkidle' });

  const booking = page.locator('#booking');
  await booking.scrollIntoViewIfNeeded();

  // 1. Initial Empty State screenshot (Testing title vs placeholder boldness distinction)
  await page.screenshot({ path: 'tests/tirupati_empty_state_boldness.png' });

  // 2. Filled state
  await booking.locator('input[placeholder*="pickup address in Chennai"]').fill('Velachery, Chennai');
  await booking.locator('select').first().selectOption('4');
  await booking.locator('select').nth(1).selectOption('dzire');

  await booking.locator('input[type="datetime-local"]').first().fill('2026-10-15T06:00');
  await booking.locator('input[type="datetime-local"]').nth(1).fill('2026-10-15T21:00');

  await page.screenshot({ path: 'tests/tirupati_filled_state_boldness.png' });

  await browser.close();
  console.log('Boldness test screenshots saved!');
})();
