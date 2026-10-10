import { test, expect } from '@playwright/test';

test('Verify warning is shown as compact text and pickup is validated', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 924 });
  await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

  const bookingSection = page.locator('#booking');
  await bookingSection.scrollIntoViewIfNeeded();

  const estimateBtn = bookingSection.locator('button:has-text("View Trip Estimate")');

  // 1. Click without entering pickup: should warn about pickup in Chennai
  await estimateBtn.click();
  const alertText = bookingSection.locator('p[role="alert"]');
  await expect(alertText).toBeVisible();
  await expect(alertText).toHaveText('Please enter pickup location in Chennai.');

  // Ensure it's not rendered as a bulky div pill button
  const alertDiv = bookingSection.locator('div[role="alert"]');
  await expect(alertDiv).toHaveCount(0);

  // Take screenshot of the compact text warning for pickup
  await page.screenshot({ path: 'tests/pickup_warning_compact_text.png' });

  // 2. Type pickup: warning should disappear
  const pickupInput = bookingSection.locator('input[placeholder*="pickup address in Chennai"]');
  await pickupInput.fill('T. Nagar, Chennai');
  await expect(alertText).not.toBeVisible();

  // 3. Click again: should now warn about Dates
  await estimateBtn.click();
  await expect(alertText).toBeVisible();
  await expect(alertText).toHaveText('Please select Pickup and Return Date & Time.');

  // Take screenshot of date warning as text
  await page.screenshot({ path: 'tests/date_warning_compact_text.png' });
  console.log('✔ All validation tests passed cleanly!');
});
