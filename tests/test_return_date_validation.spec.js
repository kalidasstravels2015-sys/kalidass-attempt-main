import { test, expect } from '@playwright/test';

test.describe('BookingEngine Return Date Strict Validation Audit', () => {

  test('Homepage Booking Engine: Shows active fare button and prompts user to fill return date when clicked', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const bookingSection = page.locator('#fare-calculator[data-hydrated="true"]');
    await bookingSection.waitFor({ state: 'visible', timeout: 10000 });
    await bookingSection.scrollIntoViewIfNeeded();

    const pickupInput = bookingSection.locator('#pickup-datetime-input');
    const dropInput = bookingSection.locator('#drop-input');
    const returnInput = bookingSection.locator('#return-datetime-input');
    const viewFareBtn = bookingSection.locator('#view-fare-btn');
    const returnBadge = bookingSection.locator('label[for="return-datetime-input"] + span');

    // Pre-fill destination so we specifically test return date validation
    await dropInput.fill('Pondicherry');
    await page.waitForTimeout(300);

    // 1. Initial State: Button is active (NOT greyed out), return date is empty with 'Required' badge
    await expect(returnInput).toHaveValue('');
    await expect(returnBadge).toHaveText('Required');
    await expect(viewFareBtn).toBeEnabled();
    await expect(viewFareBtn).toHaveClass(/bg-blue-600/);

    // 2. Click View Instant Fare without filling return date -> Triggers inline validation prompt
    await viewFareBtn.click();
    const alert = bookingSection.locator('#booking-validation-alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Please select your return date & time to calculate round-trip fare');
    await expect(page.locator('#fare-result-summary-card')).not.toBeVisible();

    // 3. Verify Return Date min attribute is set based on pickup date + minimum realistic duration
    const minVal = await returnInput.getAttribute('min');
    expect(minVal).toBeTruthy();

    // 4. Set a valid return date (same-day evening return, e.g. 14 hrs after pickup)
    const pickupVal = await pickupInput.inputValue();
    const pickupDate = new Date(pickupVal);
    const returnDate = new Date(pickupDate.getTime() + 14 * 60 * 60 * 1000);
    const returnIso = `${returnDate.getFullYear()}-${String(returnDate.getMonth() + 1).padStart(2, '0')}-${String(returnDate.getDate()).padStart(2, '0')}T${String(returnDate.getHours()).padStart(2, '0')}:${String(returnDate.getMinutes()).padStart(2, '0')}`;

    await returnInput.fill(returnIso);

    // 5. Badge updates to trip duration and validation alert disappears
    await expect(returnBadge).toHaveText('1 Day (Same Day)');
    await expect(alert).not.toBeVisible();

    // 6. Click View Instant Fare -> Successfully reveals results
    await viewFareBtn.click();
    const summaryCard = page.locator('#fare-result-summary-card');
    await expect(summaryCard).toBeVisible();

    // 7. Click Edit -> Returns to form
    const editBtn = summaryCard.locator('button:has-text("Edit")');
    await editBtn.click();
    await expect(bookingSection.locator('#pickup-datetime-input')).toBeVisible();

    // 8. Clear Return Date and click View Fare -> Prompts user again
    await returnInput.fill('');
    await expect(returnBadge).toHaveText('Required');
    await viewFareBtn.click();
    await expect(alert).toBeVisible();
    await expect(page.locator('#fare-result-summary-card')).not.toBeVisible();
  });

  test('Multi-Day Return Date updates duration badge to 2 Days', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const bookingSection = page.locator('#fare-calculator[data-hydrated="true"]');
    await bookingSection.waitFor({ state: 'visible', timeout: 10000 });
    await bookingSection.scrollIntoViewIfNeeded();

    const pickupInput = bookingSection.locator('#pickup-datetime-input');
    const dropInput = bookingSection.locator('#drop-input');
    const returnInput = bookingSection.locator('#return-datetime-input');
    const returnBadge = bookingSection.locator('label[for="return-datetime-input"] + span');

    await dropInput.fill('Pondicherry');
    await page.waitForTimeout(300);

    const pickupVal = await pickupInput.inputValue();
    const pickupDate = new Date(pickupVal);
    // 36 hours later (2 days, 1 night)
    const returnDate = new Date(pickupDate.getTime() + 36 * 60 * 60 * 1000);
    const returnIso = `${returnDate.getFullYear()}-${String(returnDate.getMonth() + 1).padStart(2, '0')}-${String(returnDate.getDate()).padStart(2, '0')}T${String(returnDate.getHours()).padStart(2, '0')}:${String(returnDate.getMinutes()).padStart(2, '0')}`;

    await returnInput.fill(returnIso);
    await expect(returnBadge).toHaveText('2 Days (1N)');

    // View Fare button should be active and lead to results
    const viewFareBtn = bookingSection.locator('#view-fare-btn');
    await expect(viewFareBtn).toBeEnabled();
    await viewFareBtn.click();
    await expect(page.locator('#fare-result-summary-card')).toBeVisible();
  });

  test('Outstation: Selecting a return date earlier than pickup date is strictly prevented and snaps to valid minimum', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const bookingSection = page.locator('#fare-calculator[data-hydrated="true"]');
    await bookingSection.waitFor({ state: 'visible', timeout: 10000 });
    await bookingSection.scrollIntoViewIfNeeded();

    const pickupInput = bookingSection.locator('#pickup-datetime-input');
    const dropInput = bookingSection.locator('#drop-input');
    const returnInput = bookingSection.locator('#return-datetime-input');

    await dropInput.fill('Pondicherry');
    await page.waitForTimeout(300);

    const pickupVal = await pickupInput.inputValue();
    const pickupDate = new Date(pickupVal);
    // Try to force a past date: 1 day BEFORE pickup
    const pastDate = new Date(pickupDate.getTime() - 24 * 60 * 60 * 1000);
    const pastIso = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}T${String(pastDate.getHours()).padStart(2, '0')}:${String(pastDate.getMinutes()).padStart(2, '0')}`;

    await returnInput.fill(pastIso);
    await page.waitForTimeout(300);

    // Verify it automatically adjusted and did NOT keep the past date
    const returnVal = await returnInput.inputValue();
    expect(new Date(returnVal).getTime()).toBeGreaterThan(pickupDate.getTime());

    // Validation alert informs the user
    const alert = bookingSection.locator('#booking-validation-alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/Return date & time must be after pickup|Automatically adjusted/i);
  });

});
