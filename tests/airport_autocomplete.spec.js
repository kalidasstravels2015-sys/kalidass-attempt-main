import { test, expect } from '@playwright/test';

test.describe('Airport Booking Engine Autocomplete & Zone Resolution Tests', () => {

  test('Airport Page: Destination input attaches Google Places Autocomplete and displays suggestions container', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/services/chennai-airport-taxi/', { waitUntil: 'networkidle' });

    const airportDestInput = page.locator('#airport-dest-input');
    await expect(airportDestInput).toBeVisible();

    // 1. Focus input -> Triggers lazy Google Places load and attaches Autocomplete
    await airportDestInput.focus();
    await page.waitForTimeout(1000);

    const isAttached = await airportDestInput.getAttribute('data-google-attached');
    expect(isAttached).toBe('true');

    // 2. Type a destination in Chennai
    await airportDestInput.pressSequentially('Anna Nagar', { delay: 80 });
    await page.waitForTimeout(1000);

    // 3. Verify PAC container appears in DOM
    const pacContainer = page.locator('.pac-container');
    await expect(pacContainer.first()).toBeAttached();
  });

  test('Airport Page: Calculate instant fare for Central Chennai zone (Anna Nagar)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/services/chennai-airport-taxi/', { waitUntil: 'networkidle' });

    const airportDestInput = page.locator('#airport-dest-input');
    await expect(airportDestInput).toBeVisible();

    await airportDestInput.fill('Anna Nagar, Chennai');
    await page.waitForTimeout(300);

    const getFareBtn = page.locator('#get-flat-fare-btn');
    await expect(getFareBtn).toBeVisible();
    await getFareBtn.click();

    // Summary card should appear with Central Zone fare ₹950
    const summaryCard = page.locator('#fare-result-summary-card');
    await expect(summaryCard).toBeVisible();
    await expect(summaryCard).toContainText(/Chennai Airport \(MAA\)/);
    await expect(summaryCard).toContainText(/₹950/);
  });

});
