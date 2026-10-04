import { test, expect } from '@playwright/test';

test.describe('Mandatory Tariff Card Option Selection Validation', () => {

  test('Card 1: City Metro Duty requires 4h or 8h selection before WhatsApp enquiry', async ({ page }) => {
    await page.goto('/services/acting-drivers/', { waitUntil: 'networkidle' });

    const cityOptions = page.locator('[data-city-option]');
    const waBtn = page.locator('#city-card-whatsapp-btn');
    const hint = page.locator('#city-selection-hint');

    // 1. Initially both options are unselected
    expect(await cityOptions.count()).toBe(2);
    await expect(cityOptions.nth(0)).toHaveAttribute('aria-checked', 'false');
    await expect(cityOptions.nth(1)).toHaveAttribute('aria-checked', 'false');
    await expect(hint).toBeHidden();

    // 2. Click WhatsApp button without selecting -> hint appears, no navigation
    await waBtn.click();
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('Please select 4 Hours or 8 Hours above');
    console.log('✔ Card 1: Prevented unselected submission and showed hint.');

    // 3. Select 4 Hours Duty
    await cityOptions.nth(0).click();
    await expect(cityOptions.nth(0)).toHaveAttribute('aria-checked', 'true');
    await expect(cityOptions.nth(1)).toHaveAttribute('aria-checked', 'false');
    await expect(hint).toBeHidden();

    // Check WhatsApp href for 4 Hours
    let href = await waBtn.getAttribute('href');
    expect(href).toContain('4-Hour');
    expect(href).toContain('500');
    console.log('✔ Card 1: Selected 4-Hour duty, WhatsApp href updated:', href);

    // 4. Switch to 8 Hours Duty
    await cityOptions.nth(1).click();
    await expect(cityOptions.nth(0)).toHaveAttribute('aria-checked', 'false');
    await expect(cityOptions.nth(1)).toHaveAttribute('aria-checked', 'true');

    href = await waBtn.getAttribute('href');
    expect(href).toContain('8-Hour');
    expect(href).toContain('800');
    console.log('✔ Card 1: Switched to 8-Hour duty, WhatsApp href updated:', href);
  });

  test('Card 2: One-Way Drop requires destination route selection', async ({ page }) => {
    await page.goto('/services/acting-drivers/', { waitUntil: 'networkidle' });

    const onewayOptions = page.locator('[data-oneway-option]');
    const waBtn = page.locator('#oneway-card-whatsapp-btn');
    const hint = page.locator('#oneway-selection-hint');

    // Initially unselected & hint hidden
    await expect(hint).toBeHidden();

    // Click without selection
    await waBtn.click();
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('Please select a drop route above');
    console.log('✔ Card 2: Prevented unselected submission and showed hint.');

    // Select Pondicherry
    await onewayOptions.nth(0).click();
    await expect(onewayOptions.nth(0)).toHaveAttribute('aria-checked', 'true');
    await expect(hint).toBeHidden();

    let href = decodeURIComponent(await waBtn.getAttribute('href'));
    expect(href).toContain('Pondicherry');
    expect(href).toContain('1,600');
    console.log('✔ Card 2: Selected Pondicherry, WhatsApp href updated:', href);

    // Select Bangalore
    await onewayOptions.nth(1).click();
    href = decodeURIComponent(await waBtn.getAttribute('href'));
    expect(href).toContain('Bangalore');
    expect(href).toContain('1,850');
    console.log('✔ Card 2: Selected Bangalore, WhatsApp href updated:', href);
  });

  test('Card 3: Round Trip requires vehicle selection and updates with dynamic preferences', async ({ page }) => {
    await page.goto('/services/acting-drivers/', { waitUntil: 'networkidle' });

    const roundOptions = page.locator('[data-round-option]');
    const waBtn = page.locator('#round-trip-whatsapp-btn');
    const hint = page.locator('#round-selection-hint');

    // Click without vehicle selection
    await waBtn.click();
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('Please select your vehicle type above');
    console.log('✔ Card 3: Prevented unselected submission and showed hint.');

    // Select Compact SUV / MPV
    await roundOptions.nth(1).click();
    await expect(roundOptions.nth(1)).toHaveAttribute('aria-checked', 'true');
    await expect(hint).toBeHidden();

    let href = await waBtn.getAttribute('href');
    expect(decodeURIComponent(href)).toContain('Compact SUV / MPV');
    expect(decodeURIComponent(href)).toContain('Bata + Food Included');
    console.log('✔ Card 3: Selected Compact SUV, WhatsApp href updated with preferences.');

    // Uncheck Stay (Lodge allowance needed)
    await page.locator('#card-stay-provided').uncheck();
    href = await waBtn.getAttribute('href');
    expect(decodeURIComponent(href)).toContain('All-Inclusive (Bata + Food + Stay)');
    expect(decodeURIComponent(href)).toContain('Driver night lodge allowance included (+₹300/night)');
    expect(decodeURIComponent(href)).toContain('₹1,800/day');
    console.log('✔ Card 3: Unchecked stay, WhatsApp href updated with All-Inclusive preferences (₹1,800/day).');

    // Check Food provided by passenger
    await page.locator('#card-food-provided').check();
    href = await waBtn.getAttribute('href');
    expect(decodeURIComponent(href)).toContain('Bata + Lodge Stay Included');
    expect(decodeURIComponent(href)).toContain('Food arranged by passenger (₹0)');
    expect(decodeURIComponent(href)).toContain('₹1,500/day');
    console.log('✔ Card 3: Checked food, WhatsApp href updated with Food arranged by passenger (₹1,500/day).');

    // Verify mobile dock is in sync
    const dockWaBtn = page.locator('#mobile-dock-whatsapp-btn');
    const dockHref = await dockWaBtn.getAttribute('href');
    expect(dockHref).toBe(href);
    console.log('✔ Mobile bottom dock WhatsApp button is in sync with Card 3 preferences.');

    // Capture visual screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    const card1 = page.locator('#pricing-panel-cards > div').first();
    await card1.scrollIntoViewIfNeeded();

    // Trigger hint on Card 1 for visual demonstration
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#city-card-whatsapp-btn').click();
    await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/d009ebb2-bab8-4f29-9d14-26c200720c6a/card1_selection_hint.png' });

    // Now select 4 Hours
    await page.locator('[data-city-option]').first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/d009ebb2-bab8-4f29-9d14-26c200720c6a/card1_4hours_selected.png' });
    console.log('✔ Screenshots captured: card1_selection_hint.png and card1_4hours_selected.png');
  });

});
