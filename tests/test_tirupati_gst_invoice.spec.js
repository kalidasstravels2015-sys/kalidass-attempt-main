import { test, expect } from '@playwright/test';

test('Verify GST Tax Invoice mode with dynamic recipient state detection on card', async ({ page }) => {
  // Desktop viewport
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

  // Locate booking engine
  const bookingSection = page.locator('#booking');
  await bookingSection.scrollIntoViewIfNeeded();

  // Fill in pickup location
  const pickupInput = bookingSection.locator('input[placeholder*="pickup address in Chennai"]');
  await pickupInput.fill('Pallavaram, Chennai');

  // Fill in single-day round trip dates
  const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
  const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);
  await pickupDate.fill('2026-10-15T06:00');
  await returnDate.fill('2026-10-15T21:00'); // 15 hrs (Same day return before 11 PM)

  // Select Passengers & Sedan
  const paxSelect = bookingSection.locator('select').first();
  await paxSelect.selectOption('4');

  const vehSelect = bookingSection.locator('select').nth(1);
  await vehSelect.selectOption('dzire');

  // Verify Initial Calm Cash State: ₹ 6,000 All-Inclusive
  await expect(bookingSection.locator('.text-3xl, .text-4xl').first()).toHaveText('₹ 6,000');
  await expect(bookingSection.locator('a[data-direct-whatsapp="true"]').first()).toHaveText('Book on WhatsApp');

  // Check GST Tax Invoice checkbox -> automatically switches to ₹ 6,300 in place with GST inclusions and itemized breakdown
  const gstCheckbox = bookingSection.locator('input[type="checkbox"]');
  await expect(gstCheckbox).toBeVisible();
  await gstCheckbox.check();

  // Verify in-place card update
  await expect(bookingSection.locator('.text-3xl, .text-4xl').first()).toHaveText('₹ 6,300');
  await expect(bookingSection.getByText('Covers FASTag Tolls + AP Permit + Ghat Climb + Driver Bata + 5% GST')).toBeVisible();

  // GST breakdown is automatically revealed upon checking
  await expect(bookingSection.getByText('Total GST Tax Added (5%):')).toBeVisible();
  await expect(bookingSection.getByText('+₹300')).toBeVisible();
  await expect(bookingSection.getByText('100% Claimable (-₹300)')).toBeVisible();

  // 1. Verify Default Intra-State (Tamil Nadu) Tax Calculation in itemized breakdown
  await expect(bookingSection.getByText('CGST @ 2.5% (SAC 9966):')).toBeVisible();
  await expect(bookingSection.getByText('SGST @ 2.5% (SAC 9966):')).toBeVisible();

  // 2. Test Inter-State B2B Client (Karnataka GSTIN 29...) in progressive disclosure form
  const companyInput = bookingSection.locator('input[placeholder*="Infosys BPM Ltd"]');
  await expect(companyInput).toBeVisible();
  await companyInput.fill('Infosys BPM Limited');

  const gstinInput = bookingSection.locator('input[placeholder*="33AAAAA0000A1Z5"]');
  await expect(gstinInput).toBeVisible();
  await gstinInput.fill('29AABCI1234F1ZP'); // Karnataka 29

  const phoneInput = bookingSection.locator('input[placeholder*="98400 12345"]');
  await expect(phoneInput).toBeVisible();
  await phoneInput.fill('98400 12345');

  // Verify dynamic detection updates in real time on the card badge
  await expect(bookingSection.getByText('Inter-State (29 - Karnataka): IGST @ 5.0%')).toBeVisible();
  await expect(bookingSection.getByText('✓ ITC Claimable')).toBeVisible();

  // Capture Desktop Screenshot with Inter-State (Karnataka 29 IGST)
  await page.screenshot({ path: 'tests/gst_invoice_desktop_interstate.png' });
  console.log('✔ Captured tests/gst_invoice_desktop_interstate.png');

  // Verify WhatsApp URL contains recipient firm and GSTIN
  const waBtn = bookingSection.locator('a[data-direct-whatsapp="true"]').first();
  const waHref = await waBtn.getAttribute('href');
  expect(waHref).toContain('Infosys%20BPM%20Limited');
  expect(waHref).toContain('29AABCI1234F1ZP');
});

test('Verify Book on WhatsApp button does NOT trigger old enquiry modal (#bookingEnquiryModal)', async ({ page }) => {
  // Mobile viewport matching user screenshot
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

  const bookingSection = page.locator('#booking');
  await bookingSection.scrollIntoViewIfNeeded();

  // Fill in pickup location
  const pickupInput = bookingSection.locator('input[placeholder*="pickup address in Chennai"]');
  await pickupInput.fill('Medavakkam, Chennai');

  // Fill in dates
  const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
  const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);
  await pickupDate.fill('2026-10-15T06:00');
  await returnDate.fill('2026-10-15T21:00');

  // Select Passengers & Vehicle
  const paxSelect = bookingSection.locator('select').first();
  await paxSelect.selectOption('4');

  const vehSelect = bookingSection.locator('select').nth(1);
  await vehSelect.selectOption('dzire');

  // Verify Book on WhatsApp button on the booking card (clean CTA text)
  const cardWaBtn = bookingSection.locator('a[data-direct-whatsapp="true"]').first();
  await expect(cardWaBtn).toBeVisible();
  await expect(cardWaBtn).toHaveText(/Book on WhatsApp/);
  const cardHref = await cardWaBtn.getAttribute('href');
  expect(cardHref).toContain('wa.me');

  // Old enquiry modal must NOT be open before click
  const oldModal = page.locator('#bookingEnquiryModal');
  await expect(oldModal).not.toHaveAttribute('open', '');

  // Click the card's WhatsApp button (force true to bypass overlays)
  await cardWaBtn.click({ force: true });

  // Old enquiry modal MUST STILL NOT BE OPEN after click
  await expect(oldModal).not.toHaveAttribute('open', '');
  await expect(page.locator('text=Instant Cab Booking Request')).toBeHidden();

  // Capture screenshot confirming no unwanted modal overlay
  await page.screenshot({ path: 'tests/post_booking_no_unwanted_modal.png' });
  console.log('✔ Verified: No unwanted modal appeared upon clicking Book on WhatsApp!');
});

test('Capture mobile card screenshots for Standard Cash and GST Tax Invoice modes', async ({ page }) => {
  // Mobile Pixel 7 viewport (412 x 915)
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

  const bookingSection = page.locator('#booking');
  await bookingSection.scrollIntoViewIfNeeded();

  // Fill in booking details
  await bookingSection.locator('input[placeholder*="pickup address in Chennai"]').fill('Avadi, Chennai');
  const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
  const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);
  await pickupDate.fill('2026-10-15T06:00');
  await returnDate.fill('2026-10-15T21:00');

  await bookingSection.locator('select').first().selectOption('4');
  await bookingSection.locator('select').nth(1).selectOption('dzire');

  // Verify Default Cash Mode (₹ 6,000 displayed ONCE as hero text)
  await expect(bookingSection.locator('.text-3xl, .text-4xl').first()).toHaveText('₹ 6,000');
  await expect(bookingSection.locator('a[data-direct-whatsapp="true"]').first()).toHaveText('Book on WhatsApp');

  // Verify removed items are NOT present
  await expect(bookingSection.getByText('Zero Hidden Charges Guarantee')).toHaveCount(0);
  await expect(bookingSection.getByText('Zero Advance Required • Pay Chauffeur After Darshan / Return')).toHaveCount(0);
  await expect(bookingSection.getByText('View Full Government Format Proforma Letterhead')).toHaveCount(0);

  await bookingSection.locator('a[data-direct-whatsapp="true"]').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'tests/card_mode_standard_cash.png' });
  console.log('✔ Captured tests/card_mode_standard_cash.png');

  // Switch to GST Tax Invoice Mode via checkbox
  await bookingSection.locator('input[type="checkbox"]').check();

  // Card now shows GST Mode (₹ 6,300) in place
  await expect(bookingSection.locator('.text-3xl, .text-4xl').first()).toHaveText('₹ 6,300');
  await expect(bookingSection.getByText('Covers FASTag Tolls + AP Permit + Ghat Climb + Driver Bata + 5% GST')).toBeVisible();

  // Verify removed items are NOT present in GST mode
  await expect(bookingSection.getByText('View Full Government Format Proforma Letterhead')).toHaveCount(0);

  // Capture GST Mode hero section
  await bookingSection.locator('.text-3xl, .text-4xl').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'tests/card_mode_gst_invoice_hero.png' });
  console.log('✔ Captured tests/card_mode_gst_invoice_hero.png');

  await bookingSection.locator('a[data-direct-whatsapp="true"]').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'tests/card_mode_gst_invoice.png' });
  console.log('✔ Captured tests/card_mode_gst_invoice.png');
});
