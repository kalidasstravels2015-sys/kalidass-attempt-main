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
    const taxiPickup = page.locator('#outstation-estimator #pickup-input, #outstation-estimator input[placeholder*="pickup" i]').first();
    const taxiDrop = page.locator('#outstation-estimator #drop-input, #outstation-estimator input[placeholder*="drop" i]').first();
    await taxiPickup.fill('Chennai');
    await taxiDrop.fill('Pondicherry');
    await page.keyboard.press('Escape');

    const taxiCalcBtn = page.locator('#outstation-estimator button:has-text("View Instant Fare"), #outstation-estimator button:has-text("Calculate Cost"), #outstation-estimator button:has-text("செலவைக் கணக்கிடுங்கள்")').first();
    await taxiCalcBtn.click({ force: true });
    await page.waitForTimeout(600);

    const taxiEstimate = page.locator('#outstation-estimator').locator('text=Total Fare').first();
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
    expect(resultText).toContain('1,900'); // 1,400 bata + 300 food + 200 SETC bus
    console.log('✔ Acting Driver One-Way calculation successful: ₹1,900 for Pallavaram to Tirupati.');

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
    expect(roundResultText).toMatch(/(431|462) km one-way/);
    expect(roundResultText).toContain('3,700'); // 2 days min enforced for Pallavaram to Madurai (>400 km)

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

    // Verify result appears (505 km -> 2.0d bata ₹2,800 + ₹450 food + ₹550 SETC bus = ₹3,800)
    await expect(page.locator('text=Return Travel (Est)').first()).toBeVisible();
    await expect(page.locator('text=3,800').first()).toBeVisible();
    console.log('✔ Vehicle Relocation calculation completed successfully (₹3,800 for Coimbatore to Chennai).');

    // 4. Verify ZERO console errors
    console.log('Console errors encountered:', consoleErrors);
    expect(consoleErrors).toEqual([]);
    console.log('✔ Zero console errors on /calculator/ page.');
  });

  test('Verify /services/acting-drivers/ page calculator interactivity across multiple routes', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto('/services/acting-drivers/', { waitUntil: 'networkidle' });

    const pickupInput = page.locator('#acting-driver-pickup-input');
    const dropInput = page.locator('#acting-driver-drop-input');
    const calcBtn = page.locator('#acting-driver-calc-btn');
    const resultBox = page.locator('#acting-driver-result-card');

    await expect(pickupInput).toBeVisible();
    await expect(dropInput).toBeVisible();

    const routesToTest = [
      { pickup: 'Chennai', drop: 'Pondicherry', expectedTotal: '1,900' },
      { pickup: 'Chennai', drop: 'Bangalore', expectedTotal: '2,820' },
      { pickup: 'Chennai', drop: 'Madurai', expectedTotal: '3,750' },
      { pickup: 'Chennai', drop: 'Kanyakumari', expectedTotal: '4,850' },
      { pickup: 'Coimbatore', drop: 'Tirupati', expectedTotal: '3,790' },
    ];

    for (const r of routesToTest) {
      await pickupInput.fill(r.pickup);
      await dropInput.fill(r.drop);
      await page.keyboard.press('Escape');
      await calcBtn.click({ force: true });
      await page.waitForTimeout(400);

      await expect(resultBox).toBeVisible();
      const resultText = await resultBox.innerText();
      expect(resultText).toContain(r.expectedTotal);
      console.log(`✔ Verified ${r.pickup} -> ${r.drop}: ₹${r.expectedTotal}`);
    }

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
    await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity/brain/fef1a749-a8b2-4c41-a055-38e6d2294c8a/acting_driver_calc_mobile.png' });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('#trip-estimator').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity/brain/fef1a749-a8b2-4c41-a055-38e6d2294c8a/acting_driver_calc_desktop.png' });
    console.log('✔ Screenshots captured.');
  });
});
