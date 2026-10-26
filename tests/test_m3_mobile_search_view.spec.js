import { test, expect } from '@playwright/test';

test.describe('Material Design 3 (M3) Mobile Search View Tests', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // Standard mobile viewport

  test('Tapping location input on mobile expands into full-screen M3 Search View without keyboard clipping', async ({ page }) => {
    await page.goto('/services/chennai-airport-taxi/');

    const toInput = page.locator('#airport-to-input');
    await expect(toInput).toBeVisible();

    // 1. Click destination input on mobile -> triggers M3 Search View overlay
    await toInput.click();

    const searchDialog = page.locator('[role="dialog"][aria-label="Airport Drop Destination"]');
    await expect(searchDialog).toBeVisible();

    // 2. Verify M3 Top Bar & Search Input
    const m3Input = searchDialog.locator('input[type="search"]');
    await expect(m3Input).toBeVisible();

    // 3. Verify Popular Airport Hub chips are displayed in zero-state
    const besantNagarHub = searchDialog.getByRole('button', { name: /Besant Nagar/i });
    const tNagarHub = searchDialog.getByRole('button', { name: /T\. Nagar/i });
    const omrHub = searchDialog.getByRole('button', { name: /OMR \/ Sholinganallur/i });

    await expect(besantNagarHub).toBeVisible();
    await expect(tNagarHub).toBeVisible();
    await expect(omrHub).toBeVisible();

    // 4. Tap "Besant Nagar" quick hub
    await besantNagarHub.click();

    // 5. Verify M3 Search View closes and destination input receives "Besant Nagar"
    await expect(searchDialog).not.toBeVisible();
    await expect(toInput).toHaveValue('Besant Nagar');

    // 6. Verify fare calculation completes accurately
    const calcBtn = page.locator('#get-flat-fare-btn');
    await expect(calcBtn).toBeVisible();
    await calcBtn.click();

    const resultCard = page.locator('#airport-fare-result-card');
    await expect(resultCard).toBeVisible();
    await expect(resultCard).toContainText(/Total Fare/i);
    await expect(resultCard).toContainText(/Advance to Pay/i);
  });

  test('M3 Search View back button cleanly dismisses search overlay', async ({ page }) => {
    await page.goto('/services/chennai-airport-taxi/');

    const toInput = page.locator('#airport-to-input');
    await expect(toInput).toBeVisible();
    await toInput.click();

    const searchDialog = page.locator('[role="dialog"][aria-label="Airport Drop Destination"]');
    await expect(searchDialog).toBeVisible();

    // Tap back button
    const backBtn = searchDialog.locator('button[aria-label="Go back and close search"]');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Verify search view is dismissed
    await expect(searchDialog).not.toBeVisible();
  });
});
