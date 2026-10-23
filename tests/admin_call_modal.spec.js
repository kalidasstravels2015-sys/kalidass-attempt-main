import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('kt_admin_pin_verified', 'true');
  });
});

test.describe('Fast Track Travel Desk CAD Console & 6 Quotation Engines Suite', () => {
  test('should open Fast Track CAD Call modal with ZERO preselected fields, mirror all 6 engines with dynamic morphing, and support full booking flow', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('text=Kalidass Travels').first()).toBeVisible();

    // 1. Open the "+ New Customer Call" modal
    const newCallBtn = page.locator('button:has-text("+ New Customer Call")');
    await expect(newCallBtn).toBeVisible();
    await newCallBtn.click();

    // 2. Verify modal header and CAD desk badge
    await expect(page.locator('text=Record Inbound Customer Call').first()).toBeVisible();
    await expect(page.locator('text=Fast Track CAD Desk')).toBeVisible();

    // 3. STRICT ASSERTION: Verify ZERO fields are pre-selected upon opening
    // A. Pickup & Drop inputs must be empty
    const pickupInput = page.locator('input[placeholder="Search street, college, landmark, or airport..."]');
    await expect(pickupInput).toHaveValue('');
    const dropInput = page.locator('input[placeholder="Search destination city, temple, town..."]');
    await expect(dropInput).toHaveValue('');

    // B. Date & Time inputs must be empty
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toHaveValue('');
    const timeInput = page.locator('input[type="time"]');
    await expect(timeInput).toHaveValue('');

    // C. Header date preview must indicate pending
    await expect(page.locator('text=Departure date pending')).toBeVisible();

    // D. Final Quoted Fare must be empty
    const fareInput = page.locator('input[placeholder="e.g. 5800"]');
    await expect(fareInput).toHaveValue('');

    // E. No vehicle card checkmark should be visible
    await expect(page.locator('.ring-2.ring-m3-primary\\/30')).toHaveCount(0);

    // F. Verify the helpful unselected state prompt is visible
    await expect(page.locator('text=Select one of the 6 quotation engines above').first()).toBeVisible();

    // Take screenshot of clean, unselected modal
    await page.screenshot({ path: 'tests/fast_track_cad_modal_unselected.png' });

    // 4. Verify ALL 6 website quotation engine buttons exist
    await expect(page.locator('button:has-text("Outstation Cabs")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Local City Rental")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Airport Taxi")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Tour Packages")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Acting Drivers")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Car Relocation")').first()).toBeVisible();

    // 5. Test Dynamic Input Morphing Across Engines:

    // A. Engine 5: Acting Drivers
    await page.locator('button:has-text("Acting Drivers")').first().click();
    await expect(page.locator('text=Chauffeur Duty Type:')).toBeVisible();
    await expect(page.locator('text=Professional Chauffeur Duty')).toBeVisible();
    await expect(page.locator('text=Estimated Driver Fee')).toBeVisible();
    await expect(page.locator('button:has-text("1-Tap Select Rate")')).toBeVisible();

    // B. Engine 6: Car Relocation
    await page.locator('button:has-text("Car Relocation")').first().click();
    await expect(page.locator('text=Intercity Relocation Destination:')).toBeVisible();
    await expect(page.locator('text=Intercity Vehicle Driveaway Transit')).toBeVisible();
    await expect(page.locator('text=All-Inclusive Relocation Fare')).toBeVisible();

    // C. Engine 2: Local City Rental
    await page.locator('button:has-text("Local City Rental")').first().click();
    await expect(page.locator('text=Chennai Local Hourly Package:')).toBeVisible();
    await expect(page.locator('button:has-text("8h / 80km (Full Day)")')).toBeVisible();
    await expect(page.locator('text=Local Sightseeing Area / Stops (Within Chennai)')).toBeVisible();

    // D. Engine 3: Airport Taxi
    await page.locator('button:has-text("Airport Taxi")').first().click();
    await expect(page.locator('text=Airport Transfer Direction:')).toBeVisible();
    await expect(page.locator('button:has-text("Drop to Chennai Airport")')).toBeVisible();
    await expect(page.locator('button:has-text("Pickup from Chennai Airport")')).toBeVisible();
    await expect(page.locator('text=Chennai Zone:')).toBeVisible();

    // E. Engine 4: Tour Packages
    await page.locator('button:has-text("Tour Packages")').first().click();
    await expect(page.locator('text=Select Pilgrimage / Tour Package Circuit:')).toBeVisible();

    // F. Engine 1: Outstation Cabs (Execute Full Outstation Booking Flow)
    await page.locator('button:has-text("Outstation Cabs")').first().click();
    await expect(page.locator('text=Outstation Trip Type:')).toBeVisible();
    await expect(page.locator('button:has-text("Round Trip (Min 250 km/day)")')).toBeVisible();
    await expect(page.locator('text=Package Duration:')).toBeVisible();

    // 6. User Selection Flow for Outstation Cabs:
    // A. Choose Pickup Hub
    await page.locator('button:has-text("📍 Medavakkam (Office)")').click();
    await expect(pickupInput).toHaveValue('Medavakkam, Chennai');

    // B. Choose Drop Destination Chip
    await page.locator('button:has-text("🛕 Tirupati")').first().click();
    await expect(dropInput).toHaveValue('Tirupati');

    // C. Choose Date & Time Presets
    await page.locator('button:has-text("Tomorrow")').first().click();
    await page.locator('button:has-text("06:00 AM")').first().click();
    await expect(page.locator('text=Tomorrow').first()).toBeVisible();

    // D. 1-Tap Fleet Card Selection: SUV Ertiga
    await page.locator('text=SUV Ertiga').first().click();

    // E. Verify Quoted Fare input has live calculated fare (greater than 2000)
    const fareVal = await fareInput.inputValue();
    expect(Number(fareVal)).toBeGreaterThan(2000);

    // 7. Enter Customer Details & Select Enquiry Source
    await page.fill('input[placeholder="e.g. Dhanalakshmi / Ramesh"]', 'Dhanalakshmi Ammal');
    await page.fill('input[placeholder="e.g. 99406 29716"]', '9940629716');
    await page.locator('#new-call-cad-form button:has-text("Google Ads")').click();

    // 8. Verify Sticky Footer with the 3 distinct action buttons
    await expect(page.locator('button:has-text("1. Save (Follow-Up Scheduled)")')).toBeVisible();
    await expect(page.locator('button:has-text("2. Save & Send WA Quote")')).toBeVisible();
    await expect(page.locator('button:has-text("3. Got ₹500 Adv (Confirm)")')).toBeVisible();

    // Click 1. Save (Follow-Up Scheduled)
    await page.locator('button:has-text("1. Save (Follow-Up Scheduled)")').click();

    // 9. Modal should close and the enquiry should appear in the table
    await expect(page.locator('text=Record Inbound Customer Call')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Dhanalakshmi Ammal').first()).toBeVisible();

    // 10. Re-open modal to verify it resets completely with NO preselected values
    await newCallBtn.click();
    await expect(page.locator('text=Record Inbound Customer Call').first()).toBeVisible();
    await expect(pickupInput).toHaveValue('');
    await expect(dropInput).toHaveValue('');
    await expect(fareInput).toHaveValue('');
    await expect(page.locator('text=Departure date pending')).toBeVisible();
    await expect(page.locator('text=Select one of the 6 quotation engines above').first()).toBeVisible();
  });
});
