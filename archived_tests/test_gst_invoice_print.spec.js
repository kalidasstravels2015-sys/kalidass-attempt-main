import { test, expect } from '@playwright/test';
import fs from 'fs';

test('GST Trip Estimate printable PDF letterhead verification', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/services/tirupati-package/', { waitUntil: 'networkidle' });

  // Locate booking engine
  const bookingSection = page.locator('#booking');
  await bookingSection.scrollIntoViewIfNeeded();

  // Fill in pickup location
  const pickupInput = bookingSection.locator('input[placeholder*="pickup address in Chennai"]');
  await pickupInput.fill('Pallavaram, Chennai');

  // Fill in dates
  const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
  const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);
  await pickupDate.fill('2026-10-10T06:00');
  await returnDate.fill('2026-10-10T21:00');

  // Select Passengers & Vehicle
  const paxSelect = bookingSection.locator('select').first();
  await paxSelect.selectOption('4');

  const vehSelect = bookingSection.locator('select').nth(1);
  await vehSelect.selectOption('dzire');

  // Switch to GST Tax Invoice / Estimate mode
  const gstBtn = bookingSection.locator('button:has-text("GST Tax Invoice")');
  await gstBtn.click();

  // Expand itemized breakdown and open proforma dialog
  await bookingSection.locator('button:has-text("Itemized Fare Breakdown")').click();
  const viewProformaBtn = bookingSection.locator('button:has-text("View Full Government Format Proforma Letterhead")');
  await viewProformaBtn.click();

  // Wait for dialog
  const modal = page.locator('#gst-invoice-portal-root');
  await expect(modal).toBeVisible();

  // Fill corporate B2B details
  const companyInput = modal.locator('input[placeholder*="Acme Corp"]');
  await companyInput.fill('Infosys BPM Limited');

  const gstinInput = modal.locator('input[placeholder*="33AAAAA"]');
  await gstinInput.fill('29AABCI1234F1ZP');

  const phoneInput = modal.locator('input[type="tel"]');
  await phoneInput.fill('9840012345');

  // Check that the new "Print / Save PDF" button is visible
  const printBtn = modal.locator('button:has-text("Print / Save PDF")');
  await expect(printBtn).toBeVisible();

  // 1. Verify that body has .modal-invoice-open
  const hasModalClass = await page.evaluate(() => document.body.classList.contains('modal-invoice-open'));
  expect(hasModalClass).toBe(true);

  // Stub window.print to prevent headless Firefox print dialog lock
  await page.evaluate(() => {
    window.print = () => {};
  });

  // 2. Intercept iframe creation when clicking Print / Save PDF
  const capturedHtml = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.tagName === 'IFRAME' && node.getAttribute('title')?.includes('Print Letterhead')) {
              try {
                if (node.contentWindow) {
                  node.contentWindow.print = () => {};
                }
              } catch (e) {}
              setTimeout(() => {
                const doc = node.contentWindow?.document;
                if (node.contentWindow) {
                  try { node.contentWindow.print = () => {}; } catch (e) {}
                }
                if (doc) {
                  resolve(doc.documentElement.outerHTML);
                }
              }, 100);
            }
          }
        }
      });
      observer.observe(document.body, { childList: true });

      // Click the button
      const btn = document.querySelector('#gst-invoice-portal-root button[title*="Print / Save Official PDF Letterhead"]');
      if (btn) btn.click();
    });
  });

  // Verify User Requirements:
  // 1. Top bar removed: GST-INV-01 should NOT be present
  expect(capturedHtml).not.toContain('GST-INV-01');
  expect(capturedHtml).not.toContain('FORM GST-INV-01');
  expect(capturedHtml).not.toContain('FORMAL TAX INVOICE PROFORMA');

  // 2. Text "Kalidass Travels" heading removed (only image logo used)
  expect(capturedHtml).not.toContain('<h1>KALIDASS TRAVELS</h1>');
  expect(capturedHtml).toContain('class="brand-logo"');

  // 3. Document is an estimate, not a tax invoice
  expect(capturedHtml).toContain('PROFORMA TRIP ESTIMATE &amp; GST BREAKDOWN');
  expect(capturedHtml).toContain('NET ESTIMATE PAYABLE');

  // 4. Estimate number format: CT/EST/1026/101
  expect(capturedHtml).toContain('CT/EST/');
  expect(capturedHtml).toMatch(/CT\/EST\/1026\/\d+/);

  // 5. Client & GSTIN particulars
  expect(capturedHtml).toContain('33COVPM0531D1Z4');
  expect(capturedHtml).toContain('Infosys BPM Limited');
  expect(capturedHtml).toContain('29AABCI1234F1ZP');
  expect(capturedHtml).toContain('SAC CODE: 9966');
  expect(capturedHtml).toContain('STATUTORY GST TAX COMPUTATION');
  expect(capturedHtml).toContain('Authorized Signatory');

  // 3. Render this captured official letterhead HTML as a standalone PDF and check page count
  const letterheadPage = await page.context().newPage();
  await letterheadPage.setContent(capturedHtml, { waitUntil: 'load' });
  await letterheadPage.screenshot({ path: 'tests/official_gst_estimate_letterhead.png' });

  if (browserName === 'chromium') {
    const pdfBuffer = await letterheadPage.pdf({
      format: 'A4',
      margin: { top: '8mm', bottom: '8mm', left: '10mm', right: '10mm' },
      printBackground: true
    });
    fs.writeFileSync('tests/official_gst_estimate_letterhead.pdf', pdfBuffer);

    // Verify page count is EXACTLY 1
    const pdfStr = pdfBuffer.toString('latin1');
    const pageMatches = pdfStr.match(/\/Type\s*\/Page[^s]/g);
    const pageCount = pageMatches ? pageMatches.length : 0;
    console.log(`✔ Official GST Trip Estimate Letterhead PDF Page Count: ${pageCount}`);
    expect(pageCount).toBe(1);
  }
  await letterheadPage.close();

  // 4. Test Closing Modal removes class
  const closeBtn = modal.locator('button:has-text("Close")');
  await closeBtn.click();
  await expect(modal).not.toBeVisible();
  const modalClassAfterClose = await page.evaluate(() => document.body.classList.contains('modal-invoice-open'));
  expect(modalClassAfterClose).toBe(false);

  console.log('✔ All GST estimate printable letterhead assertions passed successfully!');
});
