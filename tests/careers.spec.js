import { test, expect } from '@playwright/test';

test.describe('Careers Removed Tests', () => {

    test('Footer does not display Careers link in Quick Navigation or Legal footer', async ({ page }) => {
        await page.goto('/');

        // Verify Quick Navigation does NOT have Join Our Team (Careers)
        const footerCareersLink = page.locator('footer').getByRole('link', { name: /Join Our Team \(Careers\)/i });
        await expect(footerCareersLink).toHaveCount(0);

        // Verify Legal strip does NOT have Careers & Hiring
        const legalCareersLink = page.locator('footer').getByRole('link', { name: /Careers & Hiring/i });
        await expect(legalCareersLink).toHaveCount(0);

        // Verify HTML sitemap does not list Careers
        await page.goto('/sitemap/');
        const sitemapCareersLink = page.getByRole('link', { name: /Careers & Driver Hiring Portal/i });
        await expect(sitemapCareersLink).toHaveCount(0);
    });

    test('Navigating to /careers/ redirects to home', async ({ page }) => {
        await page.goto('/careers/');
        await expect(page).toHaveURL(/\/(#.*)?$/);
    });
});
