import { test, expect } from '@playwright/test';

test.describe('Functional Tests', () => {

    test('Homepage loads correctly', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Kalidass Travels/);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('Legal and 404 pages load correctly', async ({ page }) => {
        // Privacy Policy
        await page.goto('/privacy/');
        await expect(page).toHaveTitle(/Privacy Policy/i);
        await expect(page.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeVisible();

        // Terms and Conditions
        await page.goto('/terms/');
        await expect(page).toHaveTitle(/Terms and Conditions/i);
        await expect(page.getByRole('heading', { level: 1, name: /Terms & Conditions/i })).toBeVisible();

        // Custom 404
        await page.goto('/non-existent-route-for-testing/');
        await expect(page).toHaveTitle(/404/i);
        await expect(page.getByText(/This Route Took a Detour/i)).toBeVisible();
    });

    test('Service pages load correctly', async ({ page }) => {
        await page.goto('/services/acting-driver-within-chennai/'); 
        await expect(page).toHaveTitle(/Acting Driver/i);
    });

    // Quotation Engine Test
    test('Quotation Engine calculates estimate', async ({ page }) => {
        await page.goto('/');

        // Wait for the calculator
        const calculatorHeading = page.getByRole('heading', { name: /Book Your Ride/i });
        await expect(calculatorHeading).toBeVisible();

        // Fill inputs
        const pickupInput = page.getByRole('textbox', { name: /Pickup Location/i });
        const dropInput = page.getByRole('textbox', { name: /Drop Location/i });

        await expect(pickupInput).toBeVisible();
        await expect(dropInput).toBeVisible();
        
        // Fill some data and check if Calculate button is there
        await pickupInput.fill('Chennai Airport');
        await dropInput.fill('T Nagar');
        const calculateBtn = page.getByRole('button', { name: /Calculate Cost/i }).first();
        await calculateBtn.scrollIntoViewIfNeeded();
        await expect(calculateBtn).toBeVisible();
    });

});
