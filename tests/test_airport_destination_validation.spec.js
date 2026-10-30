import { test, expect } from '@playwright/test';

test.describe('Airport Booking Engine - Strict Destination Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // Standard Mobile Viewport
    await page.goto('/services/chennai-airport-taxi/', { waitUntil: 'domcontentloaded' });
  });

  test('Blocks fare calculation and displays clear warning when drop destination is empty', async ({ page }) => {
    const destInput = page.locator('#airport-dest-input');
    await expect(destInput).toBeVisible();
    await expect(destInput).toHaveValue('');

    // Click "View Instant Fare" with empty destination
    const viewFareBtn = page.locator('button:has-text("View Instant Fare")');
    await expect(viewFareBtn).toBeVisible();
    await viewFareBtn.click();

    // 1. Result card MUST NOT be visible
    const resultCard = page.locator('#fare-result-summary-card');
    await expect(resultCard).not.toBeVisible();

    // 2. Explicit validation alert MUST appear
    const alertBox = page.locator('#booking-validation-alert');
    await expect(alertBox).toBeVisible();
    await expect(alertBox).toContainText(/Please enter your destination \/ hotel \/ area in Chennai/i);

    // 3. Dest input MUST have error highlight
    await expect(destInput).toHaveClass(/border-red-500/);

    // 4. Click a popular quick-chip (e.g. "T. Nagar")
    const tNagarChip = page.locator('button:has-text("T. Nagar")');
    await expect(tNagarChip).toBeVisible();
    await tNagarChip.click();

    // Input must be populated and validation error cleared
    await expect(destInput).toHaveValue('T. Nagar');
    await expect(alertBox).not.toBeVisible();

    // 5. Now calculate fare successfully
    await viewFareBtn.click();
    await expect(resultCard).toBeVisible();
    await expect(resultCard).toContainText(/T\. Nagar/i);
    await expect(resultCard).toContainText(/₹950/i);
  });
});
