import * as docx from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    top: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '0F172A' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
  };

  const createCell = (text, isHeader = false, isRightAlign = false, widthPercent = null, bgColor = null) => {
    return new TableCell({
      width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
      shading: bgColor ? { fill: bgColor, type: ShadingType.CLEAR } : (isHeader ? { fill: 'FFFFFF', type: ShadingType.CLEAR } : undefined),
      margins: { top: 70, bottom: 70, left: 90, right: 90 },
      children: [
        new Paragraph({
          alignment: isRightAlign ? AlignmentType.RIGHT : AlignmentType.LEFT,
          children: [
            new TextRun({
              text: text,
              bold: isHeader,
              color: '0F172A',
              size: isHeader ? 17 : 16,
              font: 'Calibri'
            })
          ]
        })
      ]
    });
  };

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 500, bottom: 500, left: 600, right: 600 }
        }
      },
      children: [
        // Header
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Kalidass Travels", bold: true, size: 30, color: "B91C1C", font: 'Georgia', italics: true }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Airport Drops | Destination Tours | Corporate Mobility", size: 15, color: "0284C7", font: 'Calibri', bold: true }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Mobile : 6381939769, 8939539211 | Website : kalidasstravels.in", size: 14, color: "0F172A", font: 'Calibri' }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "GSTIN: 33COVPM0531D1Z4  |  SAC CODE: 996601", size: 14, bold: true, color: "047857", font: 'Calibri' }),
          ]
        }),

        // Top Meta
        new Paragraph({ spacing: { before: 80, after: 40 }, children: [
          new TextRun({ text: "REF NO: ", bold: true, size: 15, font: 'Calibri' }),
          new TextRun({ text: "QUO/2026-27/044    |    ", size: 15, font: 'Calibri' }),
          new TextRun({ text: "DATE: ", bold: true, size: 15, font: 'Calibri' }),
          new TextRun({ text: "05-11-2026    |    ", size: 15, font: 'Calibri' }),
          new TextRun({ text: "PLACE OF SUPPLY: ", bold: true, size: 15, font: 'Calibri' }),
          new TextRun({ text: "33 - Tamil Nadu", size: 15, font: 'Calibri' })
        ]}),

        // To Address
        new Paragraph({ spacing: { after: 60 }, children: [
          new TextRun({ text: "TO:\n", bold: true, size: 15, font: 'Calibri' }),
          new TextRun({ text: "The Office In Charge,\n", bold: true, size: 15, font: 'Calibri' }),
          new TextRun({ text: "State Investment Promotion Office (SIPO) Chennai,\n", bold: true, size: 15, font: 'Calibri' }),
          new TextRun({ text: "Invest UP,\n", bold: true, size: 15, color: "047857", font: 'Calibri' }),
          new TextRun({ text: "Olympia Cyberspace Pvt. Ltd. No. 21 & 22, Arulayiammanpettai, 2nd Street, Alandur Road, Guindy, Chennai - 600 032.\n", size: 14, font: 'Calibri' }),
          new TextRun({ text: "Email: gmsipo_chennai@investup.org.in | Attn: Ms. Logapriya Loks", bold: true, size: 14, color: "2563EB", font: 'Calibri' })
        ]}),

        // Subject
        new Paragraph({
          spacing: { before: 40, after: 80 },
          children: [
            new TextRun({ text: "SUBJECT: ", bold: true, size: 15, font: 'Calibri' }),
            new TextRun({ text: "Commercial Quotation & BOQ for Dedicated Monthly Hiring of BS-VI MUV (Kia Carens [Preferred] & Maruti Ertiga) for SIPO Chennai with Special 13-Hour Overtime Cushion & Executive Perks.", bold: true, size: 15, font: 'Calibri', color: "0F172A" })
          ]
        }),

        // Section 1: BOQ Table
        new Paragraph({
          spacing: { before: 60, after: 30 },
          children: [
            new TextRun({ text: "SECTION 1: COMMERCIAL BOQ — 10 HOURS DAILY DUTY / 26 DAYS / 2,000 KM MONTHLY", bold: true, size: 16, color: "0F172A", font: 'Calibri' })
          ]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createCell("Sl. No", true, false, 8),
                createCell("Name of Vehicle & Grade", true, false, 32),
                createCell("SAC Code", true, false, 10),
                createCell("Duty Shift & Buffer", true, false, 16),
                createCell("Taxable Value", true, true, 13),
                createCell("CGST 2.5%", true, true, 10),
                createCell("SGST 2.5%", true, true, 10),
                createCell("Total Amount", true, true, 14, "F8FAFC")
              ]
            }),
            new TableRow({
              children: [
                createCell("1", false, false, 8),
                createCell("Kia Carens (Brand New BS-VI, AC, 6+1)\n★ PREFERRED CHOICE | Executive MUV", false, false, 32),
                createCell("996601", false, false, 10),
                createCell("10 Hours / Day\n(Waived up to 13h)", false, false, 16),
                createCell("₹ 78,000.00", false, true, 13),
                createCell("₹ 1,950.00", false, true, 10),
                createCell("₹ 1,950.00", false, true, 10),
                createCell("₹ 81,900.00", false, true, 14, "F1F5F9")
              ]
            }),
            new TableRow({
              children: [
                createCell("2", false, false, 8),
                createCell("Maruti Suzuki Ertiga (Brand New BS-VI, AC, 6+1)\nOPTION 2 (ECONOMY) | Smart Hybrid MUV", false, false, 32),
                createCell("996601", false, false, 10),
                createCell("10 Hours / Day\n(Waived up to 13h)", false, false, 16),
                createCell("₹ 68,000.00", false, true, 13),
                createCell("₹ 1,700.00", false, true, 10),
                createCell("₹ 1,700.00", false, true, 10),
                createCell("₹ 71,400.00", false, true, 14, "F1F5F9")
              ]
            })
          ]
        }),

        // Section 2: Extra Usage Surcharges
        new Paragraph({
          spacing: { before: 70, after: 30 },
          children: [
            new TextRun({ text: "SECTION 2: EXTRA RUNNING CHARGES & OVERTIME SLABS (APPLIES STRICTLY BEYOND 13 HOURS)", bold: true, size: 16, color: "0F172A", font: 'Calibri' })
          ]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createCell("Sl. No", true, false, 8),
                createCell("Billing Parameter / Operational Surcharge", true, false, 36),
                createCell("Kia Carens (Preferred)", true, true, 20),
                createCell("Maruti Ertiga", true, true, 18),
                createCell("Tax Treatment & GST Slab", true, false, 18)
              ]
            }),
            new TableRow({
              children: [
                createCell("1", false, false, 8),
                createCell("Extra Running Rate (Beyond 2,000 KM in calendar month)", false, false, 36),
                createCell("18.00 / km", false, true, 20),
                createCell("16.00 / km", false, true, 18),
                createCell("5% GST (SAC 996601)", false, false, 18)
              ]
            }),
            new TableRow({
              children: [
                createCell("2", false, false, 8),
                createCell("Extra Duty Hours (Billed ONLY after 13 Hours/day)", false, false, 36),
                createCell("180.00 / hr", false, true, 20),
                createCell("150.00 / hr", false, true, 18),
                createCell("Zero charge up to 13h", false, false, 18)
              ]
            }),
            new TableRow({
              children: [
                createCell("3", false, false, 8),
                createCell("Outstation Night Halt (Outside Chennai past 10:30 PM)", false, false, 36),
                createCell("500.00 / night", false, true, 20),
                createCell("500.00 / night", false, true, 18),
                createCell("Lodging at actuals", false, false, 18)
              ]
            }),
            new TableRow({
              children: [
                createCell("4", false, false, 8),
                createCell("Sunday / Gazetted Holiday Deployment (Chauffeur Allowance)", false, false, 36),
                createCell("1,200.00 / day", false, true, 20),
                createCell("1,200.00 / day", false, true, 18),
                createCell("Chauffeur Allowance", false, false, 18)
              ]
            }),
            new TableRow({
              children: [
                createCell("5", false, false, 8),
                createCell("Toll Charges, FASTag, State Entry Taxes & Parking Fees", false, false, 36),
                createCell("At Actuals", false, true, 20),
                createCell("At Actuals", false, true, 18),
                createCell("Actuals with receipts", false, false, 18)
              ]
            })
          ]
        }),

        // Section 3: Compliance Matrix
        new Paragraph({
          spacing: { before: 70, after: 30 },
          children: [
            new TextRun({ text: "SECTION 3: INVEST UP 7-POINT SPECIFICATION & VENDOR COMPETITIVE ASSURANCES", bold: true, size: 16, color: "0F172A", font: 'Calibri' })
          ]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createCell("Sl. No", true, false, 8),
                createCell("Invest UP BOQ Parameter / Tender Condition", true, false, 72),
                createCell("Compliance Status", true, false, 20)
              ]
            }),
            new TableRow({
              children: [
                createCell("1", false, false, 8),
                createCell("2,000 KM Monthly Usage Quota (Otteri reading start/end)", false, false, 72),
                createCell("✔ Yes", false, false, 20, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("2", false, false, 8),
                createCell("Consolidated Monthly Billing with trip logsheets", false, false, 72),
                createCell("✔ Yes", false, false, 20, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("3", false, false, 8),
                createCell("Statutory Validity: Insurance, PUC, DL, RC, BS-VI", false, false, 72),
                createCell("✔ Yes", false, false, 20, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("4", false, false, 8),
                createCell("All-Inclusive Cost: Fuel & Chauffeur (10h shift with 13h buffer)", false, false, 72),
                createCell("✔ Yes", false, false, 20, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("5", false, false, 8),
                createCell("Operational Corridor: KTCC Industrial Region", false, false, 72),
                createCell("✔ Yes", false, false, 20, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("6", false, false, 8),
                createCell("Vehicle Age: Less than 3 Years (Brand New / BS-VI)", false, false, 72),
                createCell("✔ Yes", false, false, 20, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("7", false, false, 8),
                createCell("Vehicle Class: Dedicated MUV (Kia Carens / Ertiga) + 2h Backup", false, false, 72),
                createCell("✔ Yes", false, false, 20, "ECFDF5")
              ]
            })
          ]
        }),

        // Section 4: Terms & Conditions
        new Paragraph({
          spacing: { before: 70, after: 30 },
          children: [
            new TextRun({ text: "SECTION 4: TERMS & CONDITIONS & VENDOR COMPETITIVE ADVANTAGES", bold: true, size: 16, color: "0F172A", font: 'Calibri' })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• 13-Hour Overtime Cushion: ", bold: true, size: 14, font: 'Calibri' }),
            new TextRun({ text: "Base package is 10 hours/day. Overtime charges waived up to 13 hours/day. Extra hours billed ONLY after 13th hour.\n", size: 14, font: 'Calibri' }),
            new TextRun({ text: "• Outstation & Night Charges: ", bold: true, size: 14, font: 'Calibri' }),
            new TextRun({ text: "Day outstation trips included in 2,000 km. Outstation overnight driver halt (₹500/night) not included; billed on actuals.\n", size: 14, font: 'Calibri' }),
            new TextRun({ text: "• Guaranteed 2-Hour Backup Car: ", bold: true, size: 14, font: 'Calibri' }),
            new TextRun({ text: "Replacement 7-seater MUV deployed at Olympia Cyberspace within 2 hours if service/breakdown occurs.\n", size: 14, font: 'Calibri' }),
            new TextRun({ text: "• Live GPS Fleet Tracking: ", bold: true, size: 14, font: 'Calibri' }),
            new TextRun({ text: "Dedicated live GPS web/mobile tracking access provided to SIPO administration for safety & audit.\n", size: 14, font: 'Calibri' }),
            new TextRun({ text: "• Police-Verified Chauffeur: ", bold: true, size: 14, font: 'Calibri' }),
            new TextRun({ text: "Police Clearance Certificate (PCC) and commercial PSV badge submitted on Day 1.\n", size: 14, font: 'Calibri' }),
            new TextRun({ text: "• Zero Dead-Mileage: ", bold: true, size: 14, font: 'Calibri' }),
            new TextRun({ text: "KM and Time start upon morning Otteri pickup and close upon evening Otteri drop. No garage dead-KM.\n", size: 14, font: 'Calibri' }),
            new TextRun({ text: "• Payment Terms: ", bold: true, size: 14, font: 'Calibri' }),
            new TextRun({ text: "Payment within 15 days of monthly invoice submission with certified duty slips via NEFT / RTGS.", size: 14, font: 'Calibri' })
          ]
        }),

        // Signatures
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({ text: "Digitally signed by Saravanan Kuppusamy\n", bold: true, size: 15, font: 'Calibri' }),
            new TextRun({ text: "Date: 2026.11.05 14:30:00 +05'30'\n\n", size: 14, font: 'Calibri' }),
            new TextRun({ text: "For KALIDASS TRAVELS, CHENNAI\n", bold: true, size: 15, font: 'Calibri' }),
            new TextRun({ text: "Authorised Signatory | Mobile: 6381939769, 8939539211", size: 14, color: "475569", font: 'Calibri' })
          ]
        }),

        // Footer
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80 },
          children: [
            new TextRun({ text: "GSTIN : 33COVPM0531D1Z4\n", bold: true, size: 13, font: 'Calibri' }),
            new TextRun({ text: "NO.4/220, E88, Ponniamman Koil Street, Annamalai Nagar, Medavakkam, Chennai, Tamil Nadu, 600100", size: 12, color: "475569", font: 'Calibri' })
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '..', 'Kalidass_Travels_SIPO_InvestUP_Quotation.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Word quotation successfully generated: ${outputPath}`);
}

generateDocx();
