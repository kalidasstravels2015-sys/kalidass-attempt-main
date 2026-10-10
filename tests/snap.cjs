const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 1200 } });
  await page.goto('http://localhost:4321/services/tirupati-package/', { waitUntil: 'networkidle' });
  
  const booking = page.locator('#booking');
  await booking.scrollIntoViewIfNeeded();

  const pickupInput = booking.locator('input[placeholder*="pickup address in Chennai"]');
  await pickupInput.fill('Pallavaram, Chennai');

  const pickupDate = booking.locator('input[type="datetime-local"]').first();
  const returnDate = booking.locator('input[type="datetime-local"]').nth(1);
  await pickupDate.fill('2026-10-15T06:00');
  await returnDate.fill('2026-10-15T21:00');

  const paxSelect = booking.locator('select').first();
  await paxSelect.selectOption('4');
  await page.waitForTimeout(200);

  const vehSelect = booking.locator('select').nth(1);
  await vehSelect.selectOption('dzire');
  await page.waitForTimeout(500);

  // Capture standard calm passenger state
  const section = page.locator('section[aria-label="Tirupati Pilgrimage Booking Engine"]');
  await section.scrollIntoViewIfNeeded();
  await section.screenshot({ path: 'tests/passenger_view_option_a_cash.png' });
  console.log('Captured tests/passenger_view_option_a_cash.png');

  // Check GST checkbox to capture progressive disclosure state
  const gstCheckbox = booking.locator('input[type="checkbox"]');
  await gstCheckbox.check();
  await page.waitForTimeout(500);

  await section.screenshot({ path: 'tests/passenger_view_option_a_gst.png' });
  console.log('Captured tests/passenger_view_option_a_gst.png');

  await browser.close();
})();
