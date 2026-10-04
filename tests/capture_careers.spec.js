import { test } from '@playwright/test';

test('Capture Careers Page Desktop and Mobile Screenshots', async ({ page }) => {
    // Desktop screenshot
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/careers/', { waitUntil: 'networkidle' });
    await page.screenshot({
        path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/c9b9d800-6d2c-467f-8931-4f59041103f6/careers_desktop.png',
        fullPage: true,
    });

    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload({ waitUntil: 'networkidle' });
    await page.screenshot({
        path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/c9b9d800-6d2c-467f-8931-4f59041103f6/careers_mobile.png',
        fullPage: true,
    });
});
