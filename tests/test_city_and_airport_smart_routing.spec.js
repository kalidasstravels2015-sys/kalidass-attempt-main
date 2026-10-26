import { test, expect } from '@playwright/test';

test.describe('Cab Booking Engine Smart Routing & Tab Redesign', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12/13 mobile viewport
  });

  test('only 2 tabs are visible in main Cab Booking Engine (No One Way cab)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const bookingCard = page.locator('section:has(#pickup-input)').first();
    await bookingCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Wait for client:visible hydration
    await expect(bookingCard).toBeVisible();

    // Verify Outstation and Local Package tabs exist
    await expect(bookingCard.locator('button:has-text("Outstation (Round Trip)"), button:has-text("சுற்றுப்பயணம்")')).toBeVisible();
    await expect(bookingCard.locator('button:has-text("Local Package"), button:has-text("லோக்கல் பேக்கேஜ்")')).toBeVisible();

    // Verify One Way Drop tab is NOT present in main cab quotation tabs
    await expect(bookingCard.locator('button:has-text("One Way Drop")')).toBeHidden();
    await expect(bookingCard.locator('button:has-text("One Way")')).toBeHidden();
  });

  test('airport route renders dedicated airport transfer card without ₹3,900 outstation minimum', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const bookingCard = page.locator('section:has(#pickup-input)').first();
    await bookingCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Wait for client:visible hydration

    const pickupInput = bookingCard.locator('#pickup-input');
    await expect(pickupInput).toBeVisible();
    await pickupInput.click();
    await pickupInput.fill('Airport Departures Terminal Link');
    await pickupInput.blur();

    const dropInput = bookingCard.locator('#drop-input');
    await expect(dropInput).toBeVisible();
    await dropInput.click();
    await dropInput.fill('Besant Nagar');
    await dropInput.blur();

    // Trigger calculation
    const calcBtn = bookingCard.locator('button:has-text("Calculate Cost"), button:has-text("View Instant Fare"), button:has-text("Recalculate Fare"), button:has-text("கட்டணம் கணக்கிடுக")').first();
    await expect(calcBtn).toBeVisible();
    await calcBtn.click();

    // Verify fare result card is displayed
    const resultCard = page.locator('#quotation-fare-result-card');
    await expect(resultCard).toBeVisible({ timeout: 5000 });

    // CRITICAL: Ensure ₹3,900 outstation minimum is NOT displayed
    await expect(resultCard.locator('text=₹3,900')).toBeHidden();

    // Verify airport transfer details are displayed
    await expect(resultCard.locator('text=Chennai Airport Transfer (MAA)')).toBeVisible();
    await expect(resultCard.locator('text=Fixed Flat Fare • Zero Surge')).toBeVisible();
    await expect(resultCard.locator('text=Sedan (4 Pax)')).toBeVisible();

    // Verify airport page CTA link
    const airportLink = resultCard.locator('a[href="/services/chennai-airport-taxi/"]');
    await expect(airportLink).toBeVisible();

    await page.screenshot({ path: 'tests/airport_smart_routing_verified.png' });
  });

  test('intra-city route auto-switches to Local Package (₹1,500) without ₹3,900 outstation minimum', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const bookingCard = page.locator('section:has(#pickup-input)').first();
    await bookingCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Wait for client:visible hydration

    const pickupInput = bookingCard.locator('#pickup-input');
    await expect(pickupInput).toBeVisible();
    await pickupInput.click();
    await pickupInput.fill('Tambaram');
    await pickupInput.blur();

    const dropInput = bookingCard.locator('#drop-input');
    await expect(dropInput).toBeVisible();
    await dropInput.click();
    await dropInput.fill('Guindy');
    await dropInput.blur();

    // Trigger calculation
    const calcBtn = bookingCard.locator('button:has-text("Calculate Cost"), button:has-text("View Instant Fare"), button:has-text("Recalculate Fare"), button:has-text("கட்டணம் கணக்கிடுக")').first();
    await expect(calcBtn).toBeVisible();
    await calcBtn.click();

    // Verify fare result card is displayed
    const resultCard = page.locator('#quotation-fare-result-card');
    await expect(resultCard).toBeVisible({ timeout: 5000 });

    // CRITICAL: Ensure ₹3,900 outstation minimum is NOT displayed
    await expect(resultCard.locator('text=₹3,900')).toBeHidden();

    // Verify it automatically routed to Local Package
    await expect(resultCard.locator('text=Intra-city route detected')).toBeVisible();
    await expect(resultCard.locator('text=5 Hrs / 50 Km')).toBeVisible();

    // Verify local package price of ₹1,500 is shown (use .first() for strict mode)
    await expect(resultCard.locator('text=₹1,500').first()).toBeVisible();

    await page.screenshot({ path: 'tests/city_auto_routing_verified.png' });
  });

  test('genuine outstation route calculates Outstation Round Trip correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const bookingCard = page.locator('section:has(#pickup-input)').first();
    await bookingCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500); // Wait for client:visible hydration

    const pickupInput = bookingCard.locator('#pickup-input');
    await expect(pickupInput).toBeVisible();
    await pickupInput.click();
    await pickupInput.fill('Chennai');
    await pickupInput.blur();

    const dropInput = bookingCard.locator('#drop-input');
    await expect(dropInput).toBeVisible();
    await dropInput.click();
    await dropInput.fill('Pondicherry');
    await dropInput.blur();

    // Fill return date (since genuine outstation round trip requires user to pick return date)
    const returnInput = bookingCard.locator('input[id*="return-date"], input[type="datetime-local"]').nth(1);
    const pickupVal = await bookingCard.locator('input[type="datetime-local"]').first().inputValue();
    const returnVal = pickupVal.slice(0, 11) + '22:00';
    await returnInput.fill(returnVal);

    // Trigger calculation
    const calcBtn = bookingCard.locator('button:has-text("Calculate Cost"), button:has-text("View Instant Fare"), button:has-text("Recalculate Fare"), button:has-text("கட்டணம் கணக்கிடுக")').first();
    await expect(calcBtn).toBeVisible();
    await calcBtn.click();

    const resultCard = page.locator('#quotation-fare-result-card');
    await expect(resultCard).toBeVisible({ timeout: 5000 });

    // For Pondicherry, round trip is ~302 km (> 250 km)
    await expect(resultCard.locator('text=Swift Dzire')).toBeVisible();

    await page.screenshot({ path: 'tests/outstation_genuine_calc_verified.png' });
  });
});
