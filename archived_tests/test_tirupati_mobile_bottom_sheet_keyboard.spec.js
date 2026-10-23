import { test, expect } from '@playwright/test';

test.describe('Tirupati Booking Engine: Mobile Bottom Sheet & Keyboard UX', () => {
  test('Mobile viewport (390x844): Fare breakdown opens as a Bottom Sheet Drawer with embedded CTA and closes cleanly', async ({ page }) => {
    // 1. Mobile phone viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

    const bookingSection = page.locator('#booking');
    await bookingSection.scrollIntoViewIfNeeded();

    // 2. Verify distinction between Title boldness (>= 600) and Placeholder softness (<= 400)
    const pickupLabel = bookingSection.locator('label[for]').first();
    const labelWeight = await pickupLabel.evaluate(el => window.getComputedStyle(el).fontWeight);
    expect(parseInt(labelWeight, 10)).toBeGreaterThanOrEqual(600);

    const paxSelect = bookingSection.locator('select').first();
    const paxWeight = await paxSelect.evaluate(el => window.getComputedStyle(el).fontWeight);
    expect(parseInt(paxWeight, 10)).toBeLessThanOrEqual(400);

    // 3. Fill in basic booking details
    const pickupInput = bookingSection.locator('input[placeholder*="pickup address in Chennai"]');
    await pickupInput.fill('T. Nagar, Chennai');
    await paxSelect.selectOption('4');

    const vehSelect = bookingSection.locator('select').nth(1);
    await vehSelect.selectOption('dzire');

    const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
    const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);
    await pickupDate.fill('2026-10-15T06:00');
    await returnDate.fill('2026-10-15T21:00');

    // 4. Verify hero price is displayed
    await expect(bookingSection.getByText('₹ 6,000')).toBeVisible();

    // 5. Click "View Itemized Fare Breakdown"
    const breakdownBtn = bookingSection.locator('button:has-text("View Itemized Fare Breakdown")');
    await breakdownBtn.scrollIntoViewIfNeeded();
    await breakdownBtn.click();

    // 6. On mobile, the Bottom Sheet Drawer portal should be visible
    const bottomSheet = page.locator('#fare-breakdown-portal-root');
    await expect(bottomSheet).toBeVisible();

    // Line items and zero-rupee inclusions must be visible inside the bottom sheet
    await expect(bottomSheet.getByText('INCLUDED (₹0)').first()).toBeVisible();
    await expect(bottomSheet.getByText('Net Package Total:')).toBeVisible();

    // 7. A direct "Book on WhatsApp" CTA must be present inside the sheet so users can convert directly
    const sheetWaBtn = bottomSheet.locator('a[data-direct-whatsapp="true"], a:has-text("Book on WhatsApp")').first();
    await expect(sheetWaBtn).toBeVisible();

    // 8. Close the bottom sheet via the X button
    const closeBtn = bottomSheet.locator('button[aria-label="Close fare breakdown"]');
    await closeBtn.click();
    await expect(bottomSheet).not.toBeVisible();

    // Verify main card CTA is still right there without page disorientation
    const mainWaBtn = bookingSection.locator('a[data-direct-whatsapp="true"]').first();
    await expect(mainWaBtn).toBeVisible();
  });

  test('Desktop viewport (1280x900): Fare breakdown expands cleanly inline without opening mobile drawer', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

    const bookingSection = page.locator('#booking');
    await bookingSection.scrollIntoViewIfNeeded();

    const pickupInput = bookingSection.locator('input[placeholder*="pickup address in Chennai"]');
    await pickupInput.fill('Guindy, Chennai');

    const paxSelect = bookingSection.locator('select').first();
    await paxSelect.selectOption('4');

    const vehSelect = bookingSection.locator('select').nth(1);
    await vehSelect.selectOption('dzire');

    const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
    const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);
    await pickupDate.fill('2026-10-15T06:00');
    await returnDate.fill('2026-10-15T21:00');

    // Click toggle
    const breakdownBtn = bookingSection.locator('button:has-text("View Itemized Fare Breakdown")');
    await breakdownBtn.click();

    // On desktop, the mobile portal should NOT be open, but the desktop inline view should be visible
    const mobileSheet = page.locator('#fare-breakdown-portal-root');
    await expect(mobileSheet).not.toBeVisible();

    const desktopInline = bookingSection.locator('#fare-breakdown-details, .divide-y');
    await expect(desktopInline.first()).toBeVisible();
    await expect(bookingSection.getByText('INCLUDED (₹0)').first()).toBeVisible();
  });
});
