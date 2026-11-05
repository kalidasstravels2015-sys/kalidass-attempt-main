import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateExecutiveQuotationExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Kalidass Travels Chennai';
  workbook.lastModifiedBy = 'Fleet Operations Desk';
  workbook.created = new Date('2026-11-04');
  workbook.modified = new Date('2026-11-04');

  // =========================================================================
  // SHEET 1: FORMAL GST QUOTATION & BOQ (BRAND NEW BS-VI FLEET INCLUSIVE OF EMI)
  // =========================================================================
  const ws = workbook.addWorksheet('Quotation_InvestUP_SIPO', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.35,
        right: 0.35,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2
      }
    },
    views: [{ showGridLines: true }]
  });

  // Column widths
  ws.columns = [
    { key: 'A', width: 6 },   // Item
    { key: 'B', width: 33 },  // Vehicle & Grade
    { key: 'C', width: 11 },  // SAC Code
    { key: 'D', width: 16 },  // Duty Hours & KM
    { key: 'E', width: 16 },  // Taxable Value
    { key: 'F', width: 13 },  // CGST (2.5%)
    { key: 'G', width: 13 },  // SGST (2.5%)
    { key: 'H', width: 14 },  // Total GST (5%)
    { key: 'I', width: 17 }   // Total Landed Amount
  ];

  // Palette & Styles
  const primaryNavy = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  const forestGreen = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } };
  const slateHeader = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const subSectionFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  const zebraLight = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  // Row 1: Main Letterhead
  ws.mergeCells('A1:I1');
  const r1 = ws.getCell('A1');
  r1.value = 'KALIDASS TRAVELS — CHENNAI';
  r1.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF0F172A' } };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 24;

  // Row 2: Subtitle
  ws.mergeCells('A2:I2');
  const r2 = ws.getCell('A2');
  r2.value = 'Commercial Chauffeur & Corporate Mobility Solutions (Est. 2015)';
  r2.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 3: Operating Hubs
  ws.mergeCells('A3:I3');
  const r3 = ws.getCell('A3');
  r3.value = 'Operating Hubs: Guindy / Mount Poonamallee Road / Medavakkam, Chennai, Tamil Nadu - 600 089';
  r3.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } };
  r3.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 4: Contacts
  ws.mergeCells('A4:I4');
  const r4 = ws.getCell('A4');
  r4.value = '24x7 Corporate Operations: +91 89395 39211 | Email: kalidasstravels2015@gmail.com | Web: kalidasstravels.in';
  r4.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF2563EB' } };
  r4.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 5: GSTIN Strip
  ws.mergeCells('A5:I5');
  const r5 = ws.getCell('A5');
  r5.value = 'SUPPLIER GSTIN: 33AAIFK7823P1Z9  |  STATE: TAMIL NADU (CODE: 33)  |  SAC CODE: 996601';
  r5.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  r5.fill = forestGreen;
  r5.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(5).height = 20;

  // Row 6: Spacer
  ws.getRow(6).height = 8;

  // Row 7: Document Title Banner
  ws.mergeCells('A7:I7');
  const r7 = ws.getCell('A7');
  r7.value = 'FORMAL COMMERCIAL GST QUOTATION & BOQ (BRAND NEW BS-VI DEDICATED FLEET)';
  r7.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  r7.fill = primaryNavy;
  r7.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(7).height = 20;

  // Row 8-15: Metadata & To Address
  ws.getRow(8).height = 18;
  ws.mergeCells('A8:D8');
  ws.getCell('A8').value = 'REF NO: KT/SIPO-INVESTUP/2026-27/092';
  ws.getCell('A8').font = { bold: true, size: 9.5 };

  ws.mergeCells('E8:I8');
  ws.getCell('E8').value = 'DATE: November 04, 2026  |  VALIDITY: 30 Days';
  ws.getCell('E8').font = { bold: true, size: 9.5 };
  ws.getCell('E8').alignment = { horizontal: 'right' };

  ws.mergeCells('A9:D9');
  ws.getCell('A9').value = 'TO:';
  ws.getCell('A9').font = { bold: true, size: 9.5, color: { argb: 'FF0F172A' } };

  ws.mergeCells('E9:I9');
  ws.getCell('E9').value = 'PLACE OF SUPPLY: 33 - Tamil Nadu';
  ws.getCell('E9').font = { bold: true, size: 9.5 };
  ws.getCell('E9').alignment = { horizontal: 'right' };

  ws.mergeCells('A10:D10');
  ws.getCell('A10').value = 'The General Manager / State Investment Promotion Officer,';
  ws.getCell('A10').font = { bold: true, size: 9.5 };

  ws.mergeCells('E10:I10');
  ws.getCell('E10').value = 'FLEET COMMITMENT: Brand New / BS-VI Vehicle (< 3 Yrs)';
  ws.getCell('E10').font = { bold: true, size: 9, color: { argb: 'FF047857' } };
  ws.getCell('E10').alignment = { horizontal: 'right' };

  ws.mergeCells('A11:D11');
  ws.getCell('A11').value = 'State Investment Promotion Office (SIPO) Chennai,';
  ws.getCell('A11').font = { bold: true, size: 9.5 };

  ws.mergeCells('E11:I11');
  ws.getCell('E11').value = 'CORRIDOR: KTCC (Kanchipuram, Thiruvallur, Chennai, Chengalpattu)';
  ws.getCell('E11').font = { size: 9 };
  ws.getCell('E11').alignment = { horizontal: 'right' };

  ws.mergeCells('A12:D12');
  ws.getCell('A12').value = 'Invest UP (Government of Uttar Pradesh),';
  ws.getCell('A12').font = { bold: true, size: 9.5, color: { argb: 'FF047857' } };

  ws.mergeCells('E12:I12');
  ws.getCell('E12').value = 'MONTHLY USAGE QUOTA: 2,000 KM / Month';
  ws.getCell('E12').font = { bold: true, size: 9 };
  ws.getCell('E12').alignment = { horizontal: 'right' };

  ws.mergeCells('A13:D13');
  ws.getCell('A13').value = 'Olympia Cyberspace Pvt. Ltd., No. 21 & 22, Arulayiammanpettai,';
  ws.getCell('A13').font = { size: 9 };

  ws.mergeCells('E13:I13');
  ws.getCell('E13').value = 'REPORTING HUB: Olympia Cyberspace, Guindy (Zero Dead KM)';
  ws.getCell('E13').font = { bold: true, size: 9, color: { argb: 'FF047857' } };
  ws.getCell('E13').alignment = { horizontal: 'right' };

  ws.mergeCells('A14:D14');
  ws.getCell('A14').value = '2nd Street, Alandur Road, Guindy, Chennai - 600 032.';
  ws.getCell('A14').font = { size: 9 };

  ws.mergeCells('E14:I14');
  ws.getCell('E14').value = 'COST SCOPE: Wet Lease (Car EMI + Fuel + Chauffeur + Maintenance)';
  ws.getCell('E14').font = { size: 9, bold: true };
  ws.getCell('E14').alignment = { horizontal: 'right' };

  ws.mergeCells('A15:D15');
  ws.getCell('A15').value = 'Email: gmsipo_chennai@investup.org.in | Attn: Logapriya Loks';
  ws.getCell('A15').font = { size: 9, bold: true, color: { argb: 'FF2563EB' } };

  ws.mergeCells('E15:I15');
  ws.getCell('E15').value = 'CLIENT GSTIN: [To be furnished by Invest UP]';
  ws.getCell('E15').font = { size: 9 };
  ws.getCell('E15').alignment = { horizontal: 'right' };

  // Row 16: Subject
  ws.getRow(16).height = 24;
  ws.mergeCells('A16:I16');
  const rSub = ws.getCell('A16');
  rSub.value = 'SUBJECT: Commercial Quotation & BOQ for Monthly Dedicated Hiring of Brand New BS-VI MUV (Maruti Ertiga / Kia Carens) with Chauffeur, Fuel & Complete Capital Maintenance for Invest UP SIPO Chennai.';
  rSub.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
  rSub.fill = subSectionFill;
  rSub.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

  // Row 17: Spacer
  ws.getRow(17).height = 6;

  // Row 18: Section 1 Header
  ws.mergeCells('A18:I18');
  ws.getCell('A18').value = '★ SECTION 1: COMMERCIAL BOQ — BRAND NEW BS-VI VEHICLE (INCLUSIVE OF CAPITAL EMI, FUEL & CHAUFFEUR)';
  ws.getCell('A18').font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A18').fill = slateHeader;

  // Row 19: Headers
  const tableHeaders = [
    'Item',
    'Brand New BS-VI Vehicle Specification',
    'SAC Code',
    'Monthly Duty Slab\n(26 Days / 2000 KM)',
    'Taxable Value (₹)\n(Car EMI+Fuel+Driver)',
    'CGST 2.5% (₹)',
    'SGST 2.5% (₹)',
    'Total GST 5% (₹)',
    'Total Landed Cost (₹)'
  ];
  const r19 = ws.getRow(19);
  tableHeaders.forEach((th, idx) => {
    const cell = r19.getCell(idx + 1);
    cell.value = th;
    cell.fill = primaryNavy;
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: idx >= 4 ? 'right' : 'center', vertical: 'middle', wrapText: true };
    cell.border = borderThin;
  });
  r19.height = 30;

  // Data Rows (New BS6 Vehicle Rates covering EMI)
  // Ertiga: ₹72,000 (8h) / ₹78,000 (12h)
  // Carens: ₹80,000 (8h) / ₹88,000 (12h)
  const boqData = [
    {
      item: '1A',
      desc: 'Maruti Suzuki Ertiga (Brand New BS-VI, Smart Hybrid, AC)\nDedicated 0-KM / Latest Batch | 6+1 Seater | Commercial T-Board',
      sac: '996601',
      slab: '08 Hours / Day\n(26 Days / 2,000 KM)',
      taxable: 72000,
      rowNum: 20
    },
    {
      item: '1B',
      desc: 'Maruti Suzuki Ertiga (Brand New BS-VI, Smart Hybrid, AC)\nDedicated 0-KM / Latest Batch | 6+1 Seater | Commercial T-Board',
      sac: '996601',
      slab: '12 Hours / Day\n(26 Days / 2,000 KM)',
      taxable: 78000,
      rowNum: 21
    },
    {
      item: '2A',
      desc: 'Kia Carens (Brand New BS-VI, Executive Premium MUV, AC)\nDedicated 0-KM / Latest Batch | 6+1 Seater | Commercial T-Board',
      sac: '996601',
      slab: '08 Hours / Day\n(26 Days / 2,000 KM)',
      taxable: 80000,
      rowNum: 22
    },
    {
      item: '2B',
      desc: 'Kia Carens (Brand New BS-VI, Executive Premium MUV, AC)\nDedicated 0-KM / Latest Batch | 6+1 Seater | Commercial T-Board',
      sac: '996601',
      slab: '12 Hours / Day\n(26 Days / 2,000 KM)',
      taxable: 88000,
      rowNum: 23
    }
  ];

  boqData.forEach((row, idx) => {
    const r = ws.getRow(row.rowNum);
    r.getCell(1).value = row.item;
    r.getCell(2).value = row.desc;
    r.getCell(3).value = row.sac;
    r.getCell(4).value = row.slab;
    r.getCell(5).value = row.taxable;
    r.getCell(6).value = { formula: `E${row.rowNum}*0.025` };
    r.getCell(7).value = { formula: `E${row.rowNum}*0.025` };
    r.getCell(8).value = { formula: `F${row.rowNum}+G${row.rowNum}` };
    r.getCell(9).value = { formula: `E${row.rowNum}+H${row.rowNum}` };

    r.height = 28;
    for (let c = 1; c <= 9; c++) {
      const cell = r.getCell(c);
      cell.font = { name: 'Calibri', size: 9, bold: c === 1 || c === 5 || c === 9 };
      cell.border = borderThin;
      if (idx % 2 === 1) cell.fill = zebraLight;
      if (c >= 5) {
        cell.numFmt = '₹ #,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else if (c === 1 || c === 3 || c === 4) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      }
    }
  });

  // Row 24: Spacer
  ws.getRow(24).height = 6;

  // Row 25: Section 2 Header (Extra Charges)
  ws.mergeCells('A25:I25');
  ws.getCell('A25').value = '★ SECTION 2: EXTRA RUNNING CHARGES & OVERTIME SLABS (BEYOND MONTHLY 2,000 KM)';
  ws.getCell('A25').font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A25').fill = slateHeader;

  // Row 26: Surcharges Header
  ws.mergeCells('B26:C26');
  ws.mergeCells('D26:E26');
  ws.mergeCells('F26:G26');
  ws.mergeCells('H26:I26');
  const r26 = ws.getRow(26);
  r26.getCell(1).value = 'Sl.';
  r26.getCell(2).value = 'Billing Parameter / Surcharge';
  r26.getCell(4).value = 'Brand New Maruti Ertiga';
  r26.getCell(6).value = 'Brand New Kia Carens';
  r26.getCell(8).value = 'Tax Treatment & GST Slab';
  for (let c = 1; c <= 9; c++) {
    const cell = r26.getCell(c);
    cell.fill = primaryNavy;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderThin;
  }
  r26.height = 20;

  // Rows 27-29: Extra Charges Data
  const extraRows = [
    [1, 'Extra Running Rate (Beyond 2,000 KM in calendar month)', '₹ 17.00 / km', '₹ 20.00 / km', '+ 5% GST (SAC 996601)'],
    [2, 'Extra Duty Hours (Beyond selected 8h or 12h duty shift)', '₹ 150.00 / hr', '₹ 180.00 / hr', '+ 5% GST (SAC 996601)'],
    [3, 'Sunday / Gazetted Holiday Deployment (Chauffeur Allowance)', '₹ 1,200.00 / day', '₹ 1,200.00 / day', 'Driver Allowance (KM adjusted in quota)']
  ];
  extraRows.forEach((item, idx) => {
    const rowNum = 27 + idx;
    ws.mergeCells(`B${rowNum}:C${rowNum}`);
    ws.mergeCells(`D${rowNum}:E${rowNum}`);
    ws.mergeCells(`F${rowNum}:G${rowNum}`);
    ws.mergeCells(`H${rowNum}:I${rowNum}`);

    const r = ws.getRow(rowNum);
    r.getCell(1).value = item[0];
    r.getCell(2).value = item[1];
    r.getCell(4).value = item[2];
    r.getCell(6).value = item[3];
    r.getCell(8).value = item[4];

    r.height = 19;
    for (let c = 1; c <= 9; c++) {
      const cell = r.getCell(c);
      cell.font = { name: 'Calibri', size: 9 };
      cell.border = borderThin;
      cell.alignment = { horizontal: c === 1 || c >= 4 ? 'center' : 'left', vertical: 'middle' };
    }
  });

  // Row 30: Spacer
  ws.getRow(30).height = 6;

  // Row 31: Section 3 Header (Invest UP 7-Point Compliance Matrix)
  ws.mergeCells('A31:I31');
  ws.getCell('A31').value = '★ SECTION 3: INVEST UP 7-POINT SPECIFICATION & COMPLIANCE MATRIX';
  ws.getCell('A31').font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A31').fill = slateHeader;

  // Row 32: Compliance Headers
  ws.mergeCells('B32:D32');
  ws.mergeCells('E32:H32');
  const r32 = ws.getRow(32);
  r32.getCell(1).value = 'No.';
  r32.getCell(2).value = 'Invest UP BOQ Condition (As Requested)';
  r32.getCell(5).value = 'Kalidass Travels Contractual Commitment';
  r32.getCell(9).value = 'Compliance';
  for (let c = 1; c <= 9; c++) {
    const cell = r32.getCell(c);
    cell.fill = primaryNavy;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderThin;
  }
  r32.height = 20;

  // Rows 33-39: Compliance Rows
  const complianceData = [
    [1, '1. 2000 KM per month', 'Fully included in monthly package. Odometer logged daily on signed trip slips.', '100% COMPLIANT'],
    [2, '2. Monthly billing', 'Consolidated monthly GST tax invoice submitted on last working day with trip logsheets.', '100% COMPLIANT'],
    [3, '3. Fully insured, PUC, DL, RC validity, BS 6', 'Brand New BS-VI yellow-board taxi with Comprehensive Passenger Insurance, PUC, RC, FC & PSV badge.', '100% COMPLIANT'],
    [4, '4. Cost to include fuel and driver (8h / 12h)', 'Wet Lease: 100% fuel, driver salary, uniform, vehicle EMI & upkeep included in quote.', '100% COMPLIANT'],
    [5, '5. Region: KTCC (Kanchipuram, Thiruvallur, Chennai, Chengalpattu)', 'Unrestricted coverage across Sriperumbudur, Oragadam, Irungattukottai, Mahindra City & KTCC belt.', '100% COMPLIANT'],
    [6, '6. Vehicle Age: Less than 3 years (New Vehicle / BS 6)', 'Brand New Showroom / BS-VI vehicle (2025/2026 Batch) allocated exclusively to Invest UP.', '100% COMPLIANT'],
    [7, '7. Vehicle Class: Ertiga / KIA Carens', 'Dedicated 7-seater MUV with guaranteed 60-90 min backup replacement vehicle.', '100% COMPLIANT']
  ];

  complianceData.forEach((row, idx) => {
    const rowNum = 33 + idx;
    ws.mergeCells(`B${rowNum}:D${rowNum}`);
    ws.mergeCells(`E${rowNum}:H${rowNum}`);

    const r = ws.getRow(rowNum);
    r.getCell(1).value = row[0];
    r.getCell(2).value = row[1];
    r.getCell(5).value = row[2];
    r.getCell(9).value = row[3];

    r.height = 19;
    for (let c = 1; c <= 9; c++) {
      const cell = r.getCell(c);
      cell.font = { name: 'Calibri', size: 8.5 };
      cell.border = borderThin;
      if (c === 9) {
        cell.font = { bold: true, color: { argb: 'FF047857' }, size: 8.5 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (c === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    }
  });

  // Row 40: Spacer
  ws.getRow(40).height = 6;

  // Row 41: Section 4 Header (Finance & GST)
  ws.mergeCells('A41:I41');
  ws.getCell('A41').value = '★ SECTION 4: STATUTORY GST, REVERSE CHARGE (RCM) & BANKING PARTICULARS (FOR FINANCE & ACCOUNTS)';
  ws.getCell('A41').font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A41').fill = slateHeader;

  // Rows 42-47: Finance Details
  const finDetails = [
    ['Service Classification:', 'SAC Code 996601 (Rental services of passenger motor vehicles with operator & fuel)', 'GST Rate Applied:', '5% (2.5% CGST + 2.5% SGST)'],
    ['Reverse Charge (RCM):', 'Notification 22/2019-CT(R): 5% GST payable by Client under RCM if Body Corporate; or billed via FCM invoice.', 'Place of Supply:', '33 - Tamil Nadu (Intra-State)'],
    ['Beneficiary Name:', 'KALIDASS TRAVELS', 'Current Account No:', '38921104823'],
    ['Bank Name & Branch:', 'State Bank of India (Medavakkam Branch, Chennai)', 'IFSC Code:', 'SBIN0012345'],
    ['Payment Credit Terms:', 'Strictly 15 calendar days from the date of monthly tax invoice submission via NEFT / RTGS.', 'Toll & Parking:', 'Billed on actuals via FASTag log'],
    ['Zero Dead-Mileage:', 'Daily KM and Time start & end strictly at Client\'s Guindy office (Olympia Cyberspace).', 'Quotation Validity:', '30 Calendar Days']
  ];

  finDetails.forEach((row, idx) => {
    const rowNum = 42 + idx;
    ws.mergeCells(`B${rowNum}:D${rowNum}`);
    ws.mergeCells(`F${rowNum}:I${rowNum}`);

    const r = ws.getRow(rowNum);
    r.getCell(1).value = row[0];
    r.getCell(1).font = { bold: true, size: 8.5 };
    r.getCell(2).value = row[1];
    r.getCell(2).font = { size: 8.5 };

    r.getCell(5).value = row[2];
    r.getCell(5).font = { bold: true, size: 8.5 };
    r.getCell(6).value = row[3];
    r.getCell(6).font = { size: 8.5 };

    r.height = 18;
    for (let c = 1; c <= 9; c++) {
      const cell = r.getCell(c);
      cell.border = borderThin;
      cell.alignment = { vertical: 'middle' };
    }
  });

  // Row 48: Spacer
  ws.getRow(48).height = 10;

  // Row 49: Signatures
  ws.mergeCells('A49:D49');
  ws.getCell('A49').value = 'Confirmed & Accepted by Invest UP (SIPO Chennai):\n\n\n\n_________________________________________________\nAuthorized Signatory & Departmental Seal';
  ws.getCell('A49').font = { size: 9, bold: true, color: { argb: 'FF475569' } };
  ws.getCell('A49').alignment = { wrapText: true, vertical: 'top' };

  ws.mergeCells('E49:I49');
  ws.getCell('E49').value = 'For KALIDASS TRAVELS, CHENNAI\n\n\n\n_________________________________________________\nAuthorized Signatory — Corporate Fleet & Logistics Desk\nPhone: +91 89395 39211 | kalidasstravels2015@gmail.com';
  ws.getCell('E49').font = { size: 9, bold: true, color: { argb: 'FF0F172A' } };
  ws.getCell('E49').alignment = { wrapText: true, horizontal: 'right', vertical: 'top' };
  ws.getRow(49).height = 60;


  // =========================================================================
  // SHEET 2: INTERNAL PROFIT & VEHICLE EMI COVERAGE MODEL
  // =========================================================================
  const ws2 = workbook.addWorksheet('EMI_And_Profit_Breakdown', { views: [{ showGridLines: true }] });
  ws2.columns = [
    { key: 'A', width: 38 },
    { key: 'B', width: 20 },
    { key: 'C', width: 20 },
    { key: 'D', width: 20 },
    { key: 'E', width: 20 },
    { key: 'F', width: 38 }
  ];

  ws2.mergeCells('A1:F1');
  ws2.getCell('A1').value = 'KALIDASS TRAVELS — BRAND NEW BS-VI VEHICLE EMI & CASH PROFIT MODEL';
  ws2.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  ws2.getCell('A1').fill = primaryNavy;
  ws2.getCell('A1').alignment = { horizontal: 'center' };
  ws2.getRow(1).height = 24;

  const costHeaders = ['Cost Component / Profit Line', 'Ertiga (8 Hrs)', 'Ertiga (12 Hrs)', 'Carens (8 Hrs)', 'Carens (12 Hrs)', 'Notes & Financial Logic'];
  const rCostH = ws2.getRow(3);
  costHeaders.forEach((th, idx) => {
    const c = rCostH.getCell(idx + 1);
    c.value = th;
    c.fill = forestGreen;
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.border = borderThin;
  });

  const costData = [
    ['Vehicle Capital EMI (5-Year Loan)', 21500, 21500, 26500, 26500, '100% Car EMI Paid off by Client Contract!'],
    ['Fuel Cost (2,000 KM run @ 14 km/L)', 14400, 14400, 15000, 15000, '2000 km fuel included per month'],
    ['Chauffeur Salary & Allowance', 19000, 23000, 20000, 24000, '8h standard vs 12h extended shift salary'],
    ['Maintenance, Oil, Tyres & Service', 3500, 3500, 4200, 4200, 'Periodic servicing, tyre wear reserve fund'],
    ['Commercial Taxi Insurance & Permit', 4500, 4500, 4800, 4800, 'Comprehensive insurance & fitness certificate'],
    ['Total Cost to Kalidass Travels (OPEX + EMI)', { formula: 'SUM(B4:B8)' }, { formula: 'SUM(C4:C8)' }, { formula: 'SUM(D4:D8)' }, { formula: 'SUM(E4:E8)' }, 'Full monthly cost including vehicle loan EMI'],
    ['Monthly Quoted Taxable Value (Base Rate)', 72000, 78000, 80000, 88000, 'Quoted base rate to Invest UP SIPO'],
    ['Net Monthly Cash In Hand (Profit)', { formula: 'B10-B9' }, { formula: 'C10-C9' }, { formula: 'D10-D9' }, { formula: 'E10-E9' }, 'Pure cash profit after paying 100% car EMI!'],
    ['Annual Net Cash In Hand', { formula: 'B11*12' }, { formula: 'C11*12' }, { formula: 'D11*12' }, { formula: 'E11*12' }, '1-Year cash profit surplus'],
    ['Total Asset Created for Kalidass Travels', 1200000, 1200000, 1500000, 1500000, 'Brand new vehicle fully paid off by client!']
  ];

  costData.forEach((row, i) => {
    const r = ws2.getRow(4 + i);
    r.getCell(1).value = row[0];
    r.getCell(2).value = row[1];
    r.getCell(3).value = row[2];
    r.getCell(4).value = row[3];
    r.getCell(5).value = row[4];
    r.getCell(6).value = row[5];
    for (let c = 1; c <= 6; c++) {
      const cell = r.getCell(c);
      cell.border = borderThin;
      if (c >= 2 && c <= 5) {
        cell.numFmt = '₹ #,##0.00';
      }
      if (i === 0 || i === 5 || i === 7 || i === 9) cell.font = { bold: true };
    }
  });

  const outputPath = path.join(__dirname, '..', 'Kalidass_Travels_SIPO_InvestUP_Quotation.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Excel with EMI coverage successfully written: ${outputPath}`);

  try {
    const defaultPath = path.join(__dirname, '..', 'Kalidass_Travels_Corporate_Monthly_Quotation.xlsx');
    await workbook.xlsx.writeFile(defaultPath);
    console.log(`Also updated default file: ${defaultPath}`);
  } catch (e) {
    console.log(`Default file locked, primary written to Kalidass_Travels_SIPO_InvestUP_Quotation.xlsx`);
  }
}

generateExecutiveQuotationExcel();
