import { test, expect } from '@playwright/test';

test.describe('Airport Taxi Route Swap Tests', () => {
  test('Airport Taxi page has constant MAA field and swaps correctly', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 850 });
    await page.goto('/services/chennai-airport-taxi/');

    const finder = page.locator('#airport-fare-finder');
    await expect(finder).toBeVisible();

    const tabDrop = page.locator('[data-testid="tab-drop"]');
    const tabPickup = page.locator('[data-testid="tab-pickup"]');
    await expect(tabDrop).toBeVisible();
    await expect(tabPickup).toBeVisible();

    const fromInput = page.locator('#airport-from-input');
    const toInput = page.locator('#airport-to-input');

    // 1. Initial State: Default is Airport Drop Mode
    await expect(tabDrop).toHaveAttribute('aria-selected', 'true');
    await expect(tabPickup).toHaveAttribute('aria-selected', 'false');

    // In Drop mode: From is user doorstep (editable), To is constant MAA (read-only)
    await expect(fromInput).not.toHaveAttribute('readonly', '');
    await expect(fromInput).toHaveAttribute('placeholder', /Enter your area \/ doorstep address/);
    await expect(toInput).toHaveAttribute('readonly', '');
    await expect(toInput).toHaveValue(/Chennai International Airport \(MAA\)/);

    // 2. Click Tab -> Switches to Airport Pickup Mode
    await tabPickup.scrollIntoViewIfNeeded();
    await tabPickup.click();

    await expect(tabPickup).toHaveAttribute('aria-selected', 'true', { timeout: 7000 });
    await expect(tabDrop).toHaveAttribute('aria-selected', 'false');

    // In Pickup mode: From is constant MAA (read-only), To is user destination (editable)
    await expect(fromInput).toHaveAttribute('readonly', '');
    await expect(fromInput).toHaveValue(/Chennai International Airport \(MAA\)/);
    await expect(toInput).not.toHaveAttribute('readonly', '');
    await expect(toInput).toHaveAttribute('placeholder', /Enter hotel \/ area \/ address/);

    // 3. Click Tab again -> Switches back to Airport Drop Mode
    await tabDrop.click();

    await expect(tabDrop).toHaveAttribute('aria-selected', 'true');
    await expect(tabPickup).toHaveAttribute('aria-selected', 'false');
    await expect(fromInput).not.toHaveAttribute('readonly', '');
    await expect(toInput).toHaveAttribute('readonly', '');
    await expect(toInput).toHaveValue(/Chennai International Airport \(MAA\)/);

    // 4. Test Flat Fare Calculation for Destination
    await fromInput.fill('T. Nagar');
    const calcBtn = page.locator('#get-flat-fare-btn');
    await expect(calcBtn).toBeVisible();
    await calcBtn.click();

    // Booking modal appears with calculated zone and price
    const modal = page.locator('#airport-booking-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Central Chennai|T\. Nagar/i);
    await expect(modal).toContainText(/₹950|₹/);

    // Close modal
    const closeBtn = modal.locator('button[aria-label="Close"]');
    await closeBtn.click();
    await expect(modal).toBeHidden();

    // 5. Test Pickup Calculation
    await tabPickup.click();
    await toInput.fill('T. Nagar');
    await page.keyboard.press('Escape');
    await calcBtn.click();

    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Central Chennai|T\. Nagar/i);
    await expect(modal).toContainText(/₹950|₹/);
  });
});


