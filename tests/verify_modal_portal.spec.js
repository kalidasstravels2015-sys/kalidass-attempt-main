import { test, expect } from '@playwright/test';

test.describe('Airport Booking Modal & Sticky Quick-Nav Isolation', () => {
  test('Desktop: Sticky quick-nav is hidden and does not overlap modal when open', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/services/chennai-airport-taxi/');

    const nav = page.locator('nav[data-quick-nav]');
    await expect(nav).toBeVisible();

    // Scroll down slightly so sticky pill bar is at its sticky position
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(300);

    // Click Airport Pickup
    const tabPickup = page.locator('[data-testid="tab-pickup"]');
    await tabPickup.click();

    // Enter destination
    const toInput = page.locator('#airport-to-input');
    await toInput.fill('Puducherry, India');

    // Click Get Flat Fare
    const calcBtn = page.locator('button:has-text("Get Flat Fare")');
    await calcBtn.click();

    // Modal should appear
    const modal = page.locator('#airport-booking-modal');
    await expect(modal).toBeVisible();

    // Sticky nav must be hidden while modal is open
    await expect(nav).toBeHidden();

    // Modal inputs must be visible and interactive
    const phoneInput = page.locator('#modal-phone');
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('9876543210');

    // Take desktop screenshot
    await page.screenshot({ path: 'tests/verified_modal_portaled_desktop.png' });

    // Close modal
    await modal.locator('button[aria-label="Close"]').click();
    await expect(modal).toBeHidden();

    // Sticky nav returns to visible
    await expect(nav).toBeVisible();
  });

  test('Mobile: Sticky quick-nav is hidden and bottom sheet inputs are unobstructed', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/services/chennai-airport-taxi/');

    const nav = page.locator('nav[data-quick-nav]');
    await expect(nav).toBeVisible();

    // Scroll down so quick-nav is in view
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(300);

    // Click Airport Pickup
    const tabPickup = page.locator('[data-testid="tab-pickup"]');
    await tabPickup.click();

    // Enter destination
    const toInput = page.locator('#airport-to-input');
    await toInput.fill('Puducherry, India');

    // Click Get Flat Fare
    const calcBtn = page.locator('button:has-text("Get Flat Fare")');
    await calcBtn.click();

    // Modal should appear
    const modal = page.locator('#airport-booking-modal');
    await expect(modal).toBeVisible();

    // Sticky nav must be hidden while modal is open
    await expect(nav).toBeHidden();

    // Inputs must be unobstructed
    const phoneInput = page.locator('#modal-phone');
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('9876543210');

    // Take mobile screenshot
    await page.screenshot({ path: 'tests/verified_modal_portaled_mobile.png' });

    // Close modal
    await modal.locator('button[aria-label="Close"]').click();
    await expect(modal).toBeHidden();

    // Sticky nav returns to visible
    await expect(nav).toBeVisible();
  });
});
