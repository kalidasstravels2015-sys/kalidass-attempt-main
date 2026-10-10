import { test, expect } from '@playwright/test';

test('Verify Pondicherry Booking Engine has editable drop location and no trip estimate button', async ({ page }) => {
  // Mobile Pixel 7 viewport (412 x 915)
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/services/pondicherry-one-day-trip/', { waitUntil: 'networkidle' });

  const bookingCard = page.locator('.booking-engine').first();
  await bookingCard.scrollIntoViewIfNeeded();

  // 1. Verify Pickup Location
  const pickupInput = bookingCard.locator('input[placeholder*="pickup address"]');
  await expect(pickupInput).toBeVisible();
  await pickupInput.fill('Adyar, Chennai');

  // 2. Verify Destination / Drop Location is an editable input field
  const dropInput = bookingCard.locator('input[placeholder*="White Town"]');
  await expect(dropInput).toBeVisible();
  await dropInput.fill('The Promenade Hotel, French White Town, Pondicherry');

  // Verify drop input has the entered value
  await expect(dropInput).toHaveValue('The Promenade Hotel, French White Town, Pondicherry');

  // 3. Fill in Dates
  const pickupDate = bookingCard.locator('input[type="datetime-local"]').first();
  const returnDate = bookingCard.locator('input[type="datetime-local"]').nth(1);
  await pickupDate.fill('2026-10-23T06:00');
  await returnDate.fill('2026-10-23T22:00');

  // 4. Select Passengers & Vehicle
  const paxSelect = bookingCard.locator('select').first();
  await paxSelect.selectOption('4');

  const vehSelect = bookingCard.locator('select').nth(1);
  await vehSelect.selectOption('dzire');

  // 5. Verify Fare Summary is rendered
  await expect(bookingCard.getByText('All-Inclusive Package Fare')).toBeVisible();

  // 6. Verify "Trip Estimate / Invoice" button is REMOVED
  await expect(bookingCard.getByText('Trip Estimate / Invoice')).toHaveCount(0);
  await expect(bookingCard.locator('button:has-text("Trip Estimate")')).toHaveCount(0);

  // 7. Verify Primary Action is WhatsApp Booking paired with Call Dispatch
  const waBtn = bookingCard.locator('a[data-direct-whatsapp="true"]').first();
  await expect(waBtn).toBeVisible();
  await expect(bookingCard.locator('a:has-text("Call Dispatch")')).toBeVisible();

  // 8. Verify WhatsApp link includes custom entered drop destination
  const waHref = await waBtn.getAttribute('href');
  expect(waHref).toContain('Destination%3A%20The%20Promenade%20Hotel');

  // 9. Capture screenshot for visual verification
  await bookingCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'tests/pondicherry_card_editable_drop.png' });
  console.log('✔ Captured tests/pondicherry_card_editable_drop.png');
});
