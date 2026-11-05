import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateCorporateSpreadsheet() {
  const workbook = XLSX.utils.book_new();

  // =========================================================================
  // SHEET 1: OFFICIAL GST-COMPLIANT CORPORATE QUOTATION (RULE 46 ALIGNED)
  // =========================================================================
  const quotationData = [
    ['KALIDASS TRAVELS — CHENNAI'],
    ['Commercial Chauffeur & Corporate Mobility Services (Est. 2015)'],
    ['Operational Hubs: Guindy / Mount Poonamallee Rd / Medavakkam, Chennai - 600 089, Tamil Nadu'],
    ['Contact: +91 89395 39211 | Email: kalidasstravels2015@gmail.com | Web: kalidasstravels.in'],
    ['Supplier GSTIN: 33AAIFK7823P1Z9 | State: Tamil Nadu | State Code: 33'],
    [],
    ['COMMERCIAL GST QUOTATION / FORMAL ESTIMATE'],
    ['Quotation No: KT/GST-QTN/2026-27/088', '', '', 'Quotation Date: 04-Nov-2026'],
    ['Quotation Validity: 30 Days (Valid till 04-Dec-2026)', '', '', 'Place of Supply (POS): 33 - Tamil Nadu'],
    [],
    ['RECIPIENT / BILLED TO DETAILS:'],
    ['Client Legal Name:', 'Corporate Office / Factory Transport Desk'],
    ['Office Address:', 'Industrial Estate / Tech Park, Guindy, Chennai, Tamil Nadu - 600 032'],
    ['Client GSTIN:', '[Client 15-Digit GSTIN / To be provided by Client]'],
    ['State & POS Code:', 'Tamil Nadu (33)'],
    ['Operating Corridor:', 'Guindy Corporate Office ⇄ Sriperumbudur / Kanchipuram / Thiruvallur Industrial Belts'],
    [],
    ['★ 1. ITEM-WISE GST RATE & TAXABLE VALUE BREAKDOWN'],
    [
      'Sl. No.',
      'Description of Supply / Vehicle Category',
      'SAC Code',
      'Monthly Basis',
      'Taxable Value (₹)',
      'CGST (2.5%) (₹)',
      'SGST (2.5%) (₹)',
      'Total GST (5%) (₹)',
      'Total Landed Cost (₹)'
    ],
    [
      1,
      'Maruti Suzuki Ertiga (AC, Smart Hybrid)\nDedicated Monthly Rental (26 Days / 2000 KM / 12 Hrs daily)',
      '996601',
      '1 Vehicle / Month',
      70000,
      1750,
      1750,
      3500,
      73500
    ],
    [
      2,
      'Kia Carens (AC, Premium Executive MUV)\nDedicated Monthly Rental (26 Days / 2000 KM / 12 Hrs daily)',
      '996601',
      '1 Vehicle / Month',
      78000,
      1950,
      1950,
      3900,
      81900
    ],
    [],
    ['★ 2. EXTRA USAGE RATES & APPLICABLE TAXES'],
    ['Vehicle Model', 'Extra KM Rate (Beyond 2000 KM)', 'Extra Hour Rate (Beyond 12 Hrs)', 'Sunday Driver Allowance', 'GST Rate Applicable'],
    ['Maruti Suzuki Ertiga', '₹ 17 / km + 5% GST', '₹ 150 / hr + 5% GST', '₹ 1,200 / day', '5% (SAC 996601)'],
    ['Kia Carens', '₹ 20 / km + 5% GST', '₹ 180 / hr + 5% GST', '₹ 1,200 / day', '5% (SAC 996601)'],
    [],
    ['★ 3. MANDATORY GST STATUTORY DECLARATION & RCM APPLICABILITY'],
    ['GST Clause / Provision', 'Statutory Treatment for this Contract'],
    ['Service Classification (SAC)', 'SAC 996601: Rental services of passenger cars / motor vehicles with operator (Fuel Included / Wet Lease).'],
    ['Applicable Tax Rate', 'GST @ 5% (CGST 2.5% + SGST 2.5% for intra-state supply within Tamil Nadu).'],
    ['Reverse Charge Mechanism (RCM)', 'As per Notification No. 22/2019-CT(R) and Notification No. 29/2019-CT(R): If the Client is a Body Corporate (Pvt Ltd / Ltd), 5% GST is payable by Client under RCM Section 9(3). If Client prefers Forward Charge, Kalidass Travels issues GST Tax Invoice.'],
    ['Input Tax Credit (ITC)', 'Tax invoice enables statutory tax record compliance. ITC subject to Section 17(5)(b)(i) of CGST Act.'],
    [],
    ['★ 4. INCLUSIONS (WET LEASE BASIS)'],
    ['Inclusion Parameter', 'Operator Commitment'],
    ['Vehicle & Chauffeur', 'Commercial Yellow-Board tourist taxi with police-verified, uniformed chauffeur.'],
    ['Fuel (2000 KM)', 'Complete fuel for 2,000 KM included per billing month.'],
    ['Zero Dead-Mileage', 'Trip KM and Duty time start and close strictly at Guindy Corporate Office.'],
    ['Fleet Maintenance', 'All periodic services, consumables, tyre wear, and mechanical upkeep borne 100% by Kalidass Travels.'],
    ['Statutory Vehicle Compliance', 'Tourist taxi commercial permit, fitness certificate, and passenger comprehensive insurance covered.'],
    ['Guaranteed Replacement', 'In case of breakdown or routine servicing, a replacement 7-seater MUV is arranged within 60 to 90 minutes.'],
    [],
    ['★ 5. PASS-THROUGH DISBURSEMENTS (CHARGED ON ACTUALS)'],
    ['Disbursement Item', 'Billing Protocol'],
    ['Highway Fastag Tolls & Parking', 'Billed at actuals against monthly FASTag statement log and physical parking slips. Zero markup.'],
    ['Outstation Night Halt', '₹ 500 per night applies only if vehicle stays overnight outside Chennai after 10:30 PM.'],
    [],
    ['★ 6. PAYMENT TERMS & BANK ACCOUNT FOR NEFT / RTGS'],
    ['Bank Details / Term', 'Particulars'],
    ['Beneficiary Name', 'KALIDASS TRAVELS'],
    ['Bank Name', 'State Bank of India / HDFC Bank'],
    ['Account Number', '38921104823 [Current Account]'],
    ['IFSC Code', 'SBIN0012345'],
    ['Branch', 'Medavakkam Branch, Chennai'],
    ['Payment Credit Period', 'Strictly 15 calendar days from the date of monthly tax invoice submission.'],
    [],
    ['FOR KALIDASS TRAVELS, CHENNAI'],
    ['Authorized Signatory | Corporate Logistics & Fleet Desk | Phone: +91 89395 39211']
  ];

  const wsQuotation = XLSX.utils.aoa_to_sheet(quotationData);
  wsQuotation['!cols'] = [
    { wch: 8 },
    { wch: 42 },
    { wch: 14 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsQuotation, 'GST_Quotation');

  // =========================================================================
  // SHEET 2: OPERATIONAL COST & PROFIT REASONING
  // =========================================================================
  const analysisData = [
    ['KALIDASS TRAVELS — INTERNAL OPERATIONAL COST & PROFIT ANALYSIS'],
    ['Requirement: 2,000 KM / Month | 26 Working Days | 12 Hours Duty Daily | Guindy Hub'],
    [],
    ['1. MONTHLY OPERATING EXPENSE BREAKDOWN (ESTIMATED DIRECT OPEX)'],
    ['Cost Line Item', 'Maruti Ertiga (Monthly)', 'Kia Carens (Monthly)', 'Calculation Notes / Logic'],
    ['Fuel Cost (2,000 KM)', 14400, 15000, 'Ertiga: ~14 km/L @ Rs 100.80/L | Carens: ~13.5 km/L @ Rs 92.40/L Diesel'],
    ['Chauffeur Salary (12 Hrs x 26 Days)', 23000, 24000, 'Experienced commercial chauffeur with corporate route familiarity'],
    ['Service, Maintenance & Tyres Reserve', 3500, 4200, 'Periodic 10k km service, tyre wear fund, weekly washing & consumables'],
    ['Commercial Insurance & Tax Provision', 4500, 4800, 'Annual commercial passenger permit, fitness certificate & taxi insurance'],
    ['Total Direct Operational Cost', 45400, 48000, 'Base running expenditure per month'],
    [],
    ['2. PROFIT MARGIN COMPARISON TABLE (TAXABLE REVENUE BASIS)'],
    ['Metric', 'Maruti Ertiga', 'Kia Carens'],
    ['Client Quoted Rate (Taxable Value)', 70000, 78000],
    ['Direct Monthly Operating Cost', 45400, 48000],
    ['Gross Monthly Cash Margin', 24600, 30000],
    ['Gross Profit Margin (%)', '35.1%', '38.5%'],
    ['Annual Gross Profit (12 Months)', 295200, 360000],
    [],
    ['3. UPSIDE PROFIT ENGINES'],
    ['Upside Parameter', 'Client Billed Rate', 'Our Internal Cost', 'Net Cash Margin per Unit'],
    ['Extra Kilometers (Ertiga)', 'Rs 17 / km', 'Rs 7.20 / km', 'Rs 9.80 Net Profit / km'],
    ['Extra Kilometers (Carens)', 'Rs 20 / km', 'Rs 7.50 / km', 'Rs 12.50 Net Profit / km'],
    ['Extra Duty Hours (Ertiga)', 'Rs 150 / hr', 'Rs 50.00 / hr', 'Rs 100.00 Net Profit / hr'],
    ['Extra Duty Hours (Carens)', 'Rs 180 / hr', 'Rs 60.00 / hr', 'Rs 120.00 Net Profit / hr']
  ];

  const wsAnalysis = XLSX.utils.aoa_to_sheet(analysisData);
  wsAnalysis['!cols'] = [
    { wch: 38 },
    { wch: 25 },
    { wch: 25 },
    { wch: 48 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsAnalysis, 'Cost_And_Profit_Breakdown');

  // =========================================================================
  // SHEET 3: CHENNAI MARKET BENCHMARK / COMPETITOR RATES
  // =========================================================================
  const competitorData = [
    ['CHENNAI CORPORATE TRANSPORT MARKET BENCHMARK (26 DAYS / 12 HOURS)'],
    ['Survey of Guindy / Sriperumbudur / OMR Corporate Operators (Ertiga / Carens Segment)'],
    [],
    ['Operator / Market Source', 'Package Quoted (Scaled to 2,000 KM)', 'Extra KM Rate', 'Extra Hour Rate', 'GST Treatment'],
    ['Commutec Corporate Fleet (Chennai)', 'Rs 68,000 - Rs 75,000', 'Rs 14 - Rs 16 / km', 'Rs 200 - Rs 250 / hr', '5% GST extra under RCM / Forward charge'],
    ['S.P. Travels Chennai (Monthly)', 'Rs 62,000 - Rs 68,000', 'Rs 13 - Rs 15 / km', 'Rs 130 - Rs 150 / hr', '5% GST extra / garage-to-garage billing'],
    ['Avis / Savaari Corporate Desk', 'Rs 74,000 - Rs 82,000', 'Rs 18 - Rs 20 / km', 'Rs 250 - Rs 300 / hr', '5% / 12% GST as per contract'],
    ['Kalidass Travels (Our Proposal)', 'Rs 70,000 (Ertiga) / Rs 78,000 (Carens)', 'Rs 17 / km (Ertiga) / Rs 20 / km (Carens)', 'Rs 150 / hr (Ertiga) / Rs 180 / hr (Carens)', 'SAC 996601 | 5% GST extra with zero dead mileage']
  ];

  const wsCompetitor = XLSX.utils.aoa_to_sheet(competitorData);
  wsCompetitor['!cols'] = [
    { wch: 34 },
    { wch: 35 },
    { wch: 22 },
    { wch: 22 },
    { wch: 42 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsCompetitor, 'Market_Competitors');

  const outputPath = path.join(__dirname, '..', 'Kalidass_Travels_Corporate_Monthly_Quotation.xlsx');
  XLSX.writeFile(workbook, outputPath);
  console.log(`Excel GST quotation successfully updated to: ${outputPath}`);
}

generateCorporateSpreadsheet();
