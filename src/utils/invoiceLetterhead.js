/**
 * Kalidass Travels - Official Trip Fare Estimate & GST Proforma Generator
 * SAC Code: 9966 (Passenger Road Transport Services / Rent-a-cab)
 * Supplier GSTIN: 33COVPM0531D1Z4
 * Number Format: CT/EST/MMYY/101 (Chennai to Tirupati / Estimate / MonthYear / Starting serial 101)
 */

import { KALIDASS_LOGO_BASE64 } from './brandLogoBase64.js';

export function getEstimateRefNo(pickupDateTime) {
  const now = new Date();
  const d = pickupDateTime && !isNaN(new Date(pickupDateTime).getTime()) ? new Date(pickupDateTime) : now;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const y = String(d.getFullYear()).slice(-2);
  const my = `${m}${y}`;
  const offset = pickupDateTime ? Math.abs(parseInt(pickupDateTime.replace(/[^0-9]/g, '').slice(-2), 10) || 0) : 0;
  const serial = 101 + (offset % 899);
  return `CT/EST/${my}/${serial}`;
}

export function generateInvoiceLetterheadHtml(data = {}) {
  const {
    needGst = true,
    invoiceRefNo = 'CT/EST/1026/101',
    issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    placeOfSupply = '33 - Tamil Nadu',
    companyName = '',
    customerGst = '',
    customerPhone = '',
    recipientStateName = 'Tamil Nadu',
    rawStateCode = '33',
    isIntraState = true,
    pickup = 'Doorstep Pickup, Chennai',
    pickupDateTime = '',
    returnDateTime = '',
    vehicleName = 'Swift Dzire AC Sedan',
    passengers = 4,
    durationLabel = '1 Day (15 hrs)',
    taxableAmount = 6000,
    vehicleHireFare = 5500,
    driverBata = 500,
    isNightBatta = false,
    cgst = 150,
    sgst = 150,
    igst = 0,
    totalGst = 300,
    finalNetPayable = 6300,
    grandTotalInWords = '',
    tourRoute = 'Chennai ⇄ Tirupati Pilgrimage',
    serviceDescription = 'Round-Trip Pilgrimage (Doorstep Chennai Pickup ⇄ Drop)'
  } = data;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kalidasstravels.in';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Trip Fare Estimate - ${invoiceRefNo} - Kalidass Travels</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 10mm 10mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #0f172a;
      background: #ffffff;
      padding: 4mm 0 0 0;
    }
    .letterhead {
      border: 1.5px solid #0f2942;
      border-radius: 6px;
      overflow: hidden;
      background: #ffffff;
    }

    /* Brand Letterhead Header - Clean without top bar */
    .brand-header {
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f2942;
      background: #f8fafc;
    }
    .brand-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-logo {
      height: 52px;
      width: auto;
      max-width: 220px;
      object-fit: contain;
      display: block;
    }
    .brand-details .tagline {
      font-size: 9.5px;
      font-weight: 700;
      color: #b45309;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .brand-details .address {
      font-size: 9px;
      color: #475569;
      margin-top: 3px;
      line-height: 1.3;
    }
    .brand-right {
      text-align: right;
      font-size: 9.5px;
      color: #334155;
      line-height: 1.35;
    }
    .brand-right .gstin-badge {
      display: inline-block;
      background: #0f2942;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-weight: 700;
      font-size: 11px;
      margin-bottom: 2px;
    }

    /* Document Title Banner */
    .doc-banner {
      background: #f1f5f9;
      border-bottom: 1.5px solid #cbd5e1;
      padding: 7px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .doc-banner h2 {
      font-size: 13px;
      font-weight: 800;
      color: #0f2942;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .doc-banner .rule-cite {
      font-size: 9px;
      color: #64748b;
      font-weight: 500;
    }

    /* Meta Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-bottom: 1px solid #cbd5e1;
    }
    .meta-box {
      padding: 8px 12px;
      font-size: 9.5px;
    }
    .meta-box:first-child {
      border-right: 1px solid #cbd5e1;
    }
    .meta-heading {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 3px;
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 2px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 1.5px 0;
    }
    .meta-label {
      color: #64748b;
      font-weight: 500;
    }
    .meta-val {
      font-weight: 700;
      color: #0f172a;
    }

    /* Journey Bar */
    .journey-bar {
      background: #f8fafc;
      border-bottom: 1px solid #cbd5e1;
      padding: 6px 12px;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 8px;
      font-size: 9px;
    }
    .journey-item span {
      display: block;
      color: #64748b;
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .journey-item strong {
      color: #0f172a;
      font-size: 9.5px;
    }

    /* Tables */
    .section-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f2942;
      background: #f1f5f9;
      padding: 4px 12px;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
    }
    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
    }
    table.invoice-table th {
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8.5px;
      padding: 5px 8px;
      border-bottom: 1.5px solid #cbd5e1;
      border-right: 1px solid #e2e8f0;
      text-align: left;
    }
    table.invoice-table th:last-child {
      border-right: none;
    }
    table.invoice-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    table.invoice-table td:last-child {
      border-right: none;
    }
    table.invoice-table tr:last-child td {
      border-bottom: none;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }

    /* Summary & Total Section */
    .summary-section {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      border-top: 1.5px solid #cbd5e1;
    }
    .summary-left {
      padding: 8px 12px;
      border-right: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .amount-words-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 6px 8px;
      margin-bottom: 6px;
    }
    .amount-words-box .lbl {
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 2px;
    }
    .amount-words-box .words {
      font-size: 9.5px;
      font-weight: 700;
      color: #0f2942;
      font-style: italic;
    }
    .bank-details {
      font-size: 8.5px;
      color: #475569;
      line-height: 1.35;
    }
    .bank-details strong { color: #0f172a; }

    .summary-right {
      padding: 8px 12px;
      background: #fcfcfd;
    }
    .sum-row {
      display: flex;
      justify-content: space-between;
      padding: 2.5px 0;
      font-size: 9.5px;
    }
    .sum-row.grand-total {
      border-top: 2px solid #0f2942;
      margin-top: 4px;
      padding-top: 5px;
      font-size: 13px;
      font-weight: 900;
      color: #059669;
    }
    .sum-row.advance-row {
      border-top: 1px dashed #cbd5e1;
      margin-top: 3px;
      padding-top: 3px;
      font-size: 9px;
      color: #64748b;
    }

    /* Terms & Signature */
    .footer-bar {
      border-top: 1.5px solid #0f2942;
      background: #ffffff;
      padding: 7px 12px;
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 12px;
    }
    .terms-box {
      font-size: 8px;
      color: #475569;
      line-height: 1.35;
    }
    .terms-box h4 {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f2942;
      margin-bottom: 2px;
    }
    .sig-box {
      text-align: center;
      border: 1px dashed #cbd5e1;
      border-radius: 4px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 56px;
      background: #f8fafc;
    }
    .sig-box .comp {
      font-size: 9px;
      font-weight: 800;
      color: #0f2942;
    }
    .sig-box .role {
      font-size: 8px;
      font-weight: 600;
      color: #64748b;
      border-top: 1px solid #cbd5e1;
      padding-top: 2px;
    }

    /* Footnote */
    .footnote {
      text-align: center;
      font-size: 7.5px;
      color: #94a3b8;
      padding: 4px;
      border-top: 1px solid #f1f5f9;
      background: #ffffff;
    }
  </style>
</head>
<body>
  <div class="letterhead">
    <!-- Official Brand Letterhead Header (Clean logo, no text duplicate, no top bar) -->
    <div class="brand-header">
      <div class="brand-left">
        <img 
          src="${KALIDASS_LOGO_BASE64}" 
          alt="Kalidass Travels" 
          class="brand-logo"
        />
        <div class="brand-details">
          <div class="tagline">24/7 Fleet Mobility • Reliable Chennai &amp; Outstation Cab Services</div>
          <div class="address">
            Regd Office: No. 12, Pammal Main Road, Pallavaram, Chennai, Tamil Nadu - 600075<br />
            Mobile: +91 89395 39211 • Email: info@kalidasstravels.com • Web: https://kalidasstravels.in
          </div>
        </div>
      </div>
      <div class="brand-right">
        <div class="gstin-badge">GSTIN: 33COVPM0531D1Z4</div>
        <div>State: <strong>Tamil Nadu (Code: 33)</strong></div>
        <div>PAN: <strong>COVPM0531D</strong></div>
        <div style="color: #059669; font-weight: 700; font-size: 9px; margin-top: 2px;">✓ 100% ITC TAX CREDIT ELIGIBLE</div>
      </div>
    </div>

    <!-- Document Heading Banner -->
    <div class="doc-banner">
      <div>
        <h2>${needGst ? 'PROFORMA TRIP ESTIMATE & GST BREAKDOWN' : 'TRIP FARE ESTIMATE & PASSENGER BILL'}</h2>
        <div class="rule-cite">SAC Code: 9966 Passenger Road Transport • Official Proforma Quotation</div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 9px; color: #475569;">Estimate Ref No:</span>
        <strong style="font-family: monospace; font-size: 11.5px; color: #0f2942; display: block;">${invoiceRefNo}</strong>
      </div>
    </div>

    <!-- 2-Column Meta Grid -->
    <div class="meta-grid">
      <!-- Left: Recipient / Billed To -->
      <div class="meta-box">
        <div class="meta-heading">BILLED TO / RECIPIENT PARTICULARS</div>
        <div class="meta-row">
          <span class="meta-label">Client / Entity:</span>
          <span class="meta-val">${companyName || (needGst ? 'Corporate Guest' : 'Passenger Devotee')}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Recipient GSTIN:</span>
          <span class="meta-val font-mono">${customerGst || (needGst ? 'Unregistered / To Be Provided' : 'Unregistered (Consumer B2C)')}</span>
        </div>
        ${customerPhone ? `
        <div class="meta-row">
          <span class="meta-label">Contact Mobile:</span>
          <span class="meta-val font-mono">${customerPhone}</span>
        </div>
        ` : ''}
        <div class="meta-row">
          <span class="meta-label">State / UT:</span>
          <span class="meta-val">${recipientStateName} (State Code: ${rawStateCode || '33'})</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Estimate Category:</span>
          <span class="meta-val" style="color: #059669;">${needGst ? 'GST Proforma Estimate (ITC Eligible)' : 'Standard Passenger Estimate'}</span>
        </div>
      </div>

      <!-- Right: Estimate Metadata -->
      <div class="meta-box">
        <div class="meta-heading">ESTIMATE &amp; SUPPLY METADATA</div>
        <div class="meta-row">
          <span class="meta-label">Estimate Date:</span>
          <span class="meta-val">${issueDate}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Place of Supply:</span>
          <span class="meta-val" style="color: #0f2942;">${placeOfSupply}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Tax Payable on Reverse Charge:</span>
          <span class="meta-val">No (Forward Charge)</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Supply Type:</span>
          <span class="meta-val">${isIntraState ? 'Intra-State (Tamil Nadu ⇄ Tamil Nadu)' : 'Inter-State Supply'}</span>
        </div>
      </div>
    </div>

    <!-- Journey Bar -->
    <div class="journey-bar">
      <div class="journey-item">
        <span>Tour Route &amp; Pickup Area</span>
        <strong>${tourRoute} • ${pickup || 'Doorstep Pickup, Chennai'}</strong>
      </div>
      <div class="journey-item">
        <span>Vehicle Allocated</span>
        <strong>${vehicleName}</strong>
      </div>
      <div class="journey-item">
        <span>Departure &amp; Return</span>
        <strong>${durationLabel} (${passengers} Pax)</strong>
      </div>
      <div class="journey-item">
        <span>Trip Schedule</span>
        <strong>${pickupDateTime || 'Confirmed on booking'}</strong>
      </div>
    </div>

    <!-- ANNEXURE A: Table of Services -->
    <div class="section-title">
      <span>ANNEXURE A: SCHEDULE OF SERVICES (SAC CODE: 9966)</span>
      <span>ALL VALUES IN INDIAN RUPEES (INR)</span>
    </div>
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width: 25px;" class="text-center">#</th>
          <th>Description of Service &amp; Particulars</th>
          <th style="width: 50px;" class="text-center">SAC</th>
          <th style="width: 70px;" class="text-center">Duration</th>
          <th style="width: 85px;" class="text-right">Taxable Value (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center font-bold" style="color: #64748b;">1</td>
          <td>
            <strong>Dedicated AC Vehicle Hire &amp; 100% Fuel Charges (${vehicleName})</strong><br>
            <span style="font-size: 8px; color: #64748b;">${serviceDescription}</span>
          </td>
          <td class="text-center font-mono font-bold">9966</td>
          <td class="text-center">${durationLabel}</td>
          <td class="text-right font-bold">₹${Number(vehicleHireFare || 0).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td class="text-center font-bold" style="color: #64748b;">2</td>
          <td>
            <strong>Chauffeur Outstation Duty Allowance &amp; Halting Batta</strong><br>
            <span style="font-size: 8px; color: #64748b;">Professional Chauffeur (Pilgrim dorm rests; no guest hotel stay needed)</span>
          </td>
          <td class="text-center font-mono font-bold">9966</td>
          <td class="text-center">1 Duty</td>
          <td class="text-right font-bold">₹${Number(driverBata || 0).toLocaleString('en-IN')}</td>
        </tr>
        ${isNightBatta ? `
        <tr>
          <td class="text-center font-bold" style="color: #b45309;">3</td>
          <td>
            <strong>Late Night Shift Driving Allowance (11:00 PM – 4:00 AM)</strong>
          </td>
          <td class="text-center font-mono font-bold">9966</td>
          <td class="text-center">1 Shift</td>
          <td class="text-right font-bold">₹400</td>
        </tr>
        ` : ''}
        <tr>
          <td class="text-center font-bold" style="color: #64748b;">${isNightBatta ? '4' : '3'}</td>
          <td>
            <strong>Statutory NH FASTag Highway Tolls &amp; AP Interstate Border Tax Permit</strong><br>
            <span style="font-size: 8px; color: #64748b;">National Highway toll plazas &amp; Andhra Pradesh passenger road levy (Pure Agent)</span>
          </td>
          <td class="text-center font-mono font-bold">9966</td>
          <td class="text-center">Round Trip</td>
          <td class="text-right font-bold" style="color: #059669;">INCLUDED</td>
        </tr>
      </tbody>
    </table>

    ${needGst ? `
    <!-- ANNEXURE B: GST Computation Breakdown -->
    <div class="section-title">
      <span>ANNEXURE B: STATUTORY GST TAX COMPUTATION (SECTION 9 CGST / SECTION 5 IGST)</span>
      <span>INPUT TAX CREDIT ELIGIBLE</span>
    </div>
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width: 45px;" class="text-center" rowspan="2">SAC</th>
          <th style="width: 85px;" class="text-right" rowspan="2">Taxable Value</th>
          <th colspan="2" class="text-center">Central Tax (CGST)</th>
          <th colspan="2" class="text-center">State Tax (SGST)</th>
          <th colspan="2" class="text-center">Integrated Tax (IGST)</th>
          <th style="width: 85px;" class="text-right" rowspan="2">Total GST (₹)</th>
        </tr>
        <tr>
          <th style="width: 40px;" class="text-center">Rate</th>
          <th style="width: 55px;" class="text-right">Amt (₹)</th>
          <th style="width: 40px;" class="text-center">Rate</th>
          <th style="width: 55px;" class="text-right">Amt (₹)</th>
          <th style="width: 40px;" class="text-center">Rate</th>
          <th style="width: 55px;" class="text-right">Amt (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center font-mono font-bold">9966</td>
          <td class="text-right font-bold">₹${Number(taxableAmount || 0).toLocaleString('en-IN')}</td>
          <td class="text-center">${isIntraState ? '2.5%' : '-'}</td>
          <td class="text-right font-semibold">${isIntraState ? `₹${Number(cgst || 0).toLocaleString('en-IN')}` : '-'}</td>
          <td class="text-center">${isIntraState ? '2.5%' : '-'}</td>
          <td class="text-right font-semibold">${isIntraState ? `₹${Number(sgst || 0).toLocaleString('en-IN')}` : '-'}</td>
          <td class="text-center">${!isIntraState ? '5.0%' : '-'}</td>
          <td class="text-right font-semibold">${!isIntraState ? `₹${Number(igst || 0).toLocaleString('en-IN')}` : '-'}</td>
          <td class="text-right font-bold" style="color: #0f2942;">₹${Number(totalGst || 0).toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>
    ` : ''}

    <!-- Summary & Totals -->
    <div class="summary-section">
      <!-- Left: In Words & Bank Details -->
      <div class="summary-left">
        <div class="amount-words-box">
          <div class="lbl">Total Estimate Amount in Words:</div>
          <div class="words">${grandTotalInWords || ''}</div>
        </div>
        <div class="bank-details">
          <strong>BANK &amp; DIGITAL PAYMENT DETAILS:</strong><br>
          Bank: <strong>Axis Bank, Pallavaram Branch</strong> | A/C Name: <strong>Kalidass Travels</strong><br>
          Current A/C: <strong>921020054321987</strong> | IFSC: <strong>UTIB0000123</strong><br>
          Direct UPI / GPay / PhonePe: <strong>8939539211@okaxis</strong>
        </div>
      </div>

      <!-- Right: Numerical Totals -->
      <div class="summary-right">
        <div class="sum-row">
          <span>Total Taxable Value:</span>
          <strong>₹${Number(taxableAmount || 0).toLocaleString('en-IN')}</strong>
        </div>
        ${needGst ? `
        <div class="sum-row" style="color: #0f2942;">
          <span>Total GST Tax (${isIntraState ? '2.5% CGST + 2.5% SGST' : '5% IGST'}):</span>
          <strong>+₹${Number(totalGst || 0).toLocaleString('en-IN')}</strong>
        </div>
        ` : ''}
        <div class="sum-row advance-row">
          <span>Advance Deposit Required:</span>
          <strong style="color: #059669;">₹0 (ZERO ADVANCE)</strong>
        </div>
        <div class="sum-row grand-total">
          <span>NET ESTIMATE PAYABLE:</span>
          <span>₹${Number(finalNetPayable || taxableAmount || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>

    <!-- Statutory Terms & Signatures -->
    <div class="footer-bar">
      <div class="terms-box">
        <h4>Terms &amp; Booking Conditions:</h4>
        1. This document is an official trip fare estimate &amp; GST proforma quotation issued for journey planning.<br>
        2. 100% Eligible for Input Tax Credit (ITC) for business travel under Section 16 &amp; 17(5) of the CGST Act upon final billing.<br>
        3. Tirumala Special Entry Darshan (₹300) tickets to be booked directly by devotees via official TTD portal.<br>
        4. Settlement to chauffeur or via company UPI upon successful trip completion.
      </div>
      <div class="sig-box">
        <div class="comp">For KALIDASS TRAVELS</div>
        <div style="font-size: 8px; color: #059669; font-weight: 700;">[ Digitally Signed Estimate ]</div>
        <div class="role">Authorized Signatory</div>
      </div>
    </div>

    <!-- Footnote -->
    <div class="footnote">
      Official System-Generated Trip Estimate • Kalidass Travels (GSTIN: 33COVPM0531D1Z4) • Chennai, Tamil Nadu • Generated on ${issueDate}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Prints or saves the official trip estimate letterhead as a vector PDF.
 * Uses an isolated hidden iframe to guarantee zero interference from parent webpage components.
 */
export function printInvoiceLetterhead(data = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const letterheadHtml = generateInvoiceLetterheadHtml(data);

  // Create isolated printing iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('title', 'Trip Estimate Print Letterhead');
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(letterheadHtml);
    doc.close();

    // Ensure document and inline assets are ready before printing
    const triggerPrint = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Iframe print error, falling back to window.print():', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    };

    if (doc.readyState === 'complete') {
      setTimeout(triggerPrint, 150);
    } else {
      iframe.contentWindow.onload = () => setTimeout(triggerPrint, 150);
      setTimeout(triggerPrint, 400);
    }
  } catch (e) {
    console.error('Print iframe init error:', e);
    window.print();
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  }
}

/**
 * Downloads the official trip estimate document as a standalone offline HTML/PDF package.
 */
export function downloadEstimateDocument(data = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const letterheadHtml = generateInvoiceLetterheadHtml(data);
  const blob = new Blob([letterheadHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeRef = (data.invoiceRefNo || 'CT_EST').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.href = url;
  a.download = `Kalidass_Travels_Estimate_${safeRef}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

