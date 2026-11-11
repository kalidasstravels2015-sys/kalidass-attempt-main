import { test, expect } from '@playwright/test';

test.describe('Mobile Typing & Floating Actions Visibility Tests', () => {
  test('Floating WhatsApp & Call buttons hide instantly when user focuses an input and restore on blur', async ({ page }) => {
    // Emulate Mobile Device Viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const floatingContainer = page.locator('#floating-actions-container');
    await expect(floatingContainer).toBeVisible();

    // Find the pickup input in the booking engine
    const pickupInput = page.locator('#pickup-input, #local-pickup-input').first();
    await expect(pickupInput).toBeVisible();

    // Focus input to simulate mobile typing
    await pickupInput.focus();
    await page.waitForTimeout(300);

    // Floating action buttons should now be hidden
    await expect(floatingContainer).toHaveClass(/is-hidden-typing/);
    const opacity = await floatingContainer.evaluate(el => window.getComputedStyle(el).opacity);
    expect(Number(opacity)).toBe(0);

    // Blur input (simulating user finishing typing or tapping outside)
    await pickupInput.blur();
    await page.waitForTimeout(400);

    // Floating actions should restore visibility
    await expect(floatingContainer).not.toHaveClass(/is-hidden-typing/);
  });
});
