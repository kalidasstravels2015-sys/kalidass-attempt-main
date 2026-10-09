import { test, expect } from '@playwright/test';

test.describe('Admin Operations Command Tower Suite', () => {
  test('should load /admin and display command tower telemetry & tabs', async ({ page }) => {
    await page.goto('/admin/');

    // Expect header telemetry
    await expect(page.locator('text=KALIDASS COMMAND TOWER')).toBeVisible();
    await expect(page.locator('text=1. DISPATCH KANBAN')).toBeVisible();
    await expect(page.locator('text=2. LEADS FUNNEL')).toBeVisible();
    await expect(page.locator('text=3. DIGITAL DUTY SLIPS')).toBeVisible();
    await expect(page.locator('text=4. DRIVER KHATA')).toBeVisible();
    await expect(page.locator('text=5. FLEET ROSTER')).toBeVisible();
    await expect(page.locator('text=6. TIRUPATI DESK')).toBeVisible();

    // Verify Kanban columns are visible
    await expect(page.locator('text=1. NEW / UNASSIGNED')).toBeVisible();
    await expect(page.locator('text=2. DRIVER ALLOCATED')).toBeVisible();
    await expect(page.locator('text=3. ON HIGHWAY / ROLLING')).toBeVisible();
    await expect(page.locator('text=4. DUTY SLIP PENDING')).toBeVisible();
    await expect(page.locator('text=5. SETTLED & CLOSED')).toBeVisible();
  });

  test('should switch between operational desks smoothly', async ({ page }) => {
    await page.goto('/admin/');

    // Click 2. Leads Funnel
    await page.click('button:has-text("2. LEADS FUNNEL")');
    await expect(page.locator('text=Website Calculator Leads Funnel')).toBeVisible();

    // Click 3. Digital Duty Slips
    await page.click('button:has-text("3. DIGITAL DUTY SLIPS")');
    await expect(page.locator('text=Digital Duty Slip (Trip Sheet) Studio')).toBeVisible();

    // Click 4. Driver Khata
    await page.click('button:has-text("4. DRIVER KHATA")');
    await expect(page.locator('text=Driver Khata Reconciler')).toBeVisible();
    await expect(page.locator('text=NET CLOSING POSITION:')).toBeVisible();

    // Click 5. Fleet Roster
    await page.click('button:has-text("5. FLEET ROSTER")');
    await expect(page.locator('text=Fleet & Chauffeur Roster')).toBeVisible();
    await expect(page.locator('text=Murugan')).toBeVisible();

    // Click 6. Tirupati Desk
    await page.click('button:has-text("6. TIRUPATI DESK")');
    await expect(page.locator('text=Tirupati & Pilgrimage Logistics Console')).toBeVisible();
  });

  test('should open New Booking modal and Duty Slip modal properly', async ({ page }) => {
    await page.goto('/admin/');

    // Open New Booking Modal
    await page.click('button:has-text("NEW BOOKING")');
    await expect(page.locator('text=Manual Booking Entry')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Manual Booking Entry')).not.toBeVisible();

    // Go to Duty Slips and open standalone slip modal
    await page.click('button:has-text("3. DIGITAL DUTY SLIPS")');
    await page.click('button:has-text("CREATE STANDALONE DUTY SLIP")');
    await expect(page.locator('text=Generate Digital Trip Duty Slip')).toBeVisible();
    await expect(page.locator('text=BALANCE TO COLLECT:')).toBeVisible();
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Generate Digital Trip Duty Slip')).not.toBeVisible();
  });

  test('should open 10-Second Quick Call Logger and log inbound phone inquiry', async ({ page }) => {
    await page.goto('/admin/');

    // Click "+ LOG CALL" in header
    await page.click('button:has-text("LOG CALL")');
    await expect(page.locator('text=10-Sec Quick Call Logger')).toBeVisible();

    // Fill caller phone & route
    await page.fill('input[type="tel"]', '9840999888');
    await page.fill('input[placeholder*="Mr. Senthil"]', 'Testing Lead Owner');
    await page.fill('input[placeholder*="Chennai ➔ Tirupati"]', 'Chennai to Pondicherry Drop Taxi');

    // Submit
    await page.click('button:has-text("Log to Leads Funnel")');
    await expect(page.locator('text=10-Sec Quick Call Logger')).not.toBeVisible();

    // Verify lead is in the table
    await expect(page.locator('text=9840999888').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Chennai to Pondicherry Drop Taxi').first()).toBeVisible();
  });

  test('should support selecting packages from dropdown with auto fare calibration', async ({ page }) => {
    await page.goto('/admin/');

    // Click "+ LOG CALL" in header
    await page.click('button:has-text("LOG CALL")');
    await expect(page.locator('text=10-Sec Quick Call Logger')).toBeVisible();

    // Verify all requested packages exist in the dropdown
    const pkgSelect = page.locator('select:has-text("Chennai to Tirupati")');
    await expect(pkgSelect).toBeVisible();
    await expect(pkgSelect.locator('option[value="chennai-tirupati"]')).toHaveText(/Chennai to Tirupati/i);
    await expect(pkgSelect.locator('option[value="chennai-thiruvannamalai"]')).toHaveText(/Chennai to Thiruvannamalai/i);
    await expect(pkgSelect.locator('option[value="chennai-pondicherry"]')).toHaveText(/Chennai to Pondicherry/i);
    await expect(pkgSelect.locator('option[value="chennai-kanchipuram"]')).toHaveText(/Chennai to Kanchipuram/i);
    await expect(pkgSelect.locator('option[value="chennai-rameshwaram"]')).toHaveText(/Chennai to Rameshwaram/i);

    // Select Thiruvannamalai package and check route & fare
    await pkgSelect.selectOption('chennai-thiruvannamalai');
    await expect(page.locator('input[placeholder*="Chennai ➔ Tirupati"]')).toHaveValue('Chennai ➔ Thiruvannamalai Girivalam');
    await expect(page.locator('input[type="number"]')).toHaveValue('6500');

    // Switch vehicle to Ertiga and verify dynamic rate calibration
    await page.locator('select:has-text("Sedan (Dzire / Etios)")').selectOption('Ertiga (6 Pax)');
    await expect(page.locator('input[type="number"]')).toHaveValue('7900');

    // Switch package to Rameshwaram
    await pkgSelect.selectOption('chennai-rameshwaram');
    await expect(page.locator('input[placeholder*="Chennai ➔ Tirupati"]')).toHaveValue('Chennai ➔ Rameshwaram 2-Days Tour');
    await expect(page.locator('input[type="number"]')).toHaveValue('18500');

    // Log the call
    await page.fill('input[type="tel"]', '9840777111');
    await page.fill('input[placeholder*="Mr. Senthil"]', 'Pilgrim Caller');
    await page.click('button:has-text("Log to Leads Funnel")');

    await expect(page.locator('text=10-Sec Quick Call Logger')).not.toBeVisible();
    await expect(page.locator('text=9840777111').first()).toBeVisible({ timeout: 5000 });
  });

  test('should capture website click-to-call beacon without staff manual entry', async ({ page }) => {
    // Navigate to tariff page
    await page.goto('/tariff/');

    // Prevent headless browser from halting on tel: external protocol
    await page.evaluate(() => {
      document.querySelectorAll('a[href^="tel:"]').forEach(a => {
        a.addEventListener('click', e => e.preventDefault());
      });
    });

    // Click phone link visible on this viewport (desktop navbar or mobile sticky bar)
    const phoneLink = page.locator('a[href^="tel:"]:visible').first();
    await expect(phoneLink).toBeAttached();
    await phoneLink.click();

    // Allow beacon to reach backend
    await page.waitForTimeout(1000);

    // Open admin desk to verify automated lead capture
    await page.goto('/admin/');
    await expect(page.locator('text=KALIDASS COMMAND TOWER')).toBeVisible();
    await page.click('button:has-text("2. LEADS FUNNEL")');
    await expect(page.locator('text=Website Calculator Leads Funnel')).toBeVisible();
    await expect(page.locator('text=Call Clicked').first()).toBeVisible({ timeout: 5000 });
  });

  test('should redirect legacy /ops to /admin/', async ({ page }) => {
    await page.goto('/ops/');
    await expect(page).toHaveURL(/\/admin\/?/);
    await expect(page.locator('text=KALIDASS COMMAND TOWER')).toBeVisible();
  });
});

