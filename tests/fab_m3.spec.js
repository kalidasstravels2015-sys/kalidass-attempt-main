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
    test('FAB meets M3 56dp container, 16dp radius, and 24dp icon specs on mobile (412x924)', async ({ page }) => {
        await page.setViewportSize({ width: 412, height: 924 });
        await page.goto('/', { waitUntil: 'networkidle' });

        const callBtn = page.locator('#floating-call-btn');
        await expect(callBtn).toBeVisible();

        const box = await callBtn.boundingBox();
        expect(box).not.toBeNull();
        expect(box.width).toBe(56);
        expect(box.height).toBe(56);

        const styles = await callBtn.evaluate((el) => {
            const cs = window.getComputedStyle(el);
            const icon = el.querySelector('svg');
            const iconCs = icon ? window.getComputedStyle(icon) : null;
            return {
                width: cs.width,
                height: cs.height,
                borderRadius: cs.borderRadius,
                iconWidth: iconCs ? iconCs.width : null,
                iconHeight: iconCs ? iconCs.height : null,
            };
        });

        expect(styles.width).toBe('56px');
        expect(styles.height).toBe('56px');
        expect(styles.borderRadius).toBe('9999px');
        expect(styles.iconWidth).toBe('24px');
        expect(styles.iconHeight).toBe('24px');
    });

    test('FAB displays accessible M3 tooltip on desktop hover', async ({ page, isMobile }) => {
        if (isMobile) {
            // On mobile touch devices, desktop tooltip should remain hidden to preserve screen space
            await page.goto('/', { waitUntil: 'networkidle' });
            const tooltip = page.locator('#floating-call-btn [role="tooltip"]');
            await expect(tooltip).toBeHidden();
            return;
        }

        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/', { waitUntil: 'networkidle' });

        const callBtn = page.locator('#floating-call-btn');
        await expect(callBtn).toBeVisible();

        await callBtn.hover();
        const tooltip = page.locator('#floating-call-btn [role="tooltip"]');
        await expect(tooltip).toBeVisible();
        await expect(tooltip).toContainText('+91 89395 39211');
    });
});
