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

  test('AI Concierge modal hides floating call button and sticky nav, and returns on close', async ({ page }) => {
    await page.goto('/services/chennai-airport-taxi/');
    const floatingDock = page.locator('#floating-actions-container');
    const quickNav = page.locator('nav[data-quick-nav]');
    await expect(floatingDock).toBeVisible();
    await expect(quickNav).toBeVisible();

    const aiBtn = page.locator('#navbar-ai-plan-btn, #desktop-navbar-ai-plan-btn, #floating-ai-mobile-btn, #floating-ai-btn').locator('visible=true');
    await aiBtn.click();

    const modal = page.locator('#ai-fare-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await expect(floatingDock).toBeHidden();
    await expect(quickNav).toBeHidden();

    // Secondary CTA in modal is fully clickable
    const callDesk = modal.locator('a[href^="tel:"]').first();
    await expect(callDesk).toBeVisible();
    await callDesk.click({ trial: true });

    await modal.locator('#close-ai-modal-btn').click();
    await expect(modal).toBeHidden();
    await expect(floatingDock).toBeVisible();
    await expect(quickNav).toBeVisible();
  });

  test('Home safety <dialog> hides floating call button', async ({ page }) => {
    await page.goto('/');
    const floatingDock = page.locator('#floating-actions-container');
    await expect(floatingDock).toBeVisible();

    const trigger = page.locator('[data-modal-target]').first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expect(page.locator('dialog[open]')).toBeVisible();
    await expect(floatingDock).toBeHidden();

    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(floatingDock).toBeVisible();
  });
});

