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
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [
        new Paragraph({
          alignment: isRightAlign ? AlignmentType.RIGHT : AlignmentType.LEFT,
          children: [
            new TextRun({
              text: text,
              bold: isHeader,
              color: isHeader ? 'FFFFFF' : (bgColor ? '0F172A' : '1E293B'),
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
          margin: { top: 540, bottom: 540, left: 600, right: 600 }
        }
      },
      children: [
        // Header
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Kalidass Travels", bold: true, size: 28, color: "B91C1C", font: 'Calibri' }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Airport Drops | Destination Tours | Corporate Mobility", size: 16, color: "0369A1", font: 'Calibri', bold: true }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Mobile: 6381939769, 8939539211 | Website: kalidasstravels.in", size: 15, color: "0F172A", font: 'Calibri' }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: "GSTIN: 33COVPM0531D1Z4 | SAC CODE: 996601", size: 15, bold: true, color: "047857", font: 'Calibri' }),
          ]
        }),

        // Document Banner
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "0F172A", type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "FINAL COMMERCIAL GST QUOTATION & BOQ (10 HOURS / 26 DAYS DUTY)", bold: true, color: "FFFFFF", size: 18, font: 'Calibri' }),
                      ]
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "Monthly Dedicated Vehicle & Chauffeur Hiring Model for SIPO Chennai & KTCC Industrial Region", color: "94A3B8", size: 15, font: 'Calibri' }),
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),

        // Metadata & To Address
        new Paragraph({ spacing: { before: 100, after: 40 }, children: [
          new TextRun({ text: "REF NO: ", bold: true, size: 16, font: 'Calibri' }),
          new TextRun({ text: "QUO/2026-27/043    |    ", size: 16, font: 'Calibri' }),
          new TextRun({ text: "DATE: ", bold: true, size: 16, font: 'Calibri' }),
          new TextRun({ text: "05 November 2026    |    ", size: 16, font: 'Calibri' }),
          new TextRun({ text: "PLACE OF SUPPLY: ", bold: true, size: 16, font: 'Calibri' }),
          new TextRun({ text: "33 - Tamil Nadu", size: 16, font: 'Calibri' })
        ]}),

        new Paragraph({ spacing: { after: 80 }, children: [
          new TextRun({ text: "TO:\n", bold: true, size: 16, font: 'Calibri' }),
          new TextRun({ text: "The Office In Charge,\n", bold: true, size: 16, font: 'Calibri' }),
          new TextRun({ text: "State Investment Promotion Office (SIPO) Chennai,\n", bold: true, size: 16, font: 'Calibri' }),
          new TextRun({ text: "Invest UP,\n", bold: true, size: 16, color: "047857", font: 'Calibri' }),
          new TextRun({ text: "Olympia Cyberspace Pvt. Ltd. No. 21 & 22, Arulayiammanpettai, 2nd Street, Alandur Road, Guindy, Chennai - 600 032.\n", size: 15, font: 'Calibri' }),
          new TextRun({ text: "Email: gmsipo_chennai@investup.org.in | Attn: Logapriya Loks", bold: true, size: 15, color: "2563EB", font: 'Calibri' })
        ]}),

        new Paragraph({
          spacing: { before: 40, after: 100 },
          children: [
            new TextRun({ text: "SUBJECT: ", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "Final Commercial Quotation & BOQ for Monthly Dedicated Hiring of BS-VI MUV (Kia Carens [Preferred] & Maruti Ertiga) for 10 Hours Duty / 26 Days / 2,000 KM for Invest UP SIPO Chennai.", bold: true, size: 16, font: 'Calibri', color: "0F172A" })
          ]
        }),

        // Section 1: BOQ Table
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: "SECTION 1: COMMERCIAL BOQ — 10 HOURS DAILY DUTY / 26 DAYS / 2,000 KM MONTHLY", bold: true, size: 17, color: "0F172A", font: 'Calibri' })
          ]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createCell("Sl. No", true, false, 8),
                createCell("Name of Vehicle & Specification", true, false, 32),
                createCell("SAC Code", true, false, 10),
                createCell("Duty Shift\n(26 Days/2000 KM)", true, false, 16),
                createCell("Taxable Value", true, true, 13),
                createCell("CGST 2.5%", true, true, 10),
                createCell("SGST 2.5%", true, true, 10),
                createCell("Total Amount\n(Incl. 5% GST)", true, true, 14, "1E293B")
              ]
            }),
            new TableRow({
              children: [
                createCell("1", false, false, 8),
                createCell("Kia Carens (Brand New BS-VI, AC, 6+1)\n★ PREFERRED CHOICE | Executive MUV", false, false, 32),
                createCell("996601", false, false, 10),
                createCell("10 Hours / Day", false, false, 16),
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
                createCell("10 Hours / Day", false, false, 16),
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
          spacing: { before: 90, after: 40 },
          children: [
            new TextRun({ text: "SECTION 2: EXTRA RUNNING CHARGES & OVERTIME SLABS (BEYOND 10 HOURS / 2,000 KM)", bold: true, size: 17, color: "0F172A", font: 'Calibri' })
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
                createCell("Extra Duty Hours (Beyond selected 10h daily shift)", false, false, 36),
                createCell("180.00 / hr", false, true, 20),
                createCell("150.00 / hr", false, true, 18),
                createCell("5% GST (SAC 996601)", false, false, 18)
              ]
            }),
            new TableRow({
              children: [
                createCell("3", false, false, 8),
                createCell("Sunday / Gazetted Holiday Deployment (Chauffeur Allowance)", false, false, 36),
                createCell("1,200.00 / day", false, true, 20),
                createCell("1,200.00 / day", false, true, 18),
                createCell("Chauffeur Allowance", false, false, 18)
              ]
            }),
            new TableRow({
              children: [
                createCell("4", false, false, 8),
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
          spacing: { before: 90, after: 40 },
          children: [
            new TextRun({ text: "SECTION 3: INVEST UP 7-POINT SPECIFICATION & TECHNICAL COMPLIANCE MATRIX", bold: true, size: 17, color: "0F172A", font: 'Calibri' })
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
                createCell("2,000 KM Monthly Usage Quota", false, false, 72),
                createCell("✔ Yes", false, false, 20, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("2", false, false, 8),
                createCell("Consolidated Monthly Billing", false, false, 72),
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
                createCell("All-Inclusive Cost: Fuel & Chauffeur (10h duty shift)", false, false, 72),
                createCell("✔ Yes", false, false, 20, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("5", false, false, 8),
                createCell("Operational Corridor: KTCC Region", false, false, 72),
                createCell("✔ Yes", false, false, 20, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("6", false, false, 8),
                createCell("Vehicle Age: Less than 3 Years (New / BS-VI)", false, false, 72),
                createCell("✔ Yes", false, false, 20, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("7", false, false, 8),
                createCell("Vehicle Class: Dedicated MUV (Kia Carens / Ertiga)", false, false, 72),
                createCell("✔ Yes", false, false, 20, "ECFDF5")
              ]
            })
          ]
        }),

        // Section 4: Terms & Conditions
        new Paragraph({
          spacing: { before: 90, after: 40 },
          children: [
            new TextRun({ text: "SECTION 4: TERMS & CONDITIONS", bold: true, size: 17, color: "0F172A", font: 'Calibri' })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• Monthly Package Inclusions: ", bold: true, size: 15, font: 'Calibri' }),
            new TextRun({ text: "Includes 2,000 km/month, dedicated chauffeur, vehicle EMI, 100% fuel, and scheduled maintenance.\n", size: 15, font: 'Calibri' }),
            new TextRun({ text: "• Zero Dead-Mileage Policy: ", bold: true, size: 15, font: 'Calibri' }),
            new TextRun({ text: "Duty hours and KM start/end at Invest UP SIPO office (Guindy). No garage dead-KM charged.\n", size: 15, font: 'Calibri' }),
            new TextRun({ text: "• Duty Slips & Overtime Billing: ", bold: true, size: 15, font: 'Calibri' }),
            new TextRun({ text: "Extra km (>2,000 km) and overtime (>10h) logged daily on signed duty slips; billed per Section 2 rates.\n", size: 15, font: 'Calibri' }),
            new TextRun({ text: "• Toll Charges, Parking & FASTag: ", bold: true, size: 15, font: 'Calibri' }),
            new TextRun({ text: "Toll, FASTag, state entry taxes, and parking charged at actuals against computerized receipts.\n", size: 15, font: 'Calibri' }),
            new TextRun({ text: "• Sunday / Holiday Deployment: ", bold: true, size: 15, font: 'Calibri' }),
            new TextRun({ text: "₹1,200/day chauffeur allowance applies on Sundays/holidays upon prior client requisition.\n", size: 15, font: 'Calibri' }),
            new TextRun({ text: "• Statutory GST Compliance: ", bold: true, size: 15, font: 'Calibri' }),
            new TextRun({ text: "SAC 996601 at 5% GST (2.5% CGST + 2.5% SGST). Payable under RCM by corporate or FCM.\n", size: 15, font: 'Calibri' }),
            new TextRun({ text: "• Payment & Credit Terms: ", bold: true, size: 15, font: 'Calibri' }),
            new TextRun({ text: "Payment within 15 days of monthly invoice submission with certified duty slips via NEFT / RTGS.", size: 15, font: 'Calibri' })
          ]
        }),

        // Signatures
        new Paragraph({
          spacing: { before: 140 },
          children: [
            new TextRun({ text: "Digitally signed by Saravanan Kuppusamy\n", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "Date: 2026.11.05 13:30:00 +05'30'\n\n", size: 15, font: 'Calibri' }),
            new TextRun({ text: "For KALIDASS TRAVELS, CHENNAI\n", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "Authorised Signatory | Mobile: 6381939769, 8939539211", size: 15, color: "475569", font: 'Calibri' })
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
