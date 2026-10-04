import { test, expect } from '@playwright/test';

test.describe('Travel Calculators Comprehensive Verification', () => {

  test('Verify /calculator/ page - all 3 calculators and zero console errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto('/calculator/', { waitUntil: 'networkidle' });

    // 1. Taxi Fare Estimator (QuotationEngine)
    console.log('--- 1. Testing Taxi Fare Estimator on /calculator/ ---');
    const taxiPickup = page.locator('#pickup-input, input[placeholder*="pickup" i]').first();
    const taxiDrop = page.locator('#drop-input, input[placeholder*="drop" i]').first();
    await taxiPickup.fill('Chennai');
    await taxiDrop.fill('Pondicherry');

    const taxiCalcBtn = page.locator('button:has-text("Calculate Cost"), button:has-text("செலவைக் கணக்கிடுங்கள்")').first();
    await taxiCalcBtn.click();
    await page.waitForTimeout(600);

    const taxiEstimate = page.locator('text=Transparent Estimate').first();
    await expect(taxiEstimate).toBeVisible();
    console.log('✔ Taxi fare estimate successfully displayed.');

    // 2. Acting Driver Estimator (DriverFeeEstimator.jsx)
    console.log('--- 2. Testing Acting Driver Estimator on /calculator/ ---');
    const driverPickup = page.locator('#acting-driver-pickup-input');
    const driverDrop = page.locator('#acting-driver-drop-input');
    const driverCalcBtn = page.locator('#acting-driver-calc-btn');

    await expect(driverPickup).toBeVisible();
    await expect(driverDrop).toBeVisible();
    await expect(driverCalcBtn).toBeVisible();

    // A. One-Way Drop calculation
    await driverPickup.fill('Pallavaram, Chennai');
    await driverDrop.fill('Tirupati');
    await page.keyboard.press('Escape');
    await driverCalcBtn.click({ force: true });
    await page.waitForTimeout(600);

    const resultCard = page.locator('#acting-driver-result-card');
    await expect(resultCard).toBeVisible();
    const resultText = await resultCard.innerText();
    expect(resultText).toContain('1,562'); // 1,100 bata + 300 food + 162 bus
    console.log('✔ Acting Driver One-Way calculation successful: ₹1,562 for Pallavaram to Tirupati.');

    // B. Round Trip calculation
    const roundTab = page.locator('#acting-driver-tab-round');
    await roundTab.click();
    await page.waitForTimeout(300);

    await driverPickup.fill('Pallavaram, Chennai');
    await driverDrop.fill('Madurai');
    await page.keyboard.press('Escape');
    await driverCalcBtn.click({ force: true });
    await page.waitForTimeout(600);

    await expect(resultCard).toBeVisible();
    const roundResultText = await resultCard.innerText();
    console.log('✔ Acting Driver Round Trip calculation successful.');
    expect(roundResultText).toContain('Driver Bata');
    expect(roundResultText).toContain('Food Allowance');

    // 3. Vehicle Relocation Calculator
    console.log('--- 3. Testing Vehicle Relocation Calculator on /calculator/ ---');
    const vrPickup = page.locator('#vr-pickup-input');
    const vrDrop = page.locator('#vr-drop-input');
    const vrCalcBtn = page.locator('#vr-calc-btn');

    await vrPickup.fill('Coimbatore');
    await vrDrop.fill('Chennai');
    await page.keyboard.press('Escape');
    await vrCalcBtn.click({ force: true });
    await page.waitForTimeout(600);

    // Verify result appears
    await expect(page.locator('text=Return Travel (Est)').first()).toBeVisible();
    console.log('✔ Vehicle Relocation calculation completed successfully.');

    // 4. Verify ZERO console errors
    console.log('Console errors encountered:', consoleErrors);
    expect(consoleErrors).toEqual([]);
    console.log('✔ Zero console errors on /calculator/ page.');
  });

  test('Verify /services/acting-drivers/ page calculator interactivity', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto('/services/acting-drivers/', { waitUntil: 'networkidle' });

    const pickupInput = page.locator('#acting-driver-pickup-input');
    const dropInput = page.locator('#acting-driver-drop-input');
    const calcBtn = page.locator('#acting-driver-calc-btn');

    await expect(pickupInput).toBeVisible();
    await expect(dropInput).toBeVisible();

    await pickupInput.fill('Chennai');
    await dropInput.fill('Pondicherry');
    await page.keyboard.press('Escape');
    await calcBtn.click({ force: true });
    await page.waitForTimeout(600);

    const resultBox = page.locator('#acting-driver-result-card');
    await expect(resultBox).toBeVisible();
    const resultText = await resultBox.innerText();
    expect(resultText).toContain('1,600');
    console.log('✔ /services/acting-drivers/ calculator executed successfully (₹1,600).');

    // Verify vehicle dropdown does NOT contain prices
    const vehicleOptions = await page.locator('#trip-estimator select option').allInnerTexts();
    console.log('Vehicle options in calculator:', vehicleOptions);
    for (const opt of vehicleOptions) {
      expect(opt).not.toContain('₹');
      expect(opt).not.toContain('/day');
    }
    console.log('✔ Verified dropdown car names have NO price strings.');

    expect(consoleErrors).toEqual([]);
    console.log('✔ Zero console errors on /services/acting-drivers/ page.');
  });

  test('Verify vehicle dropdown in DriverFeeEstimator has no price and 3 points are removed before calculator', async ({ page }) => {
    // 1. Check /services/acting-drivers/
    await page.goto('/services/acting-drivers/', { waitUntil: 'networkidle' });

    // Verify 3 points are NOT present
    await expect(page.locator('text=Vehicle-Specific Daily Bata')).not.toBeVisible();
    await expect(page.locator('text=Accommodation Savings')).not.toBeVisible();
    await expect(page.locator('text=One-Way Drop Policy')).not.toBeVisible();
    console.log('✔ 3 points (01, 02, 03) confirmed absent before calculator.');

    // Verify options in vehicle dropdown
    const selectEl = page.locator('#trip-estimator select').first();
    await expect(selectEl).toBeVisible();
    const options = await selectEl.locator('option').allInnerTexts();
    console.log('Acting drivers page vehicle options:', options);
    expect(options).toEqual([
      'Hatchback & Sedan',
      'Compact SUV / MPV',
      'Premium SUV / MUV',
      'Luxury European'
    ]);
    for (const opt of options) {
      expect(opt).not.toContain('₹');
      expect(opt).not.toContain('/day');
    }
    console.log('✔ Dropdown options clean of pricing.');

    // Capture screenshot of calculator section
    await page.setViewportSize({ width: 375, height: 812 });
    await page.locator('#trip-estimator').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/d009ebb2-bab8-4f29-9d14-26c200720c6a/acting_driver_calc_mobile.png' });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('#trip-estimator').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/d009ebb2-bab8-4f29-9d14-26c200720c6a/acting_driver_calc_desktop.png' });
    console.log('✔ Screenshots captured.');
  });
});
