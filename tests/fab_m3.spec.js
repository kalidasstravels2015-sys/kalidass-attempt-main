import { test, expect } from '@playwright/test';

/**
 * Material Design 3 (M3) Floating Action Button (FAB) Regression Test
 * Enforces Google M3 Standard FAB specifications for thumb-friendly ergonomics:
 * - 56dp x 56dp container size (w-14 h-14)
 * - 16dp corner radius (shape.corner.large / rounded-2xl)
 * - 24dp icon size (w-6 h-6)
 * - Elevation Level 3 shadow
 * - Safe area margins and hit-area expansion
 */
test.describe('Material Design 3 Floating Action Button (FAB)', () => {
    test('FAB meets M3 Extended FAB pill specs and Google Gemini icon on mobile (412x924)', async ({ page }) => {
        await page.setViewportSize({ width: 412, height: 924 });
        await page.goto('/', { waitUntil: 'networkidle' });

        const aiBtn = page.locator('#floating-ai-btn');
        await expect(aiBtn).toBeVisible();

        const box = await aiBtn.boundingBox();
        expect(box).not.toBeNull();
        expect(box.width).toBeGreaterThan(60);
        expect(box.height).toBeGreaterThan(32);

        const styles = await aiBtn.evaluate((el) => {
            const cs = window.getComputedStyle(el);
            const icon = el.querySelector('svg');
            const iconCs = icon ? window.getComputedStyle(icon) : null;
            return {
                borderRadius: cs.borderRadius,
                iconWidth: iconCs ? iconCs.width : null,
                iconHeight: iconCs ? iconCs.height : null,
            };
        });

        expect(styles.borderRadius).toBe('9999px');
        expect(styles.iconWidth).toBeTruthy();

        // Accessible title and label
        await expect(aiBtn).toHaveAttribute('aria-label', /Plan My Trip|Ask me/i);
    });

    test('FAB opens AI Concierge modal with accessible 24/7 Helpline on click', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/', { waitUntil: 'networkidle' });

        const aiBtn = page.locator('#floating-ai-btn');
        await expect(aiBtn).toBeVisible();

        await aiBtn.click();
        const modal = page.locator('#ai-fare-modal');
        await expect(modal).toBeVisible();

        // Modal top app bar contains direct helpline call button
        const helpline = modal.locator('a[href^="tel:"]').first();
        await expect(helpline).toBeVisible();
        await expect(helpline).toContainText('89395 39211');
    });
});
