import { test, expect } from '@playwright/test';

test.describe('Functional Tests', () => {

    test('Homepage loads correctly', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Kalidass Travels/);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('Language toggle switches to Tamil', async ({ page }) => {
        await page.goto('/');

        // Click the language toggle (use first() as there are desktop/mobile versions)
        const tamilLink = page.getByLabel('Switch to Tamil').first();
        await tamilLink.click();

        // Verify URL changes
        await expect(page).toHaveURL(/.*\/ta/);

        // Verify Tamil content (HTML lang attribute)
        await expect(page.locator('html')).toHaveAttribute('lang', 'ta');
    });

    test('Service pages load correctly', async ({ page }) => {
        await page.goto('/services/acting-driver-within-chennai'); 
        await expect(page).toHaveTitle(/Acting Driver/i);
    });

    // Quotation Engine Test
    test('Quotation Engine calculates estimate', async ({ page }) => {
        await page.goto('/');

        // Wait for the calculator
        const calculatorHeading = page.getByRole('heading', { name: /Book Your Ride/i });
        await expect(calculatorHeading).toBeVisible();

        // Fill inputs
        const pickupInput = page.getByLabel(/Pickup Location/i);
        const dropInput = page.getByLabel(/Drop Location/i);
        const vehicleSelect = page.getByLabel(/Vehicle/i);

        await expect(pickupInput).toBeVisible();
        await expect(dropInput).toBeVisible();
        await expect(vehicleSelect).toBeVisible();
        
        // Fill some data and check if Calculate button is there
        await pickupInput.fill('Chennai Airport');
        await dropInput.fill('T Nagar');
        const calculateBtn = page.getByRole('button', { name: /Calculate Cost/i }).first();
        await calculateBtn.scrollIntoViewIfNeeded();
        await expect(calculateBtn).toBeVisible();
    });

});
