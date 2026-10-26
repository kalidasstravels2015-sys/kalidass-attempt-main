import { test, expect } from '@playwright/test';

test.describe('Airport Taxi Route Swap Tests', () => {
  test('Airport Taxi page has constant MAA field and swaps correctly with Airport Pickup default', async ({ page }) => {
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

    // 1. Initial State: Default is Airport Pickup Mode
    await expect(tabPickup).toHaveAttribute('aria-selected', 'true');
    await expect(tabDrop).toHaveAttribute('aria-selected', 'false');

    // In Pickup mode: From is constant MAA (read-only), To is user destination (editable)
    await expect(fromInput).toHaveAttribute('readonly', '');
    await expect(fromInput).toHaveValue(/Chennai International Airport \(MAA\)/);
    await expect(toInput).not.toHaveAttribute('readonly', '');
    await expect(toInput).toHaveAttribute('placeholder', /Enter hotel \/ area \/ destination city/i);

    // 2. Click Tab -> Switches to Airport Drop Mode
    await tabDrop.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await tabDrop.click();

    await expect(tabDrop).toHaveAttribute('aria-selected', 'true', { timeout: 7000 });
    await expect(tabPickup).toHaveAttribute('aria-selected', 'false');

    // In Drop mode: From is user doorstep (editable), To is constant MAA (read-only)
    await expect(fromInput).not.toHaveAttribute('readonly', '');
    await expect(fromInput).toHaveAttribute('placeholder', /Enter your area \/ doorstep address/i);
    await expect(toInput).toHaveAttribute('readonly', '');
    await expect(toInput).toHaveValue(/Chennai International Airport \(MAA\)/);

    // 3. Click Tab again -> Switches back to Airport Pickup Mode
    await tabPickup.click();

    await expect(tabPickup).toHaveAttribute('aria-selected', 'true');
    await expect(tabDrop).toHaveAttribute('aria-selected', 'false');
    await expect(fromInput).toHaveAttribute('readonly', '');
    await expect(toInput).not.toHaveAttribute('readonly', '');

    // 4. Test Instant Fare Calculation for Destination (Airport Pickup Mode)
    await toInput.fill('Pondicherry');
    const calcBtn = page.locator('#get-flat-fare-btn');
    await expect(calcBtn).toBeVisible();
    await calcBtn.click();

    // 6. Fare Display: Inline card breakdown appears right below the button
    const resultCard = page.locator('#airport-fare-result-card');
    await expect(resultCard).toBeVisible();
    await expect(resultCard).toContainText(/Total Fare/i);
    await expect(resultCard).toContainText(/₹/);
    await expect(resultCard).toContainText(/Advance to Pay/i);
    await expect(resultCard).toContainText(/Balance to Pay Driver/i);

    // WhatsApp Booking Button is visible with calculated fare
    const whatsappBtn = page.locator('#book-airport-whatsapp-btn');
    await expect(whatsappBtn).toBeVisible();
    await expect(whatsappBtn).toContainText(/Book Swift Dzire on WhatsApp/i);

    // 5. Test Drop Mode Calculation
    await tabDrop.click();
    await fromInput.fill('Vellore');
    await fromInput.blur();
    await calcBtn.click();

    await expect(resultCard).toBeVisible();
    await expect(resultCard).toContainText(/Total Fare/i);
    await expect(resultCard).toContainText(/₹/);
  });

  test('Airport Taxi calculates Chennai local transfer (Besant Nagar) as ~13 km and ₹950 flat fare', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 850 });
    await page.goto('/services/chennai-airport-taxi/', { waitUntil: 'networkidle' });

    const finder = page.locator('#airport-fare-finder');
    await expect(finder).toBeVisible();

    const toInput = page.locator('#airport-to-input');
    await expect(toInput).toBeVisible();
    await toInput.fill('5th Ave, Tiruvalluvar Nagar, Besant Nagar, Chennai');
    await toInput.blur();
    await page.waitForTimeout(400);

    const calcBtn = page.locator('#get-flat-fare-btn');
    await calcBtn.click();

    const resultCard = page.locator('#airport-fare-result-card');
    await expect(resultCard).toBeVisible();

    // Verify distance is ~13 km, NOT ~130 km!
    await expect(resultCard).toContainText(/~13 km Airport Pickup/);
    await expect(resultCard).not.toContainText(/~130 km/);

    // Verify flat fare is ₹950 (Sedan), NOT ₹2,480!
    await expect(resultCard.locator('text=₹950').first()).toBeVisible();
    await expect(resultCard).not.toContainText(/₹2,480/);

    // Verify payment split: Advance ₹500, Balance ₹450
    await expect(resultCard.locator('text=₹500').first()).toBeVisible();
    await expect(resultCard.locator('text=₹450').first()).toBeVisible();

    // Verify Fixed Flat Fare badge
    await expect(resultCard.locator('text=Fixed Flat Fare • Zero Surge')).toBeVisible();

    // Switch vehicle to Ertiga SUV (6p) -> should be ₹1,450
    const ertigaBtn = resultCard.locator('button:has-text("Ertiga SUV (6p)")');
    await ertigaBtn.click();
    await expect(resultCard.locator('text=₹1,450').first()).toBeVisible();
  });
});
