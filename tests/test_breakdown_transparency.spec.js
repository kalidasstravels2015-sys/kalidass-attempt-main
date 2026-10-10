import { test, expect } from '@playwright/test';

test('Verify 100% Fare Breakdown transparency on /calculator/', async ({ page }) => {
  await page.goto('/calculator/', { waitUntil: 'networkidle' });

  const outstation = page.locator('#outstation-estimator');

  // Select Round Trip within outstation
  const roundTab = outstation.locator('button:has-text("Round Trip"), [role="tab"]:has-text("Round Trip")').first();
  await roundTab.click();

  const pickupInput = outstation.locator('input[placeholder*="pickup" i], input[placeholder*="Pickup" i]').first();
  const dropInput = outstation.locator('input[placeholder*="drop" i], input[placeholder*="Drop" i]').first();

  await pickupInput.fill('Sholinganallur, Chennai, Tamil Nadu, India');
  await page.keyboard.press('Escape');
  await dropInput.fill('Bengaluru, Karnataka, India');
  await page.keyboard.press('Escape');

  const calcBtn = outstation.locator('button:has-text("Calculate Cost"), button:has-text("செலவைக் கணக்கிடுங்கள்")').first();
  await calcBtn.click({ force: true });
  await page.waitForTimeout(800);

  // Set 3 days schedule: Friday Oct 9 to Sunday Oct 11
  const pickupDate = outstation.locator('input[type="datetime-local"]').first();
  const returnDate = outstation.locator('input[type="datetime-local"]').nth(1);

  await pickupDate.fill('2026-10-09T06:00');
  await returnDate.fill('2026-10-11T21:00');
  await page.waitForTimeout(500);

  // Verify result card displays Base Meter Fare and Estimated Extras
  const resultCard = page.locator('text=Base Meter Fare').first();
  await expect(resultCard).toBeVisible();

  // Click 100% Fare Breakdown button
  const breakdownBtn = page.locator('button:has-text("100% Fare Breakdown")').first();
  await expect(breakdownBtn).toBeVisible();
  await breakdownBtn.click();
  await page.waitForTimeout(500);

  // Modal checks
  const modal = outstation.locator('div[role="dialog"]');
  await expect(modal).toBeVisible();
  
  const modalText = await modal.innerText();
  console.log('Modal text contents:\n', modalText);

  const upperText = modalText.toUpperCase();
  expect(upperText).toContain('TRANSPARENT PRICE BREAKDOWN');
  expect(upperText).toContain('CONTRACTED COVERAGE');
  expect(upperText).toContain('750 KM');
  expect(upperText).toContain('EXTRA SIGHTSEEING BUFFER INCLUDED');
  expect(upperText).toContain('BASE FARE');
  expect(upperText).toContain('ALL-INCLUSIVE');

  // Capture screenshot of the new modal for review
  await page.screenshot({ path: 'tests/fare_breakdown_modal.png' });
  console.log('✔ Screenshot of 100% transparent Fare Breakdown captured.');
});
