import { test, expect } from '@playwright/test';

test.describe('Outstation and Home Page: Do not bring tour booking quotation formula', () => {
  test('Outstation page QuotationEngine calculates standard per-km fare for Tirupati without tour package formula', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/services/outstation-cabs/', { waitUntil: 'networkidle' });

    const bookingCard = page.locator('section:has(#pickup-input)').first();
    await bookingCard.scrollIntoViewIfNeeded();

    // Fill pickup & drop
    const pickupInput = bookingCard.locator('#pickup-input');
    await expect(pickupInput).toBeVisible();
    await pickupInput.click();
    await pickupInput.fill('Pallavaram, Chennai');
    await pickupInput.blur();

    const dropInput = bookingCard.locator('#drop-input');
    await expect(dropInput).toBeVisible();
    await dropInput.click();
    await dropInput.fill('Tirupati, Andhra Pradesh');
    await dropInput.blur();

    // Fill return date for outstation round trip
    const returnInput = bookingCard.locator('input[id*="return-date"], input[type="datetime-local"]').nth(1);
    const pickupVal = await bookingCard.locator('input[type="datetime-local"]').first().inputValue();
    const returnVal = pickupVal.slice(0, 11) + '22:00';
    await returnInput.fill(returnVal);

    // Click View Instant Fare
    const calcBtn = bookingCard.locator('button:has-text("View Instant Fare"), button:has-text("Recalculate Fare")').first();
    await expect(calcBtn).toBeVisible();
    await calcBtn.click();

    // Wait for calculation result card
    await page.waitForTimeout(1000);

    // Verify tour package formula elements are NOT present in booking card
    await expect(bookingCard.locator('text=100% Fuel + Tolls + AP Permit + Hill Climb + Driver Bata Included')).toHaveCount(0);
    await expect(bookingCard.locator('text=Tolls, AP State Tax & Tirumala Ghat: INCLUDED')).toHaveCount(0);
    await expect(bookingCard.locator('.font-heading:has-text("₹6,000")')).toHaveCount(0);

    // Verify standard outstation formula elements ARE present
    await expect(bookingCard.locator('text=100% Fuel, Chauffeur & AC Included').first()).toBeVisible();
    await expect(bookingCard.locator('text=Payment:').first()).toBeVisible();
    await expect(bookingCard.locator('text=advance to confirm').first()).toBeVisible();

    // Base fare should be ~₹4,880 (or 250km min ₹3,900) - definitely NOT ₹6,000 tour rate
    const fareHeading = bookingCard.locator('.font-heading:has-text("₹")').first();
    const fareText = await fareHeading.innerText();
    console.log('Outstation calculated fare:', fareText);
    expect(fareText).not.toBe('₹6,000');

    await page.screenshot({ path: 'tests/outstation_tirupati_standard_calc.png', fullPage: false });
  });

  test('Home page QuotationEngine calculates standard per-km fare for Tirupati', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const bookingSection = page.locator('#booking-panel');
    await bookingSection.scrollIntoViewIfNeeded();

    const pickupInput = bookingSection.locator('#pickup-input');
    await expect(pickupInput).toBeVisible();
    await page.waitForTimeout(500); // Wait for client:visible hydration

    await pickupInput.click();
    await pickupInput.fill('Pallavaram, Chennai');
    await pickupInput.blur();

    const dropInput = bookingSection.locator('#drop-input');
    await expect(dropInput).toBeVisible();
    await dropInput.click();
    await dropInput.fill('Tirupati, Andhra Pradesh');
    await dropInput.blur();

    // Fill return date for outstation round trip
    const returnInput = bookingSection.locator('input[id*="return-date"], input[type="datetime-local"]').nth(1);
    const pickupVal = await bookingSection.locator('input[type="datetime-local"]').first().inputValue();
    const returnVal = pickupVal.slice(0, 11) + '22:00';
    await returnInput.fill(returnVal);

    const calcBtn = bookingSection.locator('button:has-text("View Instant Fare"), button:has-text("Recalculate Fare")').first();
    await expect(calcBtn).toBeVisible();
    await calcBtn.click();

    await page.waitForTimeout(1000);

    // Verify tour package formula elements are NOT present in booking section
    await expect(bookingSection.locator('text=100% Fuel + Tolls + AP Permit + Hill Climb + Driver Bata Included')).toHaveCount(0);
    await expect(bookingSection.locator('text=Tolls, AP State Tax & Tirumala Ghat: INCLUDED')).toHaveCount(0);
    await expect(bookingSection.locator('.font-heading:has-text("₹6,000")')).toHaveCount(0);

    // Verify standard outstation elements
    await expect(bookingSection.locator('text=100% Fuel, Chauffeur & AC Included').first()).toBeVisible();
    await expect(bookingSection.locator('text=Payment:').first()).toBeVisible();
    await expect(bookingSection.locator('text=advance to confirm').first()).toBeVisible();

    const fareHeading = bookingSection.locator('.font-heading:has-text("₹")').first();
    const fareText = await fareHeading.innerText();
    console.log('Home page calculated fare:', fareText);
    expect(fareText).not.toBe('₹6,000');

    await page.screenshot({ path: 'tests/home_tirupati_standard_calc.png', fullPage: false });
  });

  test('Outstation vehicle modal calculates standard fare for Tirupati without tour formula', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/services/outstation-cabs/', { waitUntil: 'networkidle' });

    // Open Dzire card modal
    const dzireBtn = page.locator('button[data-open-outstation-calc="true"][data-vehicle-key="Swift Dzire"]').first();
    await expect(dzireBtn).toBeVisible();
    await dzireBtn.click();

    const modal = page.locator('[role="dialog"][aria-labelledby="outstation-modal-title"]');
    await expect(modal).toBeVisible();

    // Fill pickup & drop
    const pickupInput = modal.locator('#modal-pickup-location');
    await pickupInput.fill('Pallavaram, Chennai');
    await pickupInput.blur();

    const dropInput = modal.locator('#modal-drop-location');
    await dropInput.fill('Tirupati, Andhra Pradesh');
    await dropInput.blur();

    const calcBtn = modal.locator('button:has-text("Calculate Accurate Fare")');
    if (await calcBtn.isVisible()) {
      await calcBtn.click();
    }

    await page.waitForTimeout(1000);

    // Verify no tour package formula
    await expect(modal.locator('text=100% Fuel + Tolls + AP Interstate Permit + Hill Climb + Driver Bata Included')).toHaveCount(0);
    await expect(modal.locator('text=FASTag Tolls, AP State Tax & Tirumala Ghat: INCLUDED')).toHaveCount(0);
    await expect(modal.locator('.font-heading:has-text("₹6,000")')).toHaveCount(0);

    // Verify standard outstation breakdown
    await expect(modal.locator('text=/km · Fuel & Chauffeur Day Bata Included').first()).toBeVisible();
    await expect(modal.locator('text=Balance to Pay Driver').first()).toBeVisible();

    await page.screenshot({ path: 'tests/modal_tirupati_standard_calc.png', fullPage: false });
  });
});
