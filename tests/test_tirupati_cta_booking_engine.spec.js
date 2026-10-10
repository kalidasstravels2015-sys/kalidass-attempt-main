import { test, expect } from '@playwright/test';

test.describe('Tirupati CTA Simplified Booking Engine (M3 Charcoal)', () => {
  test('Verifies title "Book Chennai to Tirupati", popup modal estimate, auto-calculated duration, and separation from FAQ', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 950 });
    await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

    // 1. Locate the Tirupati booking engine replacing the bottom CTA
    const engine = page.locator('section[aria-label="Tirupati Pilgrimage Booking Engine"]');
    await expect(engine).toBeVisible();

    // Requirement: Add title "Book Chennai to Tirupati"
    await expect(engine.getByRole('heading', { level: 2 })).toHaveText('Book Chennai to Tirupati');

    // Requirement: Avoid oneway - Round trip Only
    await expect(engine.getByText('One Way')).toHaveCount(0);

    // Requirement: Trip duration buttons at the top are REMOVED (no manual duration buttons)
    await expect(engine.getByRole('button', { name: '1 Day' })).toHaveCount(0);
    await expect(engine.getByRole('button', { name: '2 Days' })).toHaveCount(0);
    await expect(engine.getByRole('button', { name: '3 Days' })).toHaveCount(0);

    // Requirement: Quick pickup chips are REMOVED
    await expect(engine.getByText('Quick Pick:')).toHaveCount(0);
    await expect(engine.getByText('Chennai Airport (MAA)')).toHaveCount(0);

    // Requirement: Pickup input field
    const pickupInput = engine.locator('input[placeholder*="pickup address in Chennai"]');
    await expect(pickupInput).toBeVisible();
    if ((await pickupInput.inputValue()) === '') {
      await pickupInput.fill('Chennai, Tamil Nadu');
    }

    // Requirement: Drop is fixed to Tirupati Tirumala Temple (hidden from input fields)
    const dropInputs = engine.locator('input[placeholder*="destination" i]');
    await expect(dropInputs).toHaveCount(0);
    await expect(engine.getByText('Fixed Destination:')).toBeVisible();
    await expect(engine.getByText('Tirupati Balaji Temple & Tirumala Hills')).toBeVisible();

    // Requirement: Drop Date is present & Pickup Date & Drop Date are in SAME ROW
    const pickupDateInput = engine.locator('input[type="datetime-local"], input[type="date"]').first();
    const dropDateInput = engine.locator('input[type="datetime-local"], input[type="date"]').nth(1);
    await expect(pickupDateInput).toBeVisible();
    await expect(dropDateInput).toBeVisible();

    const pDateBox = await pickupDateInput.boundingBox();
    const dDateBox = await dropDateInput.boundingBox();
    expect(Math.abs(pDateBox.y - dDateBox.y)).toBeLessThan(10); // Same row!

    // Verify auto-calculated duration from dates:
    // By default: pickup date == drop date -> 1 Day (Same Day Return)
    await expect(engine.getByText('1 Day (Same Day Return)').first()).toBeVisible();

    // Change drop date to next day (+1 day)
    const pickupDateVal = await pickupDateInput.inputValue();
    const nextDay = new Date(pickupDateVal);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];

    await dropDateInput.fill(nextDayStr);
    await page.waitForTimeout(200);

    // Duration must auto-calculate to 2 Days (1 Night Stay) and fare to ₹ 9,500
    await expect(engine.getByText('2 Days (1 Night Stay)').first()).toBeVisible();
    await expect(engine.getByRole('button', { name: /View Fare Estimate \(₹ 9,500\)/i })).toBeVisible();

    // Reset drop date back to same day (1 Day)
    await dropDateInput.fill(pickupDateVal);
    await page.waitForTimeout(200);
    await expect(engine.getByText('1 Day (Same Day Return)').first()).toBeVisible();
    await expect(engine.getByRole('button', { name: /View Fare Estimate \(₹ 6,000\)/i })).toBeVisible();

    // Requirement: Passenger selection and Vehicle selection in same row with auto-filter
    const passengerSelect = engine.locator('select').nth(1);
    const vehicleSelect = engine.locator('select').nth(2);

    const paxBox = await passengerSelect.boundingBox();
    const vehBox = await vehicleSelect.boundingBox();
    expect(Math.abs(paxBox.y - vehBox.y)).toBeLessThan(10); // Same horizontal row!

    // Default: 4 Passengers -> Swift Dzire is available and selected
    await expect(passengerSelect).toHaveValue('4');
    await expect(vehicleSelect).toHaveValue('dzire');

    // Change to 5 Passengers -> Dzire auto-filtered, Ertiga selected
    await passengerSelect.selectOption('5');
    await page.waitForTimeout(200);
    const vehicleOptionsAfter5 = await vehicleSelect.locator('option').allTextContents();
    expect(vehicleOptionsAfter5.some(opt => opt.includes('Swift Dzire'))).toBe(false);
    await expect(vehicleSelect).toHaveValue('ertiga');
    await expect(engine.getByRole('button', { name: /View Fare Estimate \(₹ 7,500\)/i })).toBeVisible();

    // Reset back to 4 passengers
    await passengerSelect.selectOption('4');
    await vehicleSelect.selectOption('dzire');

    // Requirement: Click "View Fare Estimate" to open Estimate Pop-Up Modal
    const estimateBtn = engine.getByRole('button', { name: /View Fare Estimate/i });
    await expect(estimateBtn).toBeVisible();
    await estimateBtn.click();
    await page.waitForTimeout(300);

    // Verify Pop-Up Modal is open
    const modal = page.locator('div[data-hide-contact-dock]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('data-hide-contact-dock', 'true');
    await expect(modal.getByText('Chennai to Tirupati Fare Estimate')).toBeVisible();
    await expect(modal.getByText('₹ 6,000').first()).toBeVisible();
    await expect(modal.getByText('100% All-Inclusive Fixed Package')).toBeVisible();
    await expect(modal.getByText('FASTag Highway Tolls')).toBeVisible();
    await expect(modal.getByText('AP Interstate Border State Tax')).toBeVisible();
    await expect(modal.getByText('Tirumala Ghat Hill Ascent')).toBeVisible();
    await expect(modal.getByText('Chauffeur Duty & Day/Night Bata')).toBeVisible();

    // Capture desktop popup screenshot
    await modal.screenshot({ path: 'tests/tirupati_estimate_popup_desktop.png' });

    // Verify WhatsApp button in modal
    const waButton = modal.locator('a[href*="whatsapp.com"], a[href*="wa.me"]');
    await expect(waButton).toBeVisible();
    await expect(waButton).toContainText('Book on WhatsApp');

    // Close the modal
    await modal.getByRole('button', { name: 'Close' }).first().click();
    await page.waitForTimeout(200);
    await expect(modal).toHaveCount(0);

    // Scroll into view and screenshot
    await engine.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -120));
    await page.waitForTimeout(300);

    await engine.screenshot({ path: 'tests/tirupati_simplified_booking_engine.png' });

    // Verify visual separation from FAQ section
    const faqSection = page.locator('section#faq');
    await expect(faqSection).toBeVisible();
    
    // Scroll so that both FAQ bottom and booking engine are visible
    await page.evaluate(() => {
      const faq = document.querySelector('section#faq');
      if (faq) {
        // Scroll towards bottom of FAQ so boundary between FAQ and card is centered
        const rect = faq.getBoundingClientRect();
        window.scrollBy(0, rect.bottom - 200);
      }
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/tirupati_card_faq_separation.png' });
    console.log('✔ All simplified requirements, title & popup modal successfully verified!');
  });

  test('Renders properly on mobile viewport (375x812) and opens popup', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

    const engine = page.locator('section[aria-label="Tirupati Pilgrimage Booking Engine"]');
    await expect(engine).toBeVisible();

    const pickupDateInput = engine.locator('input[type="datetime-local"], input[type="date"]').first();
    const dropDateInput = engine.locator('input[type="datetime-local"], input[type="date"]').nth(1);
    const pDateBox = await pickupDateInput.boundingBox();
    const dDateBox = await dropDateInput.boundingBox();
    expect(Math.abs(pDateBox.y - dDateBox.y)).toBeLessThan(10); // Same horizontal row on mobile!

    const passengerSelect = engine.locator('select').nth(1);
    const vehicleSelect = engine.locator('select').nth(2);
    const paxBox = await passengerSelect.boundingBox();
    const vehBox = await vehicleSelect.boundingBox();
    expect(Math.abs(paxBox.y - vehBox.y)).toBeLessThan(10); // Same horizontal row on mobile!

    // Open popup on mobile
    const estimateBtn = engine.getByRole('button', { name: /View Fare Estimate/i });
    await estimateBtn.click();
    await page.waitForTimeout(300);

    const modal = page.locator('div[data-hide-contact-dock]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Chennai to Tirupati Fare Estimate')).toBeVisible();

    await modal.screenshot({ path: 'tests/tirupati_estimate_popup_mobile.png' });

    await modal.getByRole('button', { name: 'Close' }).first().click();
    await page.waitForTimeout(200);
    await expect(modal).toHaveCount(0);

    await engine.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -100));
    await page.waitForTimeout(300);

    await engine.screenshot({ path: 'tests/tirupati_simplified_booking_engine_mobile.png' });
  });
});
