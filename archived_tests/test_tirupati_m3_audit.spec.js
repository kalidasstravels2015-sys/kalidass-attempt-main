import { test, expect } from '@playwright/test';

test.describe('Tirupati Booking Engine Unified M3 Action Card & Flow Verification', () => {
  test('Verify single unified M3 action card, direct WhatsApp booking, and optional itemized bill modal', async ({ page }) => {
    // Mobile viewport matching user's Pixel device from screenshot
    await page.setViewportSize({ width: 412, height: 924 });
    await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

    const bookingSection = page.locator('#booking');
    await bookingSection.scrollIntoViewIfNeeded();

    // 1. Initial State: Button is active, not hidden or disabled
    const initialBtn = bookingSection.locator('a:has-text("Book on WhatsApp"), button:has-text("Book on WhatsApp")').first();
    await expect(initialBtn).toBeVisible();
    await page.waitForTimeout(300);

    // 2. Click when empty shows friendly text validation message
    await initialBtn.click();
    const alertMsg = bookingSection.locator('p[role="alert"]');
    await expect(alertMsg).toBeVisible();
    await expect(alertMsg).toContainText('Please enter pickup location in Chennai');

    // Fill pickup address
    const pickupInput = bookingSection.locator('input[placeholder*="pickup address in Chennai"]');
    await pickupInput.fill('Chennai Central');

    // 3. Fill Dates: 47 hours = 1 Day + 23 hrs (matching user screenshot)
    const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
    const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);
    await pickupDate.fill('2026-10-10T08:42');
    await returnDate.fill('2026-10-12T07:42');

    // Select Passengers & Vehicle
    const paxSelect = bookingSection.locator('select').first();
    await paxSelect.selectOption('1');

    const vehSelect = bookingSection.locator('select').nth(1);
    await vehSelect.selectOption('dzire');

    // 4. Verify Unified M3 Action Card is rendered (Single cohesive container)
    const fareCard = bookingSection.locator('text=/All-Inclusive (Cash )?Package Fare|Multi-Day Tariff/');
    await expect(fareCard).toBeVisible();
    await expect(bookingSection.getByText('₹ 9,350').first()).toBeVisible();

    // 5. Verify Direct Booking CTA exists directly on the card
    const directWaBtn = bookingSection.locator('a:has-text("Book on WhatsApp")').first();
    await expect(directWaBtn).toBeVisible();

    // 6. Verify GST Tax Invoice progressive disclosure checkbox
    const gstCheckbox = bookingSection.locator('input[type="checkbox"]');
    await expect(gstCheckbox).toBeVisible();

    // Capture screenshot of clean card layout
    await bookingSection.screenshot({ path: 'tests/tirupati_m3_clean_card.png' });

    // 7. Click GST Checkbox -> switches card in place, then open proforma modal
    await gstCheckbox.check();
    const viewProformaBtn = bookingSection.locator('button:has-text("View Proforma Bill")');
    await viewProformaBtn.click();
    const modal = page.locator('div[role="dialog"][data-hide-contact-dock]');
    await expect(modal).toBeVisible();

    // Verify modal content (Official GST Proforma Invoice & Estimate by default)
    await expect(modal.getByText(/PROFORMA TRIP ESTIMATE & GST BREAKDOWN|PROFORMA TAX INVOICE & ESTIMATE|Trip Fare Estimate Bill/i)).toBeVisible();
    await expect(modal.getByText('Swift Dzire / Toyota Etios', { exact: true })).toBeVisible();
    await expect(modal.getByText('Chennai Central')).toBeVisible();
    await expect(modal.getByText('₹9,350').or(modal.getByText('₹ 9,350')).first()).toBeVisible();

    // Verify WhatsApp button inside modal
    const modalWaBtn = modal.locator('a:has-text("Book on WhatsApp")');
    await expect(modalWaBtn).toBeVisible();

    // Take screenshot of modal
    await page.screenshot({ path: 'tests/tirupati_m3_unified_modal.png' });
    console.log('✔ Verified Unified M3 Action Card behavior and captured screenshots');
  });
});
