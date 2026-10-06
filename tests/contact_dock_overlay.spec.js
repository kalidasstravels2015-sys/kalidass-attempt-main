import { test, expect } from '@playwright/test';

/**
 * Rule (docs/03_RULES.md §8.4): the global floating Call FAB must be
 * hidden whenever any popup / modal / bottom-sheet is open, and return on close.
 * Verified on mobile viewport (412×924) and desktop.
 */
test.describe('Popups hide the floating call button', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 924 });
  });

  test('Airport "Trip Summary & Booking" sheet hides floating call button and is not covered', async ({ page }) => {
    await page.goto('/services/chennai-airport-taxi/');
    const callBtn = page.locator('#floating-call-btn');
    await expect(callBtn).toBeVisible();

    await page.locator('#airport-from-input').fill('T. Nagar');
    await page.locator('#get-flat-fare-btn').click();

    const modal = page.locator('#airport-booking-modal');
    await expect(modal).toBeVisible();
    await expect(callBtn).toBeHidden();

    // Sheet's own secondary CTA row must be fully clickable (not under the button)
    const callDesk = modal.getByRole('link', { name: /Call 24\/7 Desk/i });
    await expect(callDesk).toBeVisible();
    await callDesk.click({ trial: true });

    await modal.locator('button[aria-label="Close"]').click();
    await expect(modal).toBeHidden();
    await expect(callBtn).toBeVisible();
  });

  test('Careers application <dialog> hides floating call button', async ({ page }) => {
    await page.goto('/careers/');
    const callBtn = page.locator('#floating-call-btn');
    await expect(callBtn).toBeVisible();

    await page.getByRole('button', { name: /^Apply$/i }).first().click();
    const dialog = page.locator('dialog[open]');
    await expect(dialog).toBeVisible();
    await expect(callBtn).toBeHidden();

    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(callBtn).toBeVisible();
  });

  test('Home safety <dialog> hides floating call button', async ({ page }) => {
    await page.goto('/');
    const callBtn = page.locator('#floating-call-btn');
    await expect(callBtn).toBeVisible();

    const trigger = page.locator('[data-modal-target]').first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expect(page.locator('dialog[open]')).toBeVisible();
    await expect(callBtn).toBeHidden();

    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(callBtn).toBeVisible();
  });
});

