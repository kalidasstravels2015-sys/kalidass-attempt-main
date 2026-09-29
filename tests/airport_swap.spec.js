import { test, expect } from '@playwright/test';

test.describe('Airport Taxi Route Swap Tests', () => {
  test('Airport Taxi page has constant MAA field and swaps correctly', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 850 });
    await page.goto('/services/chennai-airport-taxi/');

    const finder = page.locator('#airport-fare-finder');
    await expect(finder).toBeVisible();

    // 1. Initial State: Pickup Mode
    const indicator = page.locator('#sticky-direction-indicator');
    await expect(indicator).toContainText('Landing at Airport (Pickup)');

    const airportCard = page.locator('#airport-field-card');
    await expect(airportCard).toBeVisible();
    await expect(airportCard).toContainText('Chennai International Airport (MAA)');
    await expect(airportCard).toContainText('Arrival Exit Gates');

    const searchInput = page.locator('#airport-search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /Where to\?/);

    const swapBtn = page.locator('#route-swap-btn');
    await expect(swapBtn).toBeVisible();
    await expect(swapBtn).toContainText('Swap to Airport Drop');

    // 2. Click Swap Button -> Switches to Drop Mode
    await swapBtn.click();

    await expect(indicator).toContainText('Going to Airport (Drop)');
    await expect(swapBtn).toContainText('Swap to Airport Pickup');
    await expect(airportCard).toContainText('Direct Ramp Drop');
    await expect(searchInput).toHaveAttribute('placeholder', /Where from\?/);

    // Check heading
    const tariffHeading = page.locator('#tariff-heading');
    await expect(tariffHeading).toContainText('Book Airport Drop');

    // 3. Click Swap Button again -> Switches back to Pickup Mode
    await swapBtn.click();

    await expect(indicator).toContainText('Landing at Airport (Pickup)');
    await expect(swapBtn).toContainText('Swap to Airport Drop');
    await expect(airportCard).toContainText('Arrival Exit Gates');
    await expect(searchInput).toHaveAttribute('placeholder', /Where to\?/);
    await expect(tariffHeading).toContainText('Book Airport Pickup');

    // 4. Test Autocomplete Search
    await searchInput.fill('T. Nagar');
    const dropdown = page.locator('#airport-search-dropdown');
    await expect(dropdown).toBeVisible();

    // Select suggestion
    await dropdown.locator('button').first().click();
    await expect(dropdown).toBeHidden();

    // Result card appears with prices
    const resultBox = page.locator('#finder-result-box');
    await expect(resultBox).toBeVisible();
    await expect(resultBox).toContainText('City Center Hotels');

    // Button label updated with price
    const btnLabel = page.locator('#finder-btn-label');
    await expect(btnLabel).toContainText('Reserve Pickup');

    // 5. Swap while destination is selected
    await swapBtn.click();
    await expect(btnLabel).toContainText('Reserve Drop');
    await expect(tariffHeading).toContainText('Book Airport Drop');
  });
});
