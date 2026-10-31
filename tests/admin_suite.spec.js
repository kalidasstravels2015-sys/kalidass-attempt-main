import { test, expect } from '@playwright/test';

// Helper to unlock PIN if gate is shown
async function unlockAdminGate(page) {
  const pinInput = page.locator('input[placeholder*="PIN"], input[type="password"]').first();
  if (await pinInput.isVisible({ timeout: 1500 }).catch(() => false)) {
    await pinInput.fill('2015');
    await page.waitForTimeout(500);
  }
}

// Helper to click sidebar nav items
async function clickSidebarNav(page, text) {
  const menuBtn = page.locator('button[title="Open Navigation Menu"]');
  if (await menuBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await menuBtn.click();
    await page.waitForTimeout(200);
  }
  await page.locator(`aside button:has-text("${text}")`).first().click();
}

test.describe('Admin Operations Command Tower Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Preset session storage to bypass PIN gate in test runner
    await page.addInitScript(() => {
      sessionStorage.setItem('kt_admin_pin_verified', 'true');
    });
  });

  test('should load /admin and display single-screen dispatch desk as primary view', async ({ page }) => {
    await page.goto('/admin/');
    await unlockAdminGate(page);

    await expect(page.locator('text=Kalidass Travels').first()).toBeVisible();

    // Verify Dispatch Desk header and 3 operational queues
    await expect(page.locator('text=Dispatch Desk').first()).toBeVisible();
    await expect(page.locator('button:has-text("Needs Driver")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Scheduled")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Completed")').first()).toBeVisible();

    // Verify primary sidebar navigation
    const menuBtn = page.locator('button[title="Open Navigation Menu"]');
    if (await menuBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await menuBtn.click();
    }
    await expect(page.locator('button:has-text("Dispatch Desk")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Inbound Enquiries")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Dispatch Calendar")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Master Tariffs")').first()).toBeVisible();
  });

  test('should switch between operational views smoothly', async ({ page }) => {
    await page.goto('/admin/');
    await unlockAdminGate(page);
    await expect(page.locator('text=Kalidass Travels').first()).toBeVisible();

    // Click Dispatch Calendar in sidebar
    await clickSidebarNav(page, "Dispatch Calendar");
    await expect(page.locator('text=Operations & Trip Monitoring Calendar')).toBeVisible();

    // Click Master Tariffs
    await clickSidebarNav(page, "Master Tariffs");
    await expect(page.locator('text=Single Master Tariff').first()).toBeVisible();

    // Back to Dispatch Desk
    await clickSidebarNav(page, "Dispatch Desk");
    await expect(page.locator('text=Dispatch Desk').first()).toBeVisible();
  });

  test('should open Rate Calculator modal and Duty Slip modal properly', async ({ page }) => {
    await page.goto('/admin/');
    await unlockAdminGate(page);
    await expect(page.locator('text=Kalidass Travels').first()).toBeVisible();

    // Open Phone Quote Calculator via top header button
    await page.click('button[title="Quick Rate Calculator"]');
    await expect(page.locator('text=/Operator Rate Calculator|Booking Workspace/i').first()).toBeVisible();
    await page.locator('button[aria-label="Close Calculator"]').first().click();
    await page.waitForTimeout(300);

    // Open Paste WA modal
    await page.click('button[title*="Paste incoming WhatsApp"]');
    await expect(page.locator('text=/WhatsApp Enquiry & Booking Copilot/i').first()).toBeVisible();
    await page.locator('button[title="Close Parser"]').first().click();
    await page.waitForTimeout(300);
  });

  test('should open 1-tap dispatch modal with driver selection & cash collection calculation', async ({ page }) => {
    await page.goto('/admin/');
    await unlockAdminGate(page);

    // If an "Assign Driver & Dispatch" button is visible in Needs Driver, click it
    const dispatchBtn = page.locator('button:has-text("Assign Driver & Dispatch")').first();
    if (await dispatchBtn.isVisible().catch(() => false)) {
      await dispatchBtn.click();
      await expect(page.locator('text=Assign Driver & Send WhatsApp')).toBeVisible();
      await expect(page.locator('text=💵 Driver Must Collect from Guest:')).toBeVisible();
      await expect(page.locator('text=1. Send Duty Slip to Driver')).toBeVisible();
      await expect(page.locator('text=2. Send Cab Details to Guest')).toBeVisible();
      // Close modal
      await page.locator('button:has-text("Cancel")').first().click();
    }
  });

  test('should navigate to Operations & Trip Monitoring Calendar and switch views', async ({ page }) => {
    await page.goto('/admin/');
    await unlockAdminGate(page);
    await expect(page.locator('text=Kalidass Travels').first()).toBeVisible();

    // Click Dispatch Calendar in sidebar
    await clickSidebarNav(page, "Dispatch Calendar");
    await expect(page.locator('text=Operations & Trip Monitoring Calendar')).toBeVisible();

    // Verify 4-stage follow-up radar indicators
    await expect(page.locator('text=/₹500 ADVANCE/i')).toBeVisible();
    await expect(page.locator('text=/NEED DRIVER/i').first()).toBeVisible();
    await expect(page.locator('text=/READY & LIVE/i')).toBeVisible();
    await expect(page.locator('text=/MONTH REVENUE/i')).toBeVisible();

    // Verify view toggle
    await expect(page.locator('button:has-text("Month View")')).toBeVisible();
    await expect(page.locator('button:has-text("Day Agenda")')).toBeVisible();

    // Switch to Day Agenda
    await page.click('button:has-text("Day Agenda")');
    await expect(page.locator('text=Total Departures')).toBeVisible();

    // Switch back to Month View
    await page.click('button:has-text("Month View")');
    await expect(page.locator('button:has-text("Jump to Today")')).toBeVisible();
  });

  test('should redirect legacy /ops to /admin/', async ({ page }) => {
    await page.goto('/ops/');
    await expect(page).toHaveURL(/\/admin\/?/);
  });
});
