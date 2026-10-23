import { test, expect } from '@playwright/test';

test('Verify 100% Fare Breakdown transparency on /calculator/', async ({ page }) => {
  await page.goto('/calculator/', { waitUntil: 'networkidle' });

  const outstation = page.locator('#outstation-estimator');

  // Select Round Trip within outstation
  const roundTab = outstation.locator('button:has-text("Round Trip"), [role="tab"]:has-text("Round Trip")').first();
  await roundTab.click();

  const pickupInput = outstation.locator('#pickup-input');
  const dropInput = outstation.locator('#drop-input');

  await pickupInput.fill('Sholinganallur, Chennai, Tamil Nadu, India');
  await page.keyboard.press('Escape');
  await dropInput.fill('Bengaluru, Karnataka, India');
  await page.keyboard.press('Escape');

  // Set 3 days schedule: Friday Oct 9 to Sunday Oct 11
  const pickupDate = outstation.locator('input[type="datetime-local"]').first();
  const returnDate = outstation.locator('input[type="datetime-local"]').nth(1);

  await pickupDate.fill('2026-10-09T06:00');
  await returnDate.fill('2026-10-11T21:00');
  await page.waitForTimeout(300);

  const calcBtn = outstation.locator('#btn-calculate-fare');
  await calcBtn.click({ force: true });
  await page.waitForTimeout(800);

  // Verify result card displays Total Fare and 100% itemized transparency
  const totalFare = outstation.locator('text=Total Fare').first();
  await expect(totalFare).toBeVisible();

  const resultCardText = await outstation.innerText();
  const upperText = resultCardText.toUpperCase();

  expect(upperText).toContain('CAB HIRE');
  expect(upperText).toContain('750 KM');
  expect(upperText).toContain('DRIVER ALLOWANCE');
  expect(upperText).toContain('TOTAL FARE');
  expect(upperText).toContain('ADVANCE TO PAY');
  expect(upperText).toContain('BALANCE TO PAY DRIVER');
  expect(upperText).toContain('100% FUEL & DRIVER ALLOWANCE');

  // Capture screenshot of the transparent Fare Breakdown for review
  await page.screenshot({ path: 'tests/fare_breakdown_modal.png' });
  console.log('✔ Screenshot of 100% transparent Fare Breakdown captured.');
});
