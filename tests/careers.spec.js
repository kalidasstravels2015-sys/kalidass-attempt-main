import { test, expect } from '@playwright/test';

test.describe('Careers & Driver Hiring Tests', () => {

    test('Careers page loads with proper title, hero, and company highlights', async ({ page }) => {
        await page.goto('/careers/');
        await expect(page).toHaveTitle(/Careers & Driver Hiring in Chennai \| Join Kalidass Travels/);
        
        // H1 header
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 })).toContainText(/Careers at/i);

        // Active hiring indicator
        await expect(page.getByText(/We're Actively Hiring/i)).toBeVisible();

        // 3 Cut-and-Dried Company Highlights
        await expect(page.getByText(/Prompt Bata & Salary Settlements/i)).toBeVisible();
        await expect(page.getByText(/Dealer-Serviced 50\+ Vehicle Fleet/i)).toBeVisible();
        await expect(page.getByText(/Medavakkam Hub & Walk-In Facility/i)).toBeVisible();
    });

    test('Footer displays Careers link in Quick Navigation', async ({ page }) => {
        await page.goto('/');

        // Quick Navigation link
        const footerCareersLink = page.locator('footer').getByRole('link', { name: /Join Our Team \(Careers\)/i });
        await expect(footerCareersLink).toBeVisible();
        await expect(footerCareersLink).toHaveAttribute('href', '/careers/');

        // Verify removed from legal strip
        const legalCareersLink = page.locator('footer').getByRole('link', { name: /Careers & Hiring/i });
        await expect(legalCareersLink).toHaveCount(0);
    });

    test('Careers portal lists positions and mandates resume upload for all roles', async ({ page }) => {
        await page.goto('/careers/');

        // Verify open positions header
        await expect(page.getByText(/Current Open Positions \(11\)/i)).toBeVisible();

        // Verify "Resume Required" indicator is visible
        await expect(page.getByText(/Resume Required/i).first()).toBeVisible();

        // Select Outstation Chauffeur and verify it selects in form
        const chauffeurApplyBtn = page.getByRole('button', { name: /Submit Resume/i }).first();
        await chauffeurApplyBtn.click();

        // Verify application form header reflects selected position
        await expect(page.locator('#application-form')).toBeVisible();
        await expect(page.getByText(/Applying for: Outstation & Temple Tour Chauffeur/i)).toBeVisible();
        await expect(page.getByText(/Attach Resume \/ Bio-data/i)).toBeVisible();

        // Try submitting without resume -> validation error
        await page.locator('#fullName').scrollIntoViewIfNeeded();
        await page.locator('#fullName').fill('R. Saravanan');
        await page.locator('#phone').fill('9840123456');
        await page.locator('#livingArea').fill('Medavakkam');

        await page.getByRole('button', { name: /Submit Application & Resume/i }).click();

        // Should display resume required validation error
        await expect(page.getByRole('alert')).toBeVisible();
        await expect(page.getByRole('alert')).toContainText(/Please attach your Resume/i);

        // Upload dummy resume file
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.locator('text=Click to select or drop your Resume file').click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles({
            name: 'saravanan_resume.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4 dummy resume content'),
        });

        // Submit form with resume
        await page.getByRole('button', { name: /Submit Application & Resume/i }).click();

        // Verify success card
        await expect(page.getByText(/Application Received/i)).toBeVisible();
        await expect(page.getByText(/Thank You, R. Saravanan!/i)).toBeVisible();
        await expect(page.getByText(/Application ID:/i)).toBeVisible();
        await expect(page.getByText(/saravanan_resume.pdf/i)).toBeVisible();
    });
});
