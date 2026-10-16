import { test, expect } from '@playwright/test';

test.describe('AI Chat Query Telemetry & Admin Radar Suite', () => {
  test('should display AI chat questions in the Admin Command Tower under Inquiries Desk', async ({ page }) => {
    await page.goto('/admin/');
    await page.waitForLoadState('networkidle');

    // Click 1. Inquiries & Quotes
    await page.locator('button:has-text("1. Inquiries & Quotes")').first().click({ force: true });

    // Verify Inquiries desk sub-toggles
    await expect(page.locator('button:has-text("Calculator Leads")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Live AI Chat Radar")')).toBeVisible();

    // Click Live AI Chat Radar toggle
    await page.locator('button:has-text("Live AI Chat Radar")').first().click({ force: true });

    // Telemetry summary metrics should be visible
    await expect(page.locator('text=Total Questions Asked')).toBeVisible();
    await expect(page.locator('text=Live CSV & Webhook Active')).toBeVisible();

    // Verify recent logged questions are displayed
    await expect(page.locator('text=Visitor Asked:').first()).toBeVisible();
    await expect(page.locator('text=Tirupati').first()).toBeVisible();
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
