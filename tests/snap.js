const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 1600 } });
  await page.goto('http://localhost:4321/services/tirupati-package/');
  
  const dts = page.locator('input[type="datetime-local"]');
  await dts.nth(0).fill('2026-10-15T06:00');
  await dts.nth(1).fill('2026-10-15T21:00');
  
  const selects = page.locator('select');
  await selects.nth(0).selectOption({ index: 1 }); // 4 passengers
  await page.waitForTimeout(300);
  await selects.nth(1).selectOption({ index: 1 }); // vehicle
  
  await page.waitForTimeout(600);
  const booking = page.locator('section[aria-label="Tirupati Pilgrimage Booking Engine"]');
  await booking.scrollIntoViewIfNeeded();
  await booking.screenshot({ path: 'tests/passenger_view_summary_active.png' });
  await browser.close();
  console.log('Done screenshot');
})();
