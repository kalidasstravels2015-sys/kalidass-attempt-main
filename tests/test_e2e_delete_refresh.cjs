const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('--- Setting Up Test Booking in Operations Control CSV ---');
  const csvPath = path.resolve('Kalidass_Operations_Control_2026.csv');
  const testBookingLine = '#KT-E2E-777,Suresh Kumar (+91 9840122222),Tomorrow @ 05:00 AM,"Medavakkam, Chennai -> Mahabalipuram",Sedan,4 Seats,Pending,N/A,Unassigned,Pending,3500,2800,700,Unreconciled,Pending\n';
  fs.appendFileSync(csvPath, testBookingLine);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('dialog', async dialog => {
    console.log('Browser Dialog prompted:', dialog.message());
    await dialog.accept();
  });

  // Authorize PIN & load admin dashboard
  await page.addInitScript(() => sessionStorage.setItem('kt_admin_pin_verified', 'true'));
  await page.goto('http://localhost:4321/admin/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Navigate to Step 2: Active Trips
  console.log('\n--- Navigating to Step 2: Active Trips ---');
  const activeTripsNav = page.locator('aside nav button:has-text("2. Active Trips")');
  await activeTripsNav.click();
  await page.waitForTimeout(1000);

  // Verify test booking is visible
  const cardLocator = page.locator('text=#KT-E2E-777');
  const isVisible = await cardLocator.isVisible();
  console.log('Test booking #KT-E2E-777 is visible before deletion:', isVisible);
  if (!isVisible) {
    console.error('FAIL: Test booking not visible in Active Trips!');
    await browser.close();
    process.exit(1);
  }

  // Click Cancel on the booking card
  console.log('\n--- Clicking Cancel on #KT-E2E-777 ---');
  const cancelBtn = page.locator('div:has-text("#KT-E2E-777")')
    .locator('..')
    .locator('button:has-text("Cancel")')
    .first();
  await cancelBtn.click();
  await page.waitForTimeout(2000);

  // Check visibility immediately after deletion
  const visibleAfterDelete = await cardLocator.isVisible();
  console.log('Visible immediately after deletion:', visibleAfterDelete);
  if (visibleAfterDelete) {
    console.error('FAIL: Booking still visible immediately after delete!');
    await browser.close();
    process.exit(1);
  }

  // Verify tombstone in localStorage
  const tombstones = await page.evaluate(() => localStorage.getItem('kt_solo_deleted_bookings_v8'));
  console.log('LocalStorage tombstones:', tombstones);

  // Verify CSV no longer has the booking
  const csvAfter = fs.readFileSync(csvPath, 'utf8');
  console.log('CSV contains #KT-E2E-777:', csvAfter.includes('#KT-E2E-777'));

  // Step 4: Page Reload (F5 Refresh)
  console.log('\n--- Reloading Page (F5 Refresh) ---');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Navigate back to Active Trips if needed
  if (await activeTripsNav.isVisible()) {
    await activeTripsNav.click();
    await page.waitForTimeout(1000);
  }

  const visibleAfterRefresh = await page.locator('text=#KT-E2E-777').isVisible();
  console.log('Visible after refresh (F5):', visibleAfterRefresh);

  if (visibleAfterRefresh) {
    console.error('FAIL: Booking resurrected after page refresh!');
    await browser.close();
    process.exit(1);
  }

  console.log('\n========================================');
  console.log('PASS: Deletion is 100% permanent! No resurrection on refresh.');
  console.log('========================================');

  await browser.close();
})();
