import { test, expect } from '@playwright/test';

test('Verify Option A Progressive Disclosure: Calm Fare Card, 1-Tap Booking, and Optional GST', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

  const bookingSection = page.locator('#booking');
  await bookingSection.scrollIntoViewIfNeeded();

  // 1. Enter pickup location & dates
  const pickupInput = bookingSection.locator('input[placeholder*="pickup address in Chennai"]');
  await pickupInput.fill('Pallavaram, Chennai');

  const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
  const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);
  await pickupDate.fill('2026-10-15T06:00');
  await returnDate.fill('2026-10-15T21:00'); // 15 hrs same-day return

  // 2. Select Passengers & Vehicle
  const paxSelect = bookingSection.locator('select').first();
  await paxSelect.selectOption('4');

  const vehSelect = bookingSection.locator('select').nth(1);
  await vehSelect.selectOption('dzire');

  // 3. Verify Calm Fare Card: ₹ 6,000 All-Inclusive Fixed Fare
  await expect(bookingSection.locator('.text-3xl, .text-4xl').first()).toHaveText('₹ 6,000');
  await expect(bookingSection.getByText('Covers FASTag Tolls + AP Permit + Ghat Climb + Driver Bata')).toBeVisible();

  // 4. Verify Collapsible Fare Breakdown
  const breakdownToggle = bookingSection.locator('button:has-text("View Itemized Fare Breakdown")');
  await expect(breakdownToggle).toBeVisible();
  await breakdownToggle.scrollIntoViewIfNeeded();
  await breakdownToggle.click();

  // Check itemized breakdown rows
  await expect(bookingSection.getByText('Dedicated AC Vehicle Hire & Fuel')).toBeVisible();
  await expect(bookingSection.getByText('Chauffeur Duty & Halting Batta')).toBeVisible();
  await expect(bookingSection.getByText('NH FASTag Tolls & AP State Border Permit:')).toBeVisible();
  await expect(bookingSection.getByText('INCLUDED (₹0)').first()).toBeVisible();

  // 5. Verify 1-Tap WhatsApp Booking is ready with optional devotee name
  const nameInput = bookingSection.locator('input[placeholder*="Saravanan K"]');
  await expect(nameInput).toBeVisible();
  await nameInput.fill('Senthil Kumar');

  const waBtn = bookingSection.locator('a[data-direct-whatsapp="true"]').first();
  await expect(waBtn).toBeVisible();
  await expect(bookingSection.locator('a:has-text("Call Dispatch")')).toBeVisible();

  // Verify WhatsApp manifest
  const waHref = await waBtn.getAttribute('href');
  expect(waHref).toContain('CT%2FEST%2F'); // Estimate Ref
  expect(waHref).toContain('Senthil%20Kumar'); // Passenger Name
  expect(waHref).toContain('6%2C000'); // Rate ₹6,000

  // 6. Verify Progressive Disclosure: GST Checkbox is present at bottom
  const gstCheckbox = bookingSection.locator('input[type="checkbox"]');
  await expect(gstCheckbox).toBeVisible();
  await expect(bookingSection.getByText('Need GST Tax Invoice for Corporate')).toBeVisible();

  // 7. Capture card screenshot in Standard Cash mode
  await page.screenshot({ path: 'tests/unified_card_standard_cash.png' });
  console.log('✔ Captured tests/unified_card_standard_cash.png');
});
