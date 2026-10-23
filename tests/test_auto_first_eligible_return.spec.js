import { test, expect } from '@playwright/test';

test.describe('Universal First Eligible Return Date & Realistic Travel Advisory Rule', () => {

  test('TourBookingEngine: Auto-selects first eligible return and does not warn automatically', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

    const bookingSection = page.locator('#booking');
    await bookingSection.scrollIntoViewIfNeeded();

    const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
    const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);

    // 1. Initial State: Return DateTime input MUST be disabled
    await expect(returnDate).toBeDisabled();

    // 2. Select Pickup Date (Oct 25, 06:00)
    await pickupDate.fill('2026-10-25T06:00');

    // 3. Return datetime must now be enabled
    await expect(returnDate).toBeEnabled();

    // 4. Must auto-select first eligible return date (12 hrs for Tirupati -> 18:00)
    const defaultValue = await returnDate.inputValue();
    expect(defaultValue).toBe('2026-10-25T18:00');

    // 5. Must NOT warn the passenger automatically
    await expect(bookingSection.getByText('Realistic Travel Advisory:')).not.toBeVisible();

    // 6. If passenger tries a tighter schedule (< 12 hrs), ONLY show Realistic Travel Advisory hint
    await returnDate.fill('2026-10-25T16:00');
    await expect(bookingSection.getByText('Realistic Travel Advisory:')).toBeVisible();

    // Verify it is an advisory hint, not an error alert
    await expect(bookingSection.locator('p[role="alert"]')).toHaveCount(0);
  });

  test('Multi-Day Tour (Navagraha): Auto-selects 36-hr first eligible return without automatic warning', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/services/navagraha-tour/', { waitUntil: 'networkidle' });

    const bookingSection = page.locator('#booking');
    await bookingSection.scrollIntoViewIfNeeded();

    const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
    const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);

    await pickupDate.fill('2026-10-25T06:00');

    // First eligible return is 36 hours later -> 2026-10-26T18:00
    const defaultValue = await returnDate.inputValue();
    expect(defaultValue).toBe('2026-10-26T18:00');

    // No warning shown automatically
    await expect(bookingSection.getByText('Realistic Travel Advisory:')).not.toBeVisible();

    // If shortened below 36 hrs, Realistic Travel Advisory appears
    await returnDate.fill('2026-10-26T12:00');
    await expect(bookingSection.getByText('Realistic Travel Advisory:')).toBeVisible();
  });

  test('QuotationEngine: Auto-selects first eligible return on round trip without automatic warning', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const form = page.locator('#booking-panel');
    await form.scrollIntoViewIfNeeded();

    // Ensure round trip tab is active
    const roundTab = form.locator('button:has-text("Round Trip")');
    await roundTab.click();

    const pickupInput = form.locator('#pickup-input');
    const dropInput = form.locator('#drop-input');
    const dateInput = form.locator('input[id*="pickup-date-main"]');
    const returnDateInput = form.locator('input[id*="return-date-main"]');

    // Enter pickup and distant destination
    await pickupInput.fill('Chennai');
    await dropInput.fill('Bengaluru');
    await dateInput.fill('2026-10-25T06:00');

    // Click calculate fare button
    const calcBtn = form.locator('#btn-calculate-fare');
    await calcBtn.click();

    // Wait for distance to resolve and return date to auto-sync
    await expect(async () => {
      const returnVal = await returnDateInput.inputValue();
      expect(returnVal).toBeTruthy();
      expect(new Date(returnVal) >= new Date('2026-10-26T06:00')).toBe(true);
    }).toPass({ timeout: 6000 });

    // Advisory should NOT be shown automatically
    await expect(form.getByText('Realistic Travel Advisory:')).not.toBeVisible();

    // If user explicitly changes return date to same-day tight return
    await returnDateInput.fill('2026-10-25T14:00');
    await expect(form.getByText('Realistic Travel Advisory:')).toBeVisible();
  });

});
