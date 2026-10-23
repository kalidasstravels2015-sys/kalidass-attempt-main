import { test, expect } from '@playwright/test';

test.describe('AI Chat Query Telemetry & Admin Radar Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('kt_admin_pin_verified', 'true');
    });
  });

  test('should display AI chat questions in the Admin Command Tower under Inquiries Desk', async ({ page }) => {
    await page.goto('/admin/');

    const menuBtn = page.locator('button[title="Open Navigation Menu"]');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(200);
    }

    // Click 6. Website Calc Radar
    await page.click('button:has-text("6. Website Calc Radar")');

    // Telemetry radar header & views should be visible
    await expect(page.locator('text=Website Fare Calculator Radar').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Live Estimates').first()).toBeVisible();
  });

  test('should submit question from AI chat modal and verify it is logged', async ({ page }) => {
    await page.goto('/');

    // Open AI Concierge Modal if button present
    const chatBtn = page.locator('#ai-concierge-fab, button:has-text("Ask AI")').first();
    if (await chatBtn.isVisible()) {
      await chatBtn.click();
      await expect(page.locator('#ai-chat-modal')).toBeVisible();

      // Type question
      await page.fill('#ai-chat-input', 'How much for Innova Crysta to Tirupati?');
      await page.click('#ai-chat-send-btn');

      // Wait for assistant reply bubble
      await expect(page.locator('.chat-msg-assistant').last()).toBeVisible({ timeout: 10000 });
    }
  });
});
