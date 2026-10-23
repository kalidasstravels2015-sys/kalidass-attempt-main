import { test, expect } from '@playwright/test';

test('Verify GST Style Billing with toggle and company GSTIN inputs', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 924 });
  await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

  const bookingSection = page.locator('#booking');
  await bookingSection.scrollIntoViewIfNeeded();

  // 1. Fill Form Fields
  await bookingSection.locator('input[placeholder*="pickup address in Chennai"]').fill('T. Nagar, Chennai');
  await bookingSection.locator('input[type="datetime-local"]').first().fill('2026-10-10T06:00');
  await bookingSection.locator('input[type="datetime-local"]').nth(1).fill('2026-10-10T22:00'); // 1 Day
  await bookingSection.locator('select').first().selectOption('5');
  await bookingSection.locator('select').nth(1).selectOption('ertiga');

  // 2. Open Modal
  const estimateBtn = bookingSection.locator('button:has-text("View Fare Estimate")');
  await estimateBtn.click();

  const modal = page.locator('div[role="dialog"][data-hide-contact-dock]');
  await expect(modal).toBeVisible();

  // Verify regular non-GST bill initially
  await expect(modal.getByText('Trip Fare Estimate Bill')).toBeVisible();
  await expect(modal.getByText('₹ 7,500').first()).toBeVisible();
  await page.screenshot({ path: 'tests/gst_toggle_off_bill.png' });

  // 3. Toggle GST ON
  const gstSwitch = modal.locator('button[role="switch"]');
  await expect(gstSwitch).toBeVisible();
  await gstSwitch.click();

  // 4. Verify GST Mode UI elements
  await expect(modal.getByText('GST Tax Invoice & Estimate')).toBeVisible();
  await expect(modal.getByText('SAC: 9966')).toBeVisible();
  await expect(modal.getByText('GSTIN: 33COVPM0531D1Z4')).toBeVisible();

  // Verify Company & GSTIN inputs
  const companyInput = modal.locator('input[placeholder*="Acme Corp"]');
  const gstinInput = modal.locator('input[placeholder*="33AAAAA"]');
  await expect(companyInput).toBeVisible();
  await expect(gstinInput).toBeVisible();

  await companyInput.fill('Cognizant Technologies Ltd');
  await gstinInput.fill('33aabbc1234d1z5');

  // 5. Verify Tax Computation:
  // Base: ₹7,500 + 5% GST (₹375) = Total ₹7,875
  await expect(modal.getByText('TAXABLE BASE FARE')).toBeVisible();
  await expect(modal.getByText('TOTAL GST (5%)')).toBeVisible();
  await expect(modal.getByText('+₹375')).toBeVisible();
  await expect(modal.getByText('₹ 7,875').first()).toBeVisible();

  // Verify WhatsApp booking button updated to ₹ 7,875
  const waBtn = modal.locator('a:has-text("Book on WhatsApp (₹ 7,875)")');
  await expect(waBtn).toBeVisible();
  const waHref = await waBtn.getAttribute('href');
  expect(waHref).toContain('GST%20Tax%20Invoice');
  expect(waHref).toContain('Cognizant');
  expect(waHref).toContain('33AABBC1234D1Z5');
  expect(waHref).toContain('7%2C875');

  // Capture screenshot of GST Style Invoice
  await page.screenshot({ path: 'tests/gst_style_tax_invoice.png' });
  console.log('✔ GST Style Billing verified cleanly!');
});
