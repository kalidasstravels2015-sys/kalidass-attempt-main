import { test, expect } from '@playwright/test';

test.describe('Non-Interactive Tariff Cards Validation', () => {

  test('Fixed Acting Driver Rates & Packages has no selection, no interactions, and no call/whatsapp queries', async ({ page }) => {
    await page.goto('/services/acting-drivers/', { waitUntil: 'networkidle' });

    // 1. Verify tariffs section exists and renders heading
    const tariffsHeading = page.locator('#tariffs h2');
    await expect(tariffsHeading).toBeVisible();
    await expect(tariffsHeading).toContainText('Fixed Acting Driver Rates & Packages');

    // 2. Verify no selection radio options exist
    const cityOptions = page.locator('[data-city-option]');
    const onewayOptions = page.locator('[data-oneway-option]');
    const roundOptions = page.locator('[data-round-option]');
    const radioElements = page.locator('#pricing-panel-cards [role="radio"]');
    const radioCircles = page.locator('#pricing-panel-cards .city-radio-circle, #pricing-panel-cards .oneway-radio-circle, #pricing-panel-cards .round-radio-circle');

    expect(await cityOptions.count()).toBe(0);
    expect(await onewayOptions.count()).toBe(0);
    expect(await roundOptions.count()).toBe(0);
    expect(await radioElements.count()).toBe(0);
    expect(await radioCircles.count()).toBe(0);
    console.log('✔ Verified zero selection / radio button controls in tariff cards.');

    // 3. Verify no call or whatsapp enquiry buttons in tariff cards
    const cardWaButtons = page.locator('#pricing-panel-cards a[href*="wa.me"]');
    const cardCallButtons = page.locator('#pricing-panel-cards a[href^="tel:"]');
    const cityWaBtn = page.locator('#city-card-whatsapp-btn');
    const onewayWaBtn = page.locator('#oneway-card-whatsapp-btn');
    const roundWaBtn = page.locator('#round-trip-whatsapp-btn');

    expect(await cardWaButtons.count()).toBe(0);
    expect(await cardCallButtons.count()).toBe(0);
    expect(await cityWaBtn.count()).toBe(0);
    expect(await onewayWaBtn.count()).toBe(0);
    expect(await roundWaBtn.count()).toBe(0);
    console.log('✔ Verified zero call or whatsapp enquiry buttons in tariff cards.');

    // 4. Verify no intake dialog exists in tariffs
    const dialog = page.locator('#chauffeur-intake-dialog');
    expect(await dialog.count()).toBe(0);

    // 5. Verify the 3 tariff cards display correct information
    const cardHeaders = page.locator('#pricing-panel-cards h3');
    expect(await cardHeaders.count()).toBe(3);
    await expect(cardHeaders.nth(0)).toContainText('Within Chennai Metro');
    await expect(cardHeaders.nth(1)).toContainText('Outstation One-Way Drop');
    await expect(cardHeaders.nth(2)).toContainText('Outstation Round Trip');

    // Card 1 rates
    await expect(page.locator('#pricing-panel-cards').first()).toContainText('₹750');
    await expect(page.locator('#pricing-panel-cards').first()).toContainText('₹1,200');

    // Card 2 routes
    await expect(page.locator('#pricing-panel-cards')).toContainText('Chennai → Pondicherry');
    await expect(page.locator('#pricing-panel-cards')).toContainText('₹1,900');

    // Card 3 vehicle rates
    await expect(page.locator('#pricing-panel-cards')).toContainText('Hatchback & Sedan');
    await expect(page.locator('#pricing-panel-cards')).toContainText('₹1,700 / day');

    console.log('✔ All 3 tariff cards verified with complete static rate information.');
  });

});
