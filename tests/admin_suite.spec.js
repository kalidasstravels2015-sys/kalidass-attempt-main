import { test, expect } from '@playwright/test';

// Helper to pre-authorize session PIN for SoloAdminDashboard
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('kt_admin_pin_verified', 'true');
  });
});

async function clickSidebarNav(page, text) {
  const menuBtn = page.locator('button[title="Open Navigation Menu"]');
  if (await menuBtn.isVisible()) {
    await menuBtn.click();
  }
  await page.click(`button:has-text("${text}")`);
}

test.describe('Admin Operations Command Tower Suite', () => {
  test('should load /admin and display command tower navigation & views', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('text=Kalidass Travels').first()).toBeVisible();

    const menuBtn = page.locator('button[title="Open Navigation Menu"]');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
    }

    // Expect sidebar navigation items
    await expect(page.locator('text=1. New Enquiries').first()).toBeVisible();
    await expect(page.locator('text=2. Active Trips').first()).toBeVisible();
    await expect(page.locator('text=3. Completed Trips').first()).toBeVisible();
    await expect(page.locator('text=4. Driver Roster').first()).toBeVisible();
    await expect(page.locator('text=5. Rate Calculator').first()).toBeVisible();
    await expect(page.locator('text=6. Website Calc Radar').first()).toBeVisible();
  });

  test('should switch between operational views smoothly', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('text=Kalidass Travels').first()).toBeVisible();

    // Click 6. Website Calc Radar
    await clickSidebarNav(page, "6. Website Calc Radar");
    await expect(page.locator('text=Website Fare Calculator Radar')).toBeVisible();
    await expect(page.locator('text=Live Estimates')).toBeVisible();

    // Click 4. Driver Roster
    await clickSidebarNav(page, "4. Driver Roster");
    await expect(page.locator('text=/Chauffeurs & Commercial Fleet Roster/')).toBeVisible();

    // Click 5. Rate Calculator
    await clickSidebarNav(page, "5. Rate Calculator");
    await expect(page.locator('text=/Operator Rate Calculator|Booking Workspace/i').first()).toBeVisible();

    // Back to 1. New Enquiries
    await clickSidebarNav(page, "1. New Enquiries");
    await expect(page.locator('text=/Customer Enquiries|Step 1: Enquiries/i').first()).toBeVisible();
  });

  test('should open Rate Calculator modal and Duty Slip modal properly', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('text=Kalidass Travels').first()).toBeVisible();

    // Open Phone Quote Calculator via top header button
    await page.click('button[title="Quick Rate Calculator"]');
    await expect(page.locator('text=/Operator Rate Calculator|Booking Workspace/i').first()).toBeVisible();
    await page.locator('button[aria-label="Close Calculator"]').first().click();

    // Open Paste WA modal
    await page.click('button[title*="Paste incoming WhatsApp"]');
    await expect(page.locator('text=/WhatsApp Enquiry & Booking Copilot/i').first()).toBeVisible();
    await page.locator('button[title="Close Parser"]').first().click();
  });

  test('should stream website calculation directly into Website Calc Radar in real time', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('text=Kalidass Travels').first()).toBeVisible();

    // Go to Radar tab
    await clickSidebarNav(page, "6. Website Calc Radar");
    await expect(page.locator('text=Website Fare Calculator Radar')).toBeVisible();

    // Simulate an instant calculation event dispatched by any website engine in the browser
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('kt_new_calculation', {
        detail: {
          quoteId: '#KT-TEST-99',
          timestamp: 'Just now',
          sourcePage: '/services/outstation-cabs/',
          calculatorEngine: 'Outstation Cab Estimator',
          tripType: 'Round Trip',
          pickup: 'Chennai Central',
          drop: 'Puducherry Beach',
          vehicle: 'Swift Dzire',
          distanceKm: 320,
          estimatedFare: 4200,
          status: 'Rate Locked'
        }
      }));
    });

    // Verify it instantly appears on the radar
    await expect(page.locator('text=#KT-TEST-99').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Chennai Central ➔ Puducherry Beach').first()).toBeVisible();
    await expect(page.locator('text=Rs.4,200').first()).toBeVisible();
  });

  test('should redirect legacy /ops to /admin/', async ({ page }) => {
    await page.goto('/ops/');
    await expect(page).toHaveURL(/\/admin\/?/);
  });
});
