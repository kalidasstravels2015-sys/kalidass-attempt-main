import { test, expect } from '@playwright/test';

test.describe('Tirupati 24-Hour Policy: Inclusive vs Extra (Actuals)', () => {
  test('Verify Inclusive policy for <= 24 Hours and Monotonic Pro-Rata Extra (Actuals) for > 24 Hours', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

    const bookingSection = page.locator('#booking');
    await bookingSection.scrollIntoViewIfNeeded();

    // 1. Enter pickup location
    const pickupInput = bookingSection.locator('input[placeholder*="pickup address in Chennai"]');
    await pickupInput.fill('Pallavaram, Chennai');

    const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
    const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);

    // 2. Select Passengers & Vehicle (Sedan)
    const paxSelect = bookingSection.locator('select').first();
    await paxSelect.selectOption('4');

    const vehSelect = bookingSection.locator('select').nth(1);
    await vehSelect.selectOption('dzire');

    // TEST CASE A: Up to 24 Hours (15 hrs same day return) -> 100% INCLUSIVE
    await pickupDate.fill('2026-10-15T06:00');
    await returnDate.fill('2026-10-15T21:00');

    // Hero price: ₹ 6,000 All-Inclusive Fixed Fare
    await expect(bookingSection.locator('.text-3xl, .text-4xl').first()).toHaveText('₹ 6,000');
    await expect(bookingSection.getByText('✓ All-Inclusive Fixed Fare')).toBeVisible();
    await expect(bookingSection.getByText('Covers FASTag Tolls + AP Permit + Hill Climb + Driver Bata + Parking')).toBeVisible();
    await expect(bookingSection.getByText('~320 km Round Trip')).toBeVisible();
    await expect(bookingSection.getByText('Ghat Road Paid')).not.toBeVisible();

    // Check breakdown rows for <= 24 Hours
    const breakdownToggle = bookingSection.locator('button:has-text("View Itemized Fare Breakdown")');
    await breakdownToggle.scrollIntoViewIfNeeded();
    await breakdownToggle.click();
    await expect(bookingSection.getByText('INCLUDED (₹0)').first()).toBeVisible();

    // TEST CASE B: 25 Hours (1 Day + 1 hr) -> Monotonic extension past 24 hrs (₹ 6,150) -> Transparent Multi-Day Tariff
    await returnDate.fill('2026-10-16T07:00'); // 25 hrs
    await expect(bookingSection.locator('.text-3xl, .text-4xl').first()).toHaveText('₹ 6,150');
    await expect(bookingSection.getByText('✓ Multi-Day Tariff')).toBeVisible();
    await expect(bookingSection.getByText('Covers Cab, Hill Climb & Driver Bata • Tolls & AP Permit (~₹1,100)')).toBeVisible();
    await expect(bookingSection.getByText('~320 km Round Trip')).toBeVisible();
    await expect(bookingSection.getByText('Hill Climb Included')).not.toBeVisible();
    await expect(bookingSection.getByText('~₹950 (Direct at Plazas)')).toBeVisible();
    await expect(bookingSection.getByText('~₹150 (Direct at Counter)')).toBeVisible();
    await bookingSection.screenshot({ path: 'tests/tirupati_24hr_simplified.png' });

    // TEST CASE C: 48 Hours (2 Days Package) -> ₹ 9,500 -> Multi-Day Tariff
    await returnDate.fill('2026-10-17T06:00'); // 48 hrs
    await expect(bookingSection.locator('.text-3xl, .text-4xl').first()).toHaveText('₹ 9,500');
    await expect(bookingSection.getByText('✓ Multi-Day Tariff')).toBeVisible();

    // TEST CASE D: 51 Hours (2 Days + 3 hrs) -> Pro-Rata Overage (₹ 9,500 + ₹ 450 = ₹ 9,950) -> Multi-Day Tariff
    await returnDate.fill('2026-10-17T09:00'); // 51 hrs
    await expect(bookingSection.locator('.text-3xl, .text-4xl').first()).toHaveText('₹ 9,950');
    await expect(bookingSection.getByText('✓ Multi-Day Tariff')).toBeVisible();

    // TEST CASE E: 72 Hours (3 Days Package) -> ₹ 13,200 -> Multi-Day Tariff
    await returnDate.fill('2026-10-18T06:00'); // 72 hrs
    await expect(bookingSection.locator('.text-3xl, .text-4xl').first()).toHaveText('₹ 13,200');
    await expect(bookingSection.getByText('✓ Multi-Day Tariff')).toBeVisible();

    // Verify WhatsApp link mentions tolls & AP permit ballpark and correct fare
    const waBtn = bookingSection.locator('a[data-direct-whatsapp="true"]').first();
    const waHref = await waBtn.getAttribute('href');
    expect(waHref).toContain('Multi-Day');
    expect(waHref).toContain('13%2C200');
  });
});
