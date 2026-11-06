import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateFinalizedQuotationExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Kalidass Travels Chennai';
  workbook.lastModifiedBy = 'Fleet Operations Desk';
  workbook.created = new Date('2026-11-05');
  workbook.modified = new Date('2026-11-05');

  // =========================================================================
  // SHEET 1: FORMAL GST QUOTATION (EXACT SPECIFICATION WITH 5 CORE OFFERS)
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

  ws.columns = [
    { key: 'A', width: 6 },   // Item
    { key: 'B', width: 33 },  // Vehicle & Specification
    { key: 'C', width: 11 },  // SAC Code
    { key: 'D', width: 16 },  // Duty Hours & KM
    { key: 'E', width: 16 },  // Taxable Value
    { key: 'F', width: 13 },  // CGST (2.5%)
    { key: 'G', width: 13 },  // SGST (2.5%)
    { key: 'H', width: 14 },  // Total GST (5%)
    { key: 'I', width: 17 }   // Total Landed Amount
  ];

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

  // Row 1: Header Title
  ws.mergeCells('A1:I1');
  const r1 = ws.getCell('A1');
  r1.value = 'KALIDASS TRAVELS — CHENNAI';
  r1.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF0F172A' } };
  r1.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 24;

  // Row 2: Subtitle
  ws.mergeCells('A2:I2');
  const r2 = ws.getCell('A2');
  r2.value = 'Airport Drops | Destination Tours | Corporate Mobility (Est. 2015)';
  r2.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  r2.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 3: Operating Hubs
  ws.mergeCells('A3:I3');
  const r3 = ws.getCell('A3');
  r3.value = 'No. 4/220, E88, Ponniamman Koil Street, Annamalai Nagar, Medavakkam, Chennai - 600 100';
  r3.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } };
  r3.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 4: Contacts
  ws.mergeCells('A4:I4');
  const r4 = ws.getCell('A4');
  r4.value = 'Mobile: 6381939769, 8939539211 | Email: kalidasstravels2015@gmail.com | Website: kalidasstravels.in';
  r4.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF2563EB' } };
  r4.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 5: GSTIN Strip
  ws.mergeCells('A5:I5');
  const r5 = ws.getCell('A5');
  r5.value = 'SUPPLIER GSTIN: 33COVPM0531D1Z4  |  STATE: TAMIL NADU (33)  |  SAC CODE: 996601';
  r5.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  r5.fill = forestGreen;
  r5.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(5).height = 20;

  // Row 6: Spacer
  ws.getRow(6).height = 8;

  // Row 7: Banner
  ws.mergeCells('A7:I7');
  const r7 = ws.getCell('A7');
  r7.value = 'FINAL COMMERCIAL GST QUOTATION & BOQ (SPECIAL EXECUTIVE OFFER)';
  r7.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  r7.fill = primaryNavy;
  r7.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(7).height = 20;

  // Row 8-15: Metadata & Address
  ws.getRow(8).height = 18;
  ws.mergeCells('A8:D8');
  ws.getCell('A8').value = 'REF NO: QUO/2026-27/044';
  ws.getCell('A8').font = { bold: true, size: 9.5 };

  ws.mergeCells('E8:I8');
  ws.getCell('E8').value = 'DATE: November 05, 2026  |  VALIDITY: 30 Days';
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
  ws.getCell('A10').value = 'The Office In Charge,';
  ws.getCell('A10').font = { bold: true, size: 9.5 };

  ws.mergeCells('E10:I10');
  ws.getCell('E10').value = 'DAILY ROUTE: Otteri Residence ⇄ Olympia Cyberspace Guindy';
  ws.getCell('E10').font = { bold: true, size: 9, color: { argb: 'FF047857' } };
  ws.getCell('E10').alignment = { horizontal: 'right' };

  ws.mergeCells('A11:D11');
  ws.getCell('A11').value = 'State Investment Promotion Office (SIPO) Chennai,';
  ws.getCell('A11').font = { bold: true, size: 9.5 };

  ws.mergeCells('E11:I11');
  ws.getCell('E11').value = 'METER READING: Starts & Ends at Otteri Residence (Zero Dead KM)';
  ws.getCell('E11').font = { bold: true, size: 9, color: { argb: 'FF047857' } };
  ws.getCell('E11').alignment = { horizontal: 'right' };

  ws.mergeCells('A12:D12');
  ws.getCell('A12').value = 'Invest UP (Government of Uttar Pradesh),';
  ws.getCell('A12').font = { bold: true, size: 9.5, color: { argb: 'FF047857' } };

  ws.mergeCells('E12:I12');
  ws.getCell('E12').value = 'MONTHLY USAGE QUOTA: 2,000 KM / 26 Working Days';
  ws.getCell('E12').font = { bold: true, size: 9 };
  ws.getCell('E12').alignment = { horizontal: 'right' };

  ws.mergeCells('A13:D13');
  ws.getCell('A13').value = 'Olympia Cyberspace Pvt. Ltd. No. 21 & 22, Arulayiammanpettai,';
  ws.getCell('A13').font = { size: 9 };

  ws.mergeCells('E13:I13');
  ws.getCell('E13').value = 'CORRIDOR: KTCC (Kanchipuram, Thiruvallur, Chennai, Chengalpattu)';
  ws.getCell('E13').font = { size: 9 };
  ws.getCell('E13').alignment = { horizontal: 'right' };

  ws.mergeCells('A14:D14');
  ws.getCell('A14').value = '2nd Street, Alandur Road, Guindy, Chennai - 600 032.';
  ws.getCell('A14').font = { size: 9 };

  ws.mergeCells('E14:I14');
  ws.getCell('E14').value = 'SAFETY & AUDIT: Live GPS Dashboard Access + Police Verified Driver';
  ws.getCell('E14').font = { size: 9, bold: true, color: { argb: 'FF2563EB' } };
  ws.getCell('E14').alignment = { horizontal: 'right' };

  ws.mergeCells('A15:D15');
  ws.getCell('A15').value = 'Email: gmsipo_chennai@investup.org.in | Attn: Ms. Logapriya Loks';
  ws.getCell('A15').font = { size: 9, bold: true, color: { argb: 'FF2563EB' } };

  ws.mergeCells('E15:I15');
  ws.getCell('E15').value = 'CLIENT GSTIN: [To be furnished by Invest UP]';
  ws.getCell('E15').font = { size: 9 };
  ws.getCell('E15').alignment = { horizontal: 'right' };

  // Row 16: Subject
  ws.getRow(16).height = 24;
  ws.mergeCells('A16:I16');
  const rSub = ws.getCell('A16');
  rSub.value = 'SUBJECT: Commercial Quotation & BOQ for Dedicated Monthly Hiring of BS-VI MUV (Kia Carens [Preferred] & Maruti Ertiga) for SIPO Chennai with Special 13-Hour Overtime Cushion & Executive Perks.';
  rSub.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
  rSub.fill = subSectionFill;
  rSub.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };

  // Row 17: Spacer
  ws.getRow(17).height = 6;

  // Row 18: Section 1 Header
  ws.mergeCells('A18:I18');
  ws.getCell('A18').value = '★ SECTION 1: COMMERCIAL BOQ — 10 HOURS DUTY SLAB WITH COMPLIMENTARY 13-HOUR OVERTIME CUSHION';
  ws.getCell('A18').font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A18').fill = slateHeader;

  // Row 19: Headers
  const tableHeaders = [
    'Item',
    'Vehicle Class & Specification',
    'SAC Code',
    'Duty Shift & Buffer',
    'Taxable Value (₹)',
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

  // Data Rows:
  // Item 1: Kia Carens @ ₹78,000 + 5% GST (Total ₹81,900)
  // Item 2: Maruti Ertiga @ ₹68,000 + 5% GST (Total ₹71,400)
  const boqData = [
    {
      item: '1',
      desc: 'Kia Carens (Brand New BS-VI, AC, 6+1)\n★ PREFERRED CHOICE | Executive MUV | Commercial Yellow Board',
      sac: '996601',
      slab: '10 Hours / Day\n(Waived up to 13h/day)',
      taxable: 78000,
      rowNum: 20,
      isPreferred: true
    },
    {
      item: '2',
      desc: 'Maruti Suzuki Ertiga (Brand New BS-VI, AC, 6+1)\nOPTION 2 (ECONOMY) | Smart Hybrid MUV | Commercial Yellow Board',
      sac: '996601',
      slab: '10 Hours / Day\n(Waived up to 13h/day)',
      taxable: 68000,
      rowNum: 21,
      isPreferred: false
    }
  ];

  boqData.forEach((row) => {
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

    r.height = 30;
    for (let c = 1; c <= 9; c++) {
      const cell = r.getCell(c);
      cell.font = { name: 'Calibri', size: 9.5, bold: c === 1 || c === 5 || c === 9 || row.isPreferred };
      cell.border = borderThin;
      if (row.isPreferred) cell.fill = zebraLight;
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

  // Row 22: Spacer
  ws.getRow(22).height = 6;

  // Row 23: Section 2 Header
  ws.mergeCells('A23:I23');
  ws.getCell('A23').value = '★ SECTION 2: EXTRA RUNNING CHARGES & SURCHARGES (APPLIES STRICTLY BEYOND 13 HOURS)';
  ws.getCell('A23').font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A23').fill = slateHeader;

  // Row 24: Surcharges Header
  ws.mergeCells('B24:C24');
  ws.mergeCells('D24:E24');
  ws.mergeCells('F24:G24');
  ws.mergeCells('H24:I24');
  const r24 = ws.getRow(24);
  r24.getCell(1).value = 'Sl.';
  r24.getCell(2).value = 'Billing Parameter / Operational Surcharge';
  r24.getCell(4).value = 'Kia Carens (Preferred)';
  r24.getCell(6).value = 'Maruti Ertiga';
  r24.getCell(8).value = 'Tax Treatment & GST Slab';
  for (let c = 1; c <= 9; c++) {
    const cell = r24.getCell(c);
    cell.fill = primaryNavy;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderThin;
  }
  r24.height = 20;

  // Rows 25-29: Extra Charges Data
  const extraRows = [
    [1, 'Extra Running Rate (Beyond 2,000 KM in calendar month)', '₹ 18.00 / km', '₹ 16.00 / km', '+ 5% GST (SAC 996601)'],
    [2, 'Extra Duty Hours (Billed ONLY after 13 Hours/day)', '₹ 180.00 / hr', '₹ 150.00 / hr', '+ 5% GST (Zero charge up to 13h)'],
    [3, 'Outstation Night Halt Allowance (Stay outside Chennai past 10:30 PM)', '₹ 500.00 / night', '₹ 500.00 / night', 'Driver Night Lodging (Actuals)'],
    [4, 'Sunday / Gazetted Holiday Deployment (Chauffeur Allowance)', '₹ 1,200.00 / day', '₹ 1,200.00 / day', 'Driver Allowance (KM in quota)'],
    [5, 'Toll Charges, FASTag, State Entry Taxes & Parking Fees', 'At Actuals', 'At Actuals', 'Actuals with computerized receipts']
  ];
  extraRows.forEach((item, idx) => {
    const rowNum = 25 + idx;
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
      cell.font = { name: 'Calibri', size: 9, bold: idx === 0 || idx === 1 };
      cell.border = borderThin;
      cell.alignment = { horizontal: c === 1 || c >= 4 ? 'center' : 'left', vertical: 'middle' };
    }
  });

  // Row 30: Spacer
  ws.getRow(30).height = 6;

  // Row 31: Section 3 Header (Invest UP 7-Point Compliance Matrix)
  ws.mergeCells('A31:I31');
  ws.getCell('A31').value = '★ SECTION 3: INVEST UP 7-POINT SPECIFICATION & VENDOR COMPETITIVE ASSURANCES';
  ws.getCell('A31').font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A31').fill = slateHeader;

  // Row 32: Compliance Headers
  ws.mergeCells('B32:D32');
  ws.mergeCells('E32:H32');
  const r32 = ws.getRow(32);
  r32.getCell(1).value = 'No.';
  r32.getCell(2).value = 'Invest UP BOQ Parameter / Tender Condition';
  r32.getCell(5).value = 'Kalidass Travels Contractual Commitment & Executive Perks';
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
    [1, '1. 2,000 KM Monthly Usage Quota', 'Fully included. Opening meter logged at Otteri home & closing at Otteri drop.', '✔ Yes'],
    [2, '2. Consolidated Monthly Billing', 'Consolidated monthly GST tax invoice submitted on last working day with certified duty slips.', '✔ Yes'],
    [3, '3. Statutory Validity: Insurance, PUC, DL, RC, BS-VI', 'Commercial Yellow-Board taxi with Comprehensive Passenger Insurance, valid PUC, RC, FC & PSV badge.', '✔ Yes'],
    [4, '4. All-Inclusive Cost: Fuel & Chauffeur (10h Shift)', 'Wet Lease Model: 100% fuel, driver salary, uniform, vehicle EMI & upkeep included in quote.', '✔ Yes'],
    [5, '5. Operational Corridor: KTCC Region', 'Full unconstrained coverage across Sriperumbudur, Oragadam, Kanchipuram, Thiruvallur, Chengalpattu.', '✔ Yes'],
    [6, '6. Vehicle Age: Less than 3 Years (New / BS-VI)', 'Brand New Showroom / BS-VI vehicle (2025/2026 Batch) allocated exclusively to Invest UP.', '✔ Yes'],
    [7, '7. Vehicle Class: Dedicated MUV (Kia Carens / Ertiga)', 'Dedicated 7-seater MUV with guaranteed 2-hour backup replacement vehicle.', '✔ Yes']
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
        cell.font = { bold: true, color: { argb: 'FF047857' }, size: 9 };
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

  // Row 41: Section 4 Header (Terms & Conditions)
  ws.mergeCells('A41:I41');
  ws.getCell('A41').value = '★ SECTION 4: TERMS & CONDITIONS & VENDOR COMPETITIVE ADVANTAGES';
  ws.getCell('A41').font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A41').fill = slateHeader;

  const termsData = [
    ['1. 13-Hour Overtime Cushion:', 'Base package is 10 hours/day. Overtime charges waived up to 13 hours/day. Extra hours billed ONLY after 13th hour.', '5. Police Verified Driver:', 'Police Clearance Certificate (PCC) and commercial PSV badge submitted on Day 1.'],
    ['2. Outstation & Night Charges:', 'Outstation day runs included in 2,000 km. Outstation overnight driver halt (Rs 500/night) not included; billed on actuals.', '6. Zero Dead-Mileage:', 'KM and Time start upon morning Otteri pickup and close upon evening Otteri drop.'],
    ['3. Guaranteed 2-Hour Backup:', 'Replacement 7-seater MUV deployed at Olympia Cyberspace within 2 hours if service/breakdown occurs.', '7. GST & SAC Code:', 'SAC 996601 at 5% GST (2.5% CGST + 2.5% SGST). Payable under RCM or FCM.'],
    ['4. Live GPS Fleet Tracking:', 'Dedicated live GPS web/mobile tracking access provided to SIPO administration for safety & audit.', '8. Payment Credit:', 'Payment strictly within 15 calendar days from date of monthly tax invoice submission via NEFT/RTGS.']
  ];

  termsData.forEach((row, idx) => {
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

  // Row 46: Spacer
  ws.getRow(46).height = 10;

  // Row 47: Signatures
  ws.mergeCells('A47:D47');
  ws.getCell('A47').value = 'Confirmed & Accepted by Invest UP (SIPO Chennai):\n\n\n\n_________________________________________________\nAuthorized Signatory & Departmental Seal';
  ws.getCell('A47').font = { size: 9, bold: true, color: { argb: 'FF475569' } };
  ws.getCell('A47').alignment = { wrapText: true, vertical: 'top' };

  ws.mergeCells('E47:I47');
  ws.getCell('E47').value = 'Digitally signed by Saravanan Kuppusamy\nDate: 2026.11.05 14:30:00 +05\'30\'\n\n_________________________________________________\nFor KALIDASS TRAVELS, CHENNAI\nAuthorised Signatory | Phone: +91 89395 39211';
  ws.getCell('E47').font = { size: 9, bold: true, color: { argb: 'FF0F172A' } };
  ws.getCell('E47').alignment = { wrapText: true, horizontal: 'right', vertical: 'top' };
  ws.getRow(47).height = 60;

  const outputPath = path.join(__dirname, '..', 'Kalidass_Travels_SIPO_InvestUP_Quotation.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Finalized Excel with 5 core offers written: ${outputPath}`);
}

generateFinalizedQuotationExcel();
