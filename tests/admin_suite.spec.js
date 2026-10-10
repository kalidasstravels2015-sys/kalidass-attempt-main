import { test, expect } from '@playwright/test';

test.describe('Admin Operations Command Tower Suite', () => {
  test('should load /admin and display command tower telemetry & tabs', async ({ page }) => {
    await page.goto('/admin/');

    // Expect header telemetry
    await expect(page.locator('text=KALIDASS COMMAND TOWER').first()).toBeVisible();
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

    // Click "+ LOG LEAD" in header
    await page.click('button:has-text("LOG LEAD"), button:has-text("LOG CALL")');
    await expect(page.locator('text=/10-Sec Quick (Lead|Call) Logger/')).toBeVisible();

    // Fill caller phone & route
    await page.fill('input[type="tel"]', '9840999888');
    await page.fill('input[placeholder*="Mr. Senthil"]', 'Testing Lead Owner');
    await page.fill('input[placeholder*="Chennai ➔ Tirupati"]', 'Chennai to Pondicherry Drop Taxi');

    // Submit
    await page.click('button:has-text("Log to Leads Funnel")');
    await expect(page.locator('text=/10-Sec Quick (Lead|Call) Logger/')).not.toBeVisible();

    // Verify lead is in the table
    await expect(page.locator('text=9840999888').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Chennai to Pondicherry Drop Taxi').first()).toBeVisible();
  });

  test('should support selecting packages from dropdown with auto fare calibration', async ({ page }) => {
    await page.goto('/admin/');

    // Click "+ LOG LEAD" in header
    await page.click('button:has-text("LOG LEAD"), button:has-text("LOG CALL")');
    await expect(page.locator('text=/10-Sec Quick (Lead|Call) Logger/')).toBeVisible();

    // Verify only the 3 requested packages exist in the dropdown
    const pkgSelect = page.locator('select:has-text("Chennai to Tirupati")');
    await expect(pkgSelect).toBeVisible();
    await expect(pkgSelect.locator('option[value="chennai-tirupati"]')).toHaveText(/Chennai to Tirupati/i);
    await expect(pkgSelect.locator('option[value="chennai-madurai"]')).toHaveText(/Chennai to Madurai/i);
    await expect(pkgSelect.locator('option[value="chennai-pondicherry"]')).toHaveText(/Chennai to Pondicherry/i);

    // Select Madurai package and check route & fare
    await pkgSelect.selectOption('chennai-madurai');
    await expect(page.locator('input[placeholder*="Chennai ➔ Tirupati"]')).toHaveValue('Chennai ➔ Madurai Round Trip');
    await expect(page.locator('input[type="number"]')).toHaveValue('13500');

    // Switch vehicle to Ertiga and verify dynamic rate calibration
    await page.locator('select:has-text("Sedan (Dzire / Etios)")').selectOption('Ertiga (6 Pax)');
    await expect(page.locator('input[type="number"]')).toHaveValue('16500');

    // Switch package to Pondicherry
    await pkgSelect.selectOption('chennai-pondicherry');
    await expect(page.locator('input[placeholder*="Chennai ➔ Tirupati"]')).toHaveValue('Chennai ➔ Pondicherry Round Trip');
    await expect(page.locator('input[type="number"]')).toHaveValue('5500');

    // Log the call
    await page.fill('input[type="tel"]', '9840777111');
    await page.fill('input[placeholder*="Mr. Senthil"]', 'Pilgrim Caller');
    await page.click('button:has-text("Log to Leads Funnel")');

    await expect(page.locator('text=/10-Sec Quick (Lead|Call) Logger/')).not.toBeVisible();
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
    await expect(page.locator('text=KALIDASS COMMAND TOWER').first()).toBeVisible();
    await page.click('button:has-text("2. LEADS FUNNEL")');
    await expect(page.locator('text=Website Calculator Leads Funnel')).toBeVisible();
    await expect(page.locator('text=Call Clicked').first()).toBeVisible({ timeout: 5000 });
  });

  test('should redirect legacy /ops to /admin/', async ({ page }) => {
    await page.goto('/ops/');
    await expect(page).toHaveURL(/\/admin\/?/);
    await expect(page.locator('text=KALIDASS COMMAND TOWER').first()).toBeVisible();
  });

  test('should successfully log lead even when server returns 405 Method Not Allowed (offline/static resilience)', async ({ page }) => {
    // Intercept /api/record-calculation to simulate Cloudflare static 405 Method Not Allowed
    await page.route('**/api/record-calculation', route => {
      route.fulfill({
        status: 405,
        contentType: 'text/html',
        body: '<html><body>405 Method Not Allowed</body></html>'
      });
    });

    await page.goto('/admin/');

    // Click "+ LOG LEAD" or "+ LOG CALL"
    await page.click('button:has-text("LOG LEAD"), button:has-text("LOG CALL")');
    await expect(page.locator('text=/10-Sec Quick (Lead|Call) Logger/')).toBeVisible();

    // Fill customer details matching user scenario
    await page.fill('input[type="tel"]', '8668070094');
    await page.fill('input[placeholder*="Mr. Senthil"]', 'Parthiban');
    await page.fill('input[placeholder*="Chennai ➔ Tirupati"]', 'Chennai to Tirupati Round Trip');

    // Click "Log to Leads Funnel"
    await page.click('button:has-text("Log to Leads Funnel")');

    // Modal MUST immediately close despite 405 error
    await expect(page.locator('text=/10-Sec Quick (Lead|Call) Logger/')).not.toBeVisible();

    // Lead must immediately show up in Leads Funnel table
    await expect(page.locator('text=8668070094').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Parthiban').first()).toBeVisible();

    // Toast feedback should appear
    await expect(page.locator('text=/Lead logged/i')).toBeVisible();
  });
});


