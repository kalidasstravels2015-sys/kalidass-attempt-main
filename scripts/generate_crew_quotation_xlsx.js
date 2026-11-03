import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

function generateUpdatedSpreadsheet() {
  const workbook = XLSX.utils.book_new();

  // Master Sheet for Travel Desk
  const masterData = [
    ['KALIDASS TRAVELS — CHENNAI AIRPORT (MAA) CREW MOBILITY RATE CARD'],
    ['Dedicated 24x7 Chauffeur Transportation for Cockpit Crew (Pilots) & Cabin Crew'],
    ['24x7 Dispatch Desk & WhatsApp: +91 89395 39211 | Email: kalidasstravels2015@gmail.com'],
    ['Operating Hub: Mount Poonamallee / South Chennai Airport Corridor (10-15 mins to MAA)'],
    [],
    ['★ 1. ALL-INCLUSIVE 24x7 HOTEL TRANSFER RATES (POINT-TO-POINT)'],
    ['(Rates include: AC Commercial Vehicle + Chauffeur + Fuel + AAI Airport Parking + Highway Tolls. ZERO cash collected from crew.)'],
    ['Zone / Hotel Destination', 'Crew / Operational Focus', 'Distance (KM)', 'Sedan (Dzire/Etios)\n[Max 2 Pax + 2 Bags]', 'Mid SUV (Ertiga)\n[Max 4 Pax + 4 Bags]', 'Premium SUV (Crysta)\n[Max 6 Pax / Captains]'],
    ['AIRPORT & IMMEDIATE GST ROAD CORRIDOR'],
    ['Trident Chennai (GST Road, Meenambakkam)', 'International & Domestic Cockpit Turnarounds', 3, 1300, 1700, 2300],
    ['Radisson Blu Hotel GRT (GST Road, Airport)', 'Major Domestic & Cargo Crew Layover', 4, 1300, 1700, 2300],
    ['Accord Chrome (Chromepet / GST Road)', 'Regional Domestic Turnarounds', 6, 1300, 1700, 2300],
    ['GUINDY, VELACHERY & MANAPAKKAM CORRIDOR'],
    ['The Westin Chennai (Velachery)', 'Lufthansa & European Crew Layover Hub', 10, 1500, 1950, 2650],
    ['Feathers - A Radha Hotel (Manapakkam)', 'Domestic High-Frequency Crew Blocks', 8, 1400, 1850, 2550],
    ['Park Hyatt Chennai (Guindy)', 'Cathay Pacific & Long-Haul Layover', 8, 1500, 1950, 2650],
    ['Hilton Chennai (Guindy / Kathipara)', 'International Airline Senior Delegations', 8, 1500, 1950, 2650],
    ['ITC Grand Chola (Guindy)', 'Long-Rest Multi-Day Crew Layover Suites', 8, 1500, 1950, 2650],
    ['Le Royal Méridien (GST / Kathipara)', 'Domestic Crew & Layover Batches', 6, 1400, 1850, 2550],
    ['CENTRAL CHENNAI & CITY BUSINESS BELT'],
    ['Courtyard by Marriott (Anna Salai / Teynampet)', 'Corporate & Airline Layover Operations', 14, 1650, 2100, 2850],
    ['Hyatt Regency Chennai (Anna Salai / Teynampet)', 'Long-Turnaround 24h+ International Crew', 14, 1650, 2100, 2850],
    ['Tidel Park Area / Tharamani (Turyaa / Ginger)', 'OMR Gateway & Aviation Transit', 15, 1650, 2100, 2850],
    ['OMR IT EXPRESSWAY & EXTENDED COASTAL ROUTES'],
    ['Four Points by Sheraton (OMR Perungudi)', 'South Chennai Roster Layover Hub', 16, 1650, 2100, 2850],
    ['Holiday Inn Chennai (OMR IT Expressway)', 'IHG Airline Crew Roster Program', 14, 1650, 2100, 2850],
    ['Navalur (OMR) - Aloft / Novotel SIPCOT', 'Extended OMR Tech Corridor / Long-Stay', 28, 1950, 2550, 3450],
    ['Mahabalipuram (Radisson Temple Bay / Sheraton)', 'Inter-District Coastal Layover Resorts', 55, 2800, 3600, 4900],
    [],
    ['★ 2. EXTRA CHARGES & DETENTION SURCHARGES'],
    ['Billing Parameter', 'Applicability / Condition', 'Sedan (Dzire/Etios)', 'Mid SUV (Ertiga)', 'Premium SUV (Crysta)'],
    ['Extra Running (Beyond Destination Hotel)', 'Per Kilometre', 15, 17, 22],
    ['Detention / Waiting (Beyond 45 mins landing buffer)', 'Per Hour (billed in 30-min slabs)', 150, 200, 350],
    ['Additional Drop-Off Point / Multi-Hotel Stop', 'Per Stop (within 5 km radius)', 350, 350, 450],
    ['Urgent Short-Notice Call-Out', 'Dispatched with less than 60 mins notice', 200, 200, 300],
    [],
    ['★ 3. STANDBY / RETENTION BLOCKS (FOR UNCONFIRMED FLIGHT SCHEDULES)'],
    ['(Applies when a vehicle is held on standby at hotel/airport without a fixed departure time, or flight delay exceeds 2 hours)'],
    ['Standby Package Slab', 'Included Duration', 'Included KM', 'Sedan', 'Ertiga', 'Innova Crysta'],
    ['Half-Day Standby Block', '4 Hours', '40 KM', 1600, 2000, 3400],
    ['Full-Day Standby Block', '8 Hours', '80 KM', 2600, 3400, 5400],
    ['Extended Shift Block', '12 Hours', '120 KM', 3700, 4700, 7200],
    [],
    ['★ 4. OPERATIONAL SHIELD & TERMS (NON-NEGOTIABLE OPERATOR RULES)'],
    ['Rule Category', 'Clear Binding Policy for Travel Desk'],
    ['1. 24x7 All-Inclusive Flat Pricing', 'All rates are net flat fares including vehicle hire, chauffeur, fuel, AAI airport commercial parking, and highway tolls. Drivers will NEVER ask crew for cash or parking payments.'],
    ['2. 45-Minute Free Waiting Clock', 'Waiting time starts strictly 45 minutes AFTER actual flight wheel-touchdown time (verified on live airport radar/FlightRadar24), NOT the scheduled timetable. After 45 mins, hourly waiting applies.'],
    ['3. Mandatory 2-Hour Flight Delay Notice', 'Flight delays exceeding 60 minutes must be advised to Kalidass Travels at least 2 hours before scheduled landing. If vehicle has already reported at MAA parking before notice, waiting charges apply from original reporting time.'],
    ['4. Multi-Hotel Drop Policy', 'Quoted rate covers transport to ONE hotel only. Any split drops (e.g. Captain at Westin, Cabin crew at Radisson) will be billed at ₹350 per additional stop within 5 km.'],
    ['5. Last-Minute Cancellation & Dry Run', 'Cancellations require minimum 2 hours notice before landing. If cancelled with < 2 hours notice OR after vehicle is dispatched from garage: Flat ₹800 (Sedan) / ₹1,200 (SUV) dry-run fee applies.'],
    ['6. In-Air Diversion Policy', 'If an incoming flight diverts mid-air to another airport (BLR/TRZ) after our car is parked at MAA, 100% base transfer rate applies to compensate for blocked vehicle duty.'],
    ['7. Credit & Payment Terms', 'Consolidated corporate billing every 15 days against duty slips/WhatsApp trip confirmations. Payment credit: Strictly 15 days from invoice date. GST 5% applicable extra.']
  ];

  const wsMaster = XLSX.utils.aoa_to_sheet(masterData);

  // Column widths
  wsMaster['!cols'] = [
    { wch: 48 },
    { wch: 40 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 }
  ];

  XLSX.utils.book_append_sheet(workbook, wsMaster, 'Crew_Quotation_2026');

  // Sheet 2: Quick Rate Lookup Table (for travel desk ops)
  const quickRates = [
    ['Hotel_Name', 'Zone', 'Sedan_All_Inclusive', 'Ertiga_All_Inclusive', 'Crysta_All_Inclusive'],
    ['Trident Chennai', 'Airport / GST', 1300, 1700, 2300],
    ['Radisson Blu Hotel GRT', 'Airport / GST', 1300, 1700, 2300],
    ['Accord Chrome', 'Airport / GST', 1300, 1700, 2300],
    ['The Westin Chennai Velachery', 'Guindy / Velachery', 1500, 1950, 2650],
    ['Feathers - A Radha Hotel', 'Manapakkam', 1400, 1850, 2550],
    ['Park Hyatt Chennai', 'Guindy / Velachery', 1500, 1950, 2650],
    ['Hilton Chennai', 'Guindy / Velachery', 1500, 1950, 2650],
    ['ITC Grand Chola', 'Guindy / Velachery', 1500, 1950, 2650],
    ['Le Royal Méridien', 'Guindy / GST', 1400, 1850, 2550],
    ['Courtyard by Marriott', 'Central Chennai', 1650, 2100, 2850],
    ['Hyatt Regency Chennai', 'Central Chennai', 1650, 2100, 2850],
    ['Tidel Park Area / Tharamani', 'OMR Gateway', 1650, 2100, 2850],
    ['Four Points by Sheraton', 'OMR Corridor', 1650, 2100, 2850],
    ['Holiday Inn Chennai', 'OMR Corridor', 1650, 2100, 2850],
    ['Navalur (OMR) - Aloft / Novotel', 'OMR Outer', 1950, 2550, 3450],
    ['Mahabalipuram Resorts', 'ECR Coastal', 2800, 3600, 4900]
  ];
  const wsQuick = XLSX.utils.aoa_to_sheet(quickRates);
  wsQuick['!cols'] = [{ wch: 36 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, wsQuick, 'Quick_Rate_Lookup');

  // Write .xlsx file
  const xlsxPath = path.resolve('Kalidass_Travels_Airline_Crew_Quotation.xlsx');
  XLSX.writeFile(workbook, xlsxPath);
  console.log('Successfully written updated XLSX:', xlsxPath);

  // Write .csv file
  const csvPath = path.resolve('Kalidass_Travels_Airline_Crew_Quotation.csv');
  const csvContent = XLSX.utils.sheet_to_csv(wsMaster);
  fs.writeFileSync(csvPath, csvContent);
  console.log('Successfully written updated CSV:', csvPath);
}

generateUpdatedSpreadsheet();
