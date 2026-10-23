import { test, expect } from '@playwright/test';

test.describe('Careers Page Visual & Icon Audit', () => {
  test('should render all icons cleanly without font fallback glyphs on mobile', async ({ page }) => {
    await page.goto('/careers/');

    // Verify 0 Tamil characters in visible page content
    const pageText = await page.locator('main').first().innerText();
    expect(/[\u0B80-\u0BFF]/.test(pageText)).toBe(false);

    // Check Hero section buttons & chips
    const applyOnlineBtn = page.locator('#heroApplyOnlineBtn, button:has-text("Apply Online"), a:has-text("Apply Online")');
    await expect(applyOnlineBtn).toBeVisible();
    await expect(applyOnlineBtn.locator('svg')).toBeVisible();

    const hrCallBtn = page.locator('a:has-text("HR Desk")');
    await expect(hrCallBtn).toBeVisible();
    await expect(hrCallBtn.locator('svg')).toBeVisible();

    // Check Job Card Apply buttons
    const cardApplyBtns = page.locator('button:has-text("Apply")');
    const count = await cardApplyBtns.count();
    expect(count).toBeGreaterThanOrEqual(11);
    
    for (let i = 0; i < Math.min(count, 4); i++) {
      const btn = cardApplyBtns.nth(i);
      await expect(btn).toBeVisible();
      await expect(btn.locator('svg')).toBeVisible();
      const text = await btn.innerText();
      expect(text).toContain('Apply');
      expect(text).not.toContain('Submit Resume');
    }

    // Take mobile screenshots
    await page.screenshot({ path: 'test-results/careers-mobile-hero.png', fullPage: false });

    // Scroll to job cards
    await cardApplyBtns.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/careers-mobile-cards.png', fullPage: false });

    // Open application modal dialog
    await cardApplyBtns.first().click();
    const dialog = page.locator('dialog[aria-labelledby="apply-modal-title"]');
    await expect(dialog).toBeVisible();

    const submitBtn = dialog.getByRole('button', { name: /Apply & Send via WhatsApp/i });
    await expect(submitBtn).toBeVisible();
    await page.screenshot({ path: 'test-results/careers-mobile-form-submit.png', fullPage: false });
  });

  test('should render all icons cleanly on desktop', async ({ page }) => {
    await page.goto('/careers/');

    await page.screenshot({ path: 'test-results/careers-desktop-hero.png', fullPage: false });
  });
});
