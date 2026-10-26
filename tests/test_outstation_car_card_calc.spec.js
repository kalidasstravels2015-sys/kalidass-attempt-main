import { test, expect } from '@playwright/test';

test.describe('Outstation Car Card Fare Calculator & Booking Modal', () => {
  test('opens calculation modal for Maruti Ertiga with locked vehicle, no pax/vehicle dropdowns, and itemized breakdown', async ({ page }) => {
    // Mobile viewport matching user's mobile screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/services/outstation-cabs/', { waitUntil: 'networkidle' });

    // 1. Verify Car Cards have "Calculate & Book" buttons
    const ertigaCalcBtn = page.locator('button[data-open-outstation-calc="true"][data-vehicle-key="Maruti Ertiga"]').first();
    await expect(ertigaCalcBtn).toBeVisible();
    await expect(ertigaCalcBtn).toHaveText(/Calculate & Book/);

    // 2. Click Calculate & Book
    await ertigaCalcBtn.click();

    // 3. Verify OutstationQuotationModal opened
    const modal = page.locator('[role="dialog"][aria-labelledby="outstation-modal-title"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('#outstation-modal-title')).toHaveText('Outstation Fare Calculator & Booking');

    // 4. Verify vehicle is locked to Maruti Ertiga and rates are visible
    await expect(modal.locator('text=Maruti Ertiga / XL6')).toBeVisible();
    await expect(modal.locator('text=Family Favorite')).toBeVisible();
    await expect(modal.locator('text=₹17 / km')).toBeVisible();

    // 5. Verify NO passenger dropdown and NO vehicle selection dropdown in modal
    const vehicleSelects = modal.locator('select');
    await expect(vehicleSelects).toHaveCount(0);
    await expect(modal.locator('text=1-4 Pax')).toBeHidden();
    await expect(modal.locator('text=5-7 Pax')).toBeHidden();

    // 6. Verify old enquiry modal (#bookingEnquiryModal) is NOT open
    const oldModal = page.locator('#bookingEnquiryModal');
    await expect(oldModal).not.toHaveAttribute('open', '');

    // 7. Select quick destination chip: Pondicherry
    const pondyChip = modal.locator('button:has-text("Pondicherry")');
    await expect(pondyChip).toBeVisible();
    await pondyChip.click();

    // Fill pickup location
    const pickupInput = modal.locator('#modal-pickup-location');
    await pickupInput.fill('Anna Nagar, Chennai');
    await pickupInput.blur();

    // 8. Distance & cost calculation should resolve
    await expect(modal.locator('text=~302 km Round Trip').first()).toBeVisible();
    
    // Net total should be visible (302 km * 17 = 5134 -> rounded to 5130 + 500 bata = 5630 or 320km)
    const priceText = modal.locator('.font-heading:has-text("₹")').first();
    await expect(priceText).toBeVisible();

    // 9. Verify Savaari-style clean fare card & 50% payment reassurance
    await expect(modal.locator('text=Pay 50% on cab arrival, balance after trip ends')).toBeVisible();

    // Expand Fare Breakup
    const toggleBreakdownBtn = modal.locator('button:has-text("View Complete Fare Breakup")');
    await expect(toggleBreakdownBtn).toBeVisible();
    await toggleBreakdownBtn.click();

    // Verify Itemized Fare Breakdown & Inclusions
    await expect(modal.locator('text=Cab Hire (Maruti Ertiga / XL6 • Fuel included):')).toBeVisible();
    await expect(modal.locator('text=Driver Allowance (1 Day):')).toBeVisible();
    await expect(modal.locator('text=100% Fuel, Chauffeur & AC Included')).toBeVisible();

    // 10. Verify Action Buttons: Book on WhatsApp & Call
    const waBookBtn = modal.locator('button:has-text("Book on WhatsApp")');
    await expect(waBookBtn).toBeVisible();

    const callBtn = modal.locator('a[href^="tel:"]');
    await expect(callBtn).toBeVisible();
    await expect(callBtn).toHaveAttribute('href', 'tel:+918939539211');

    // 11. Capture screenshots for walkthrough
    await page.screenshot({ path: 'tests/outstation_car_card_modal_verified.png' });

    // Scroll modal body down to view itemized breakdown and buttons
    const modalBody = modal.locator('.overflow-y-auto');
    await modalBody.evaluate((el) => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/outstation_car_card_modal_scrolled.png' });
  });

  test('desktop modal verifies Round Trip only with min 250 km/day rate', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/services/outstation-cabs/', { waitUntil: 'networkidle' });

    // Click on Toyota Innova card's Calculate & Book button (visible on desktop)
    const innovaBtn = page.locator('button[data-open-outstation-calc="true"][data-vehicle-name*="Toyota Innova"]:visible').first();
    await expect(innovaBtn).toBeVisible();
    await innovaBtn.click();

    const modal = page.locator('[role="dialog"][aria-labelledby="outstation-modal-title"]');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Toyota Innova')).toBeVisible();
    await expect(modal.locator('text=₹20 / km')).toBeVisible();

    // Verify Round Trip badge is displayed and One Way Drop is not present
    await expect(modal.locator('text=Round Trip (இரு வழி)')).toBeVisible();
    await expect(modal.locator('text=Min 250 km/day').first()).toBeVisible();
    await expect(modal.locator('button:has-text("One Way Drop")')).toBeHidden();

    // Return date should be visible for Round Trip
    await expect(modal.locator('text=Return Date & Time *')).toBeVisible();
  });
});
