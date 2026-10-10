import { test, expect } from '@playwright/test';

test('Verify 100% transparent pricing and clean bill particulars with Model 2', async ({ page }) => {
  // Mobile viewport matching user's phone / mobile view
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

  // Scroll to booking engine
  const bookingSection = page.locator('#booking');
  await bookingSection.scrollIntoViewIfNeeded();

  // Fill Pickup
  const pickupInput = bookingSection.locator('input[placeholder*="pickup address in Chennai"]');
  await pickupInput.fill('Chennai Central Railway Station');

  // Fill Dates: 47 hours = 1 Day + 23 hrs
  const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
  const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);
  await pickupDate.fill('2026-10-10T06:00');
  await returnDate.fill('2026-10-12T05:00'); // 47 hours

  // Select Passengers & Vehicle
  const paxSelect = bookingSection.locator('select').first();
  await paxSelect.selectOption('3');

  const vehSelect = bookingSection.locator('select').nth(1);
  await vehSelect.selectOption('dzire');

  // Verify that the driver hotel toggle is NOT present in the main card
  await expect(bookingSection.getByText('Driver Room in Tirupati')).not.toBeVisible();

  // Click GST Tax Invoice to open the official modal
  await expect(bookingSection.locator('text=All-Inclusive Cash Package Fare')).toBeVisible();
  await bookingSection.locator('button:has-text("GST Tax Invoice")').click();

  // Wait for dialog
  const modal = page.locator('div[role="dialog"][data-hide-contact-dock]');
  await expect(modal).toBeVisible();

  const modalText = await modal.innerText();
  console.log('--- MODAL BILL TEXT ---\n', modalText);

  // 1. Verify itemized breakdown lines for 1 Day + 23 hrs (Model 2 continuous scaling)
  await expect(modal.getByText(/Dedicated AC Vehicle Hire & 100% Fuel/)).toBeVisible();
  await expect(modal.getByText('₹7,600')).toBeVisible();

  await expect(modal.getByText(/Chauffeur Outstation Duty Allowance & Halting Batta/)).toBeVisible();
  await expect(modal.getByText('₹1,750')).toBeVisible();

  // 2. Verify Chauffeur Dormitory Rest is explicitly included with no room required
  await expect(modal.getByText(/Chauffeur rests in vehicle \/ pilgrim dormitories \(No hotel room required from guest\)/)).toBeVisible();
  await expect(modal.getByText('INCLUDED').first()).toBeVisible();

  // 3. Verify math adds up to Total (₹9,350 taxable package value)
  await expect(modal.getByText('₹9,350').first()).toBeVisible();

  // 4. Verify Darshan Ticket not included note
  await expect(modal.getByText(/Darshan Ticket: Not Included/)).toBeVisible();

  // Take screenshot of modal in mobile viewport
  await page.screenshot({ path: 'tests/tirupati_transparent_bill_mobile.png' });
  console.log('✔ Captured tests/tirupati_transparent_bill_mobile.png');
});
