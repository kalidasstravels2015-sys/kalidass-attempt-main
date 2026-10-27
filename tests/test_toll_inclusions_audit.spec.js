import { test, expect } from '@playwright/test';

test.describe('The 1-Day Toll Invariant Regression & Content Integrity Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Set standard mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('Services Directory (/services/) displays "Tolls Covered on 1-Day Tours" promise card', async ({ page }) => {
    await page.goto('/services/', { waitUntil: 'networkidle' });

    // Promise card heading should be updated
    const promiseHeading = page.locator('h3:has-text("Tolls Covered on 1-Day Tours")');
    await expect(promiseHeading).toBeVisible();

    // Verify old confusing text "All Tolls Covered" does NOT exist
    const oldPromiseHeading = page.locator('h3:has-text("All Tolls Covered")');
    await expect(oldPromiseHeading).toHaveCount(0);

    // Verify explanatory subtext
    const subtext = page.locator('text=1-day tour packages include highway FASTag tolls upfront');
    await expect(subtext.first()).toBeVisible();
  });

  test('Temple Tours Hub (/services/tours/temple-tours/) displays "Tolls Covered on 1-Day Tours"', async ({ page }) => {
    await page.goto('/services/tours/temple-tours/', { waitUntil: 'networkidle' });

    // Promise card heading
    const promiseHeading = page.locator('h3:has-text("Tolls Covered on 1-Day Tours")');
    await expect(promiseHeading).toBeVisible();

    // Verify old "All Tolls Included" promise heading is gone
    const oldPromiseHeading = page.locator('h3:has-text("All Tolls Included")');
    await expect(oldPromiseHeading).toHaveCount(0);
  });

  test('Tirupati (/services/tirupati-package/): 1-Day vehicle cards state Tolls & Bata Inc., multi-day states tolls at actuals', async ({ page }) => {
    await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

    // 1-Day vehicle cards must display Tolls & Bata Inc.
    const oneDayCardSubtext = page.locator('text=1-Day (Tolls & Bata Inc.)').first();
    await expect(oneDayCardSubtext).toBeVisible();

    // Click FAQ accordion item to expand answer
    const faqSummary = page.locator('summary:has-text("Are highway tolls and Andhra Pradesh border permit included")').first();
    await faqSummary.click();

    // FAQ answer must explicitly confirm 1-day included and multi-day at actuals
    const faqAnswer = page.locator('text=For our 1-Day flat package, yes, 100% included upfront').first();
    await expect(faqAnswer).toBeVisible();

    // Must NOT contain old contradictory claims
    await expect(page.locator('text=AP State Permit & Round-Trip Highway Tolls Included')).toHaveCount(0);
    await expect(page.locator('text=All Highway Tolls & Permits Included')).toHaveCount(0);
  });

  test('Navagraha Tour (/services/navagraha-tour/): Multi-day shows tolls & bata extra, payable at actuals', async ({ page }) => {
    await page.goto('/services/navagraha-tour/', { waitUntil: 'networkidle' });

    // Vehicle cards must state Tolls & Bata Extra
    await expect(page.locator('text=2-Day Circuit (Tolls & Bata Extra)').first()).toBeVisible();

    // Fleet description must state 1-day includes tolls while multi-day is at actuals
    await expect(page.locator('text=multi-day circuits cover vehicle hire & fuel with tolls and driver bata at actuals').first()).toBeVisible();

    // Click FAQ accordion item
    const faqSummary = page.locator('summary:has-text("What is the total price for the 2-day Kumbakonam Navagraha package")').first();
    await faqSummary.click();

    // FAQ must confirm multi-day tolls at actuals
    await expect(page.locator('text=highway FASTag tolls and parking are paid directly at actuals').first()).toBeVisible();

    // Must NOT claim "All FASTag Tolls Paid by Us" for 2-day circuit
    await expect(page.locator('text=All FASTag Tolls Paid by Us')).toHaveCount(0);
    await expect(page.locator('text=Highway Tolls & Bata: 100% Included')).toHaveCount(0);
  });

  test('Sabarimala Tour (/services/sabarimala-trip/): 3-Day trip shows tolls payable at actuals', async ({ page }) => {
    await page.goto('/services/sabarimala-trip/', { waitUntil: 'networkidle' });

    // Vehicle cards must state Tolls & Bata Extra
    await expect(page.locator('text=3-Day Base Fare (Tolls & Bata Extra)').first()).toBeVisible();

    // Fleet description must state multi-day tolls and bata at actuals
    await expect(page.locator('text=multi-day circuits cover vehicle hire & fuel with tolls and driver bata at actuals').first()).toBeVisible();

    // Click FAQ accordion item
    const faqSummary = page.locator('summary:has-text("Are Kerala interstate road permits and highway tolls included")').first();
    await faqSummary.click();

    // FAQ answer must confirm tolls and parking paid at actuals
    await expect(page.locator('text=Highway FASTag tolls and Nilakkal vehicle parking are paid directly as per actual receipts').first()).toBeVisible();

    // Must NOT claim tolls are included in 3-day fare
    await expect(page.locator('text=Tolls Pre-Paid')).toHaveCount(0);
  });

  test('Rameswaram Tour (/services/rameswaram-2-days/): 2-Day trip shows tolls & bata extra', async ({ page }) => {
    await page.goto('/services/rameswaram-2-days/', { waitUntil: 'networkidle' });

    // Vehicle cards must state Tolls & Bata Extra
    await expect(page.locator('text=2-Day Circuit (Tolls & Bata Extra)').first()).toBeVisible();

    // Must NOT claim "All FASTag Tolls Paid by Us"
    await expect(page.locator('text=All FASTag Tolls Paid by Us')).toHaveCount(0);
  });
});
