import { test, expect } from '@playwright/test';

test.describe('Scoped Booking Layouts: Airport vs. Outstation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // Mobile viewport
  });

  test('Airport Taxi deploys Clean Layout (large cards, no duplicate bill table)', async ({ page }) => {
    await page.goto('/services/chennai-airport-taxi/', { waitUntil: 'domcontentloaded' });

    const destInput = page.locator('#airport-dest-input');
    await expect(destInput).toBeVisible();

    // Pick T. Nagar chip
    const tNagarChip = page.locator('button:has-text("T. Nagar")').first();
    await expect(tNagarChip).toBeVisible();
    await tNagarChip.click();

    // Calculate
    const calcBtn = page.locator('button:has-text("View Instant Fare")').first();
    await calcBtn.click();

    const resultCard = page.locator('#fare-result-summary-card');
    await expect(resultCard).toBeVisible();

    // Verify Clean Layout features:
    // 1. Large showcase cards with capacity "Seats + Bags"
    await expect(resultCard.locator('text=4 Seats + 2 Bags')).toBeVisible();

    // 2. Direct WhatsApp CTA with fare
    await expect(resultCard.locator('a[data-direct-whatsapp="true"]')).toContainText(/Book Sedan on WhatsApp — ₹/i);

    // 3. ZERO Bill Receipt table (No duplicate "Bill Receipt" or "km @ ₹14/km" table)
    await expect(resultCard.locator('text=km @ ₹14/km')).not.toBeVisible();
    await expect(resultCard.locator('text=Payment & Billing Rules')).not.toBeVisible();
  });

  test('Outstation Cabs strictly preserves Classic Outstation Layout (compact switcher, bill receipt, payment rules)', async ({ page }) => {
    await page.goto('/services/outstation-cabs/', { waitUntil: 'domcontentloaded' });

    // Pick destination Pondicherry
    const pondiChip = page.locator('button:has-text("Pondicherry")').first();
    if (await pondiChip.isVisible()) {
      await pondiChip.click();
    } else {
      const dropInput = page.locator('#drop-input');
      await dropInput.fill('Pondicherry');
    }

    // Set pickup & return date times
    const pickupInput = page.locator('#pickup-datetime-input');
    const returnInput = page.locator('#return-datetime-input');
    
    // Future date setup (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);
    const pickupVal = tomorrow.toISOString().slice(0, 16);
    await pickupInput.fill(pickupVal);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    dayAfter.setHours(20, 0, 0, 0);
    const returnVal = dayAfter.toISOString().slice(0, 16);
    await returnInput.fill(returnVal);

    // Calculate
    const calcBtn = page.locator('button:has-text("View Instant Fare")').first();
    await calcBtn.click();

    const resultCard = page.locator('#fare-result-summary-card');
    await expect(resultCard).toBeVisible();

    // Verify Classic Outstation Layout:
    // 1. Does NOT have the clean layout's large showcase card ("4 Seats + 2 Bags" text is not present)
    await expect(resultCard.locator('text=4 Seats + 2 Bags')).not.toBeVisible();

    // 2. Contains full itemized Bill Receipt math
    await expect(resultCard.locator('text=Driver Bata')).toBeVisible();
    await expect(resultCard.locator('text=Toll Gate Fees (FASTag)')).toBeVisible();
    await expect(resultCard.locator('text=Estimated Total Fare')).toBeVisible();

    // 3. Contains Payment & Billing Rules box
    await expect(resultCard.locator('text=Payment & Billing Rules')).toBeVisible();
    await expect(resultCard.locator('text=advance to reserve cab')).toBeVisible();

    // 4. Contains Outstation CTAs (WhatsApp + Call Us)
    await expect(resultCard.locator('a:has-text("Book Sedan on WhatsApp")')).toBeVisible();
    await expect(resultCard.locator('a:has-text("Call Us")')).toBeVisible();
  });
});
