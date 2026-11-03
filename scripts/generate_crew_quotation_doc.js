import * as docx from 'docx';
import fs from 'fs';
import path from 'path';

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType
} = docx;

async function generateDocx() {
  const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
  };

  const createCell = (text, isHeader = false, isRightAlign = false, widthPercent = null, bgColor = null) => {
    return new TableCell({
      width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
      shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : (isHeader ? { fill: '0F172A', type: ShadingType.CLEAR } : undefined),
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [
        new Paragraph({
          alignment: isRightAlign ? AlignmentType.RIGHT : AlignmentType.LEFT,
          children: [
            new TextRun({
              text: text,
              bold: isHeader,
              color: isHeader ? 'FFFFFF' : (bgColor ? '0F172A' : '1E293B'),
              size: isHeader ? 19 : 18,
              font: 'Calibri'
            })
          ]
        })
      ]
    });
  };

  // 1. Hotel Transfer Table
  const transferData = [
    // Section Header 1
    { isCat: true, title: 'AIRPORT & IMMEDIATE GST ROAD CORRIDOR (3-6 KM)' },
    { name: 'Trident Chennai (GST Road, Meenambakkam)', km: '3 km', sedan: '₹ 1,300', ertiga: '₹ 1,700', crysta: '₹ 2,300' },
    { name: 'Radisson Blu Hotel GRT (GST Road, Airport)', km: '4 km', sedan: '₹ 1,300', ertiga: '₹ 1,700', crysta: '₹ 2,300' },
    { name: 'Accord Chrome (Chromepet / GST Road)', km: '6 km', sedan: '₹ 1,300', ertiga: '₹ 1,700', crysta: '₹ 2,300' },
    // Section Header 2
    { isCat: true, title: 'GUINDY, VELACHERY & MANAPAKKAM CORRIDOR (8-12 KM)' },
    { name: 'The Westin Chennai (Velachery Main Road)', km: '10 km', sedan: '₹ 1,500', ertiga: '₹ 1,950', crysta: '₹ 2,650' },
    { name: 'Feathers - A Radha Hotel (Manapakkam)', km: '8 km', sedan: '₹ 1,400', ertiga: '₹ 1,850', crysta: '₹ 2,550' },
    { name: 'Park Hyatt Chennai (Guindy)', km: '8 km', sedan: '₹ 1,500', ertiga: '₹ 1,950', crysta: '₹ 2,650' },
    { name: 'Hilton Chennai (Guindy / Kathipara)', km: '8 km', sedan: '₹ 1,500', ertiga: '₹ 1,950', crysta: '₹ 2,650' },
    { name: 'ITC Grand Chola (Guindy)', km: '8 km', sedan: '₹ 1,500', ertiga: '₹ 1,950', crysta: '₹ 2,650' },
    { name: 'Le Royal Méridien (GST / Kathipara)', km: '6 km', sedan: '₹ 1,400', ertiga: '₹ 1,850', crysta: '₹ 2,550' },
    // Section Header 3
    { isCat: true, title: 'CENTRAL CHENNAI & CITY BUSINESS BELT (13-16 KM)' },
    { name: 'Courtyard by Marriott (Anna Salai / Teynampet)', km: '14 km', sedan: '₹ 1,650', ertiga: '₹ 2,100', crysta: '₹ 2,850' },
    { name: 'Hyatt Regency Chennai (Anna Salai / Teynampet)', km: '14 km', sedan: '₹ 1,650', ertiga: '₹ 2,100', crysta: '₹ 2,850' },
    { name: 'Tidel Park Area / Tharamani (Turyaa / Ginger)', km: '15 km', sedan: '₹ 1,650', ertiga: '₹ 2,100', crysta: '₹ 2,850' },
    // Section Header 4
    { isCat: true, title: 'OMR IT CORRIDOR & EXTENDED COASTAL ROUTES' },
    { name: 'Four Points by Sheraton (OMR Perungudi)', km: '16 km', sedan: '₹ 1,650', ertiga: '₹ 2,100', crysta: '₹ 2,850' },
    { name: 'Holiday Inn Chennai (OMR IT Expressway)', km: '14 km', sedan: '₹ 1,650', ertiga: '₹ 2,100', crysta: '₹ 2,850' },
    { name: 'Navalur (OMR) - Aloft / Novotel SIPCOT', km: '28 km', sedan: '₹ 1,950', ertiga: '₹ 2,550', crysta: '₹ 3,450' },
    { name: 'Mahabalipuram (Radisson Temple Bay / Sheraton)', km: '55 km', sedan: '₹ 2,800', ertiga: '₹ 3,600', crysta: '₹ 4,900' },
  ];

  const transferRows = [
    new TableRow({
      tableHeader: true,
      children: [
        createCell('Destination Hotel / Zone', true, false, 40),
        createCell('Approx Km', true, false, 12),
        createCell('Sedan (4+1)\n[Max 2 Pax]', true, true, 16),
        createCell('Ertiga (6+1)\n[Max 4 Pax]', true, true, 16),
        createCell('Crysta (7+1)\n[Captains/VIP]', true, true, 16),
      ]
    }),
    ...transferData.map(item => {
      if (item.isCat) {
        return new TableRow({
          children: [
            new TableCell({
              columnSpan: 5,
              shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 140, right: 140 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: item.title, bold: true, size: 17, color: '0F172A', font: 'Calibri' })]
                })
              ]
            })
          ]
        });
      }
      return new TableRow({
        children: [
          createCell(item.name, false, false),
          createCell(item.km, false, false),
          createCell(item.sedan, false, true),
          createCell(item.ertiga, false, true),
          createCell(item.crysta, false, true),
        ]
      });
    })
  ];

  const transferTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorder,
    rows: transferRows
  });

  // 2. Extra Charges Table
  const extraData = [
    ['Extra Kilometre Rate (Beyond hotel destination)', '₹ 15 / km', '₹ 17 / km', '₹ 22 / km'],
    ['Detention / Waiting Charge (Beyond 45 mins buffer)', '₹ 150 / hr', '₹ 200 / hr', '₹ 350 / hr'],
    ['Additional Drop-Off Point (Within 5 km radius)', '₹ 350 / stop', '₹ 350 / stop', '₹ 450 / stop'],
    ['Urgent Short-Notice Call-Out (< 60 mins notice)', '₹ 200 / call', '₹ 200 / call', '₹ 300 / call'],
  ];

  const extraTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorder,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createCell('Billing Parameter / Detention Item', true, false, 52),
          createCell('Sedan', true, true, 16),
          createCell('Ertiga', true, true, 16),
          createCell('Innova Crysta', true, true, 16),
        ]
      }),
      ...extraData.map(r => new TableRow({
        children: [
          createCell(r[0], false, false),
          createCell(r[1], false, true),
          createCell(r[2], false, true),
          createCell(r[3], false, true),
        ]
      }))
    ]
  });

  // 3. Standby Packages Table
  const standbyData = [
    ['Half-Day Standby Block (4 Hours / 40 KM)', '₹ 1,600', '₹ 2,000', '₹ 3,400'],
    ['Full-Day Standby Block (8 Hours / 80 KM)', '₹ 2,600', '₹ 3,400', '₹ 5,400'],
    ['Extended Shift Block (12 Hours / 120 KM)', '₹ 3,700', '₹ 4,700', '₹ 7,200'],
  ];

  const standbyTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorder,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createCell('Standby / Delay Retention Package', true, false, 52),
          createCell('Sedan', true, true, 16),
          createCell('Ertiga', true, true, 16),
          createCell('Innova Crysta', true, true, 16),
        ]
      }),
      ...standbyData.map(r => new TableRow({
        children: [
          createCell(r[0], false, false),
          createCell(r[1], false, true),
          createCell(r[2], false, true),
          createCell(r[3], false, true),
        ]
      }))
    ]
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 900, bottom: 900, left: 900, right: 900 }
        }
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: 'KALIDASS TRAVELS — CHENNAI', bold: true, size: 28, font: 'Calibri', color: '0F172A' })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: 'No. 3/182, Mount Poonamallee High Road, Chennai, Tamil Nadu', size: 17, font: 'Calibri', color: '475569' })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: '24x7 Operations Desk & WhatsApp: +91 89395 39211  |  Email: kalidasstravels2015@gmail.com', bold: true, size: 18, font: 'Calibri', color: '2563EB' })
          ]
        }),

        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: 'AIRLINE CREW TRANSPORTATION RATE CARD (MAA AIRPORT ⇄ HOTELS)', bold: true, size: 21, font: 'Calibri', color: '0F172A' })
          ]
        }),
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: '★ All-Inclusive 24x7 Net Flat Rates: Includes Car, Chauffeur, Fuel, AAI Airport Parking & Tolls. ZERO cash collected from crew.', bold: true, size: 17, font: 'Calibri', color: '059669' })
          ]
        }),

        new Paragraph({
          spacing: { before: 100, after: 80 },
          children: [
            new TextRun({ text: '1. All-Inclusive Point-to-Point Hotel Transfer Rates', bold: true, size: 19, font: 'Calibri', color: '0F172A' })
          ]
        }),
        transferTable,

        new Paragraph({
          spacing: { before: 180, after: 80 },
          children: [
            new TextRun({ text: '2. Extra Running & Detention Charges', bold: true, size: 19, font: 'Calibri', color: '0F172A' })
          ]
        }),
        extraTable,

        new Paragraph({
          spacing: { before: 180, after: 80 },
          children: [
            new TextRun({ text: '3. Standby Packages (Flight Delay / Crew Standby Blocks)', bold: true, size: 19, font: 'Calibri', color: '0F172A' })
          ]
        }),
        standbyTable,

        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [
            new TextRun({ text: '4. Non-Negotiable Operational Rules & Shield', bold: true, size: 19, font: 'Calibri', color: '0F172A' })
          ]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '1. 45-Min Free Landing Buffer: ', bold: true, font: 'Calibri', size: 18 }),
            new TextRun({ text: 'Free waiting is 45 minutes from ACTUAL flight touchdown (tracked on live radar), NOT the scheduled timetable. After 45 mins, hourly detention applies.', font: 'Calibri', size: 18 })
          ]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '2. Mandatory 2-Hour Delay Notice: ', bold: true, font: 'Calibri', size: 18 }),
            new TextRun({ text: 'Delays > 1 hour must be communicated 2 hours before scheduled landing. If car has already reached airport before delay notice, waiting charges apply from original reporting time.', font: 'Calibri', size: 18 })
          ]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '3. Single Hotel Drop Policy: ', bold: true, font: 'Calibri', size: 18 }),
            new TextRun({ text: 'Quoted rate covers 1 hotel destination only. Any split drops (e.g. Captain at Westin, Cabin crew at Radisson) will be billed at ₹ 350 per additional stop within 5 km.', font: 'Calibri', size: 18 })
          ]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: '4. Cancellation & Mid-Air Diversion (Dry Run): ', bold: true, font: 'Calibri', size: 18 }),
            new TextRun({ text: 'Notice < 2 hours or after garage dispatch: Flat ₹ 800 (Sedan) / ₹ 1,200 (SUV) dry-run fee. If flight diverts mid-air to BLR/TRZ after car reaches MAA, 100% base fare is billable.', font: 'Calibri', size: 18 })
          ]
        }),
        new Paragraph({
          spacing: { after: 140 },
          children: [
            new TextRun({ text: '5. Corporate Billing & Credit: ', bold: true, font: 'Calibri', size: 18 }),
            new TextRun({ text: 'Consolidated billing every 15 days against trip logs. Payment credit strictly 15 days from invoice date. GST 5% extra.', font: 'Calibri', size: 18 })
          ]
        }),

        new Paragraph({
          spacing: { before: 160, after: 40 },
          children: [
            new TextRun({ text: 'For Kalidass Travels, Chennai', bold: true, font: 'Calibri', size: 19 })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Authorized Signatory / Fleet Operations Desk', font: 'Calibri', size: 17, color: '64748B' })
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.resolve('Kalidass_Travels_Airline_Crew_Quotation.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('Successfully updated Word DOCX:', outputPath);
}

generateDocx().catch(err => {
  console.error(err);
  process.exit(1);
});
