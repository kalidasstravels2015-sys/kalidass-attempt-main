import { test, expect } from '@playwright/test';

test('temple tour does not show price until pickup location is entered', async ({ page }) => {
  await page.goto('http://localhost:4321/services/tirupati-package');

  // Wait for the booking section to be visible
  const bookingSection = page.locator('#booking');
  await expect(bookingSection).toBeVisible();

  // On initial load, verify pickup location input is empty
  const pickupInput = bookingSection.locator('input[placeholder*="T. Nagar"]');
  await expect(pickupInput).toBeVisible();
  await expect(pickupInput).toHaveValue('');

  // Rate summary card and price should NOT be displayed
  const fareResult = bookingSection.locator('text=Total Bill:');
  await expect(fareResult).toHaveCount(0);
  const totalFareText = bookingSection.locator('text=Total Fare');
  await expect(totalFareText).toHaveCount(0);

  // Click "View Instant Fare ->" button while pickup is empty
  const calculateBtn = bookingSection.locator('#btn-calculate-fare');
  await calculateBtn.click();

  // Validation error should appear
  const errorMsg = bookingSection.locator('text=Please enter your pickup location in Chennai.');
  await expect(errorMsg).toBeVisible();

  // Fare should still NOT be shown
  await expect(fareResult).toHaveCount(0);
  await expect(totalFareText).toHaveCount(0);

  // Now enter pickup location
  await pickupInput.fill('T. Nagar, Chennai');
  await calculateBtn.click();

  // Now fare result should be visible
  await expect(fareResult).toBeVisible();
  await expect(totalFareText).toBeVisible();
  const priceDisplay = bookingSection.locator('text=₹6,000').first();
  await expect(priceDisplay).toBeVisible();

  // Clear pickup location using the clear button
  const clearBtn = bookingSection.locator('button[aria-label="Clear pickup location"]');
  await clearBtn.click();

  // Rate summary card and price should disappear immediately
  await expect(fareResult).toHaveCount(0);
  await expect(totalFareText).toHaveCount(0);
});
