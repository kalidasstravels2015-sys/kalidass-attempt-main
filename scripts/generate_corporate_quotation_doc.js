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
            new TextRun({ text: "KALIDASS TRAVELS — CHENNAI", bold: true, size: 26, color: "0F172A", font: 'Calibri' }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Commercial Chauffeur & Corporate Mobility Solutions (Est. 2015)", size: 16, color: "475569", font: 'Calibri' }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Operational Hubs: Guindy / Mount Poonamallee Road / Medavakkam, Chennai - 600 089", size: 15, color: "475569", font: 'Calibri' }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "24x7 Corporate Operations: +91 89395 39211 | kalidasstravels2015@gmail.com | kalidasstravels.in", bold: true, size: 16, color: "2563EB", font: 'Calibri' }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: "SUPPLIER GSTIN: 33AAIFK7823P1Z9  |  STATE: TAMIL NADU (33)  |  SAC: 996601", size: 15, bold: true, color: "047857", font: 'Calibri' }),
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
                        new TextRun({ text: "FORMAL COMMERCIAL GST QUOTATION & BOQ RESPONSE", bold: true, color: "FFFFFF", size: 18, font: 'Calibri' }),
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
          new TextRun({ text: "Ref No: ", bold: true, size: 16, font: 'Calibri' }),
          new TextRun({ text: "KT/SIPO-INVESTUP/2026-27/092    |    ", size: 16, font: 'Calibri' }),
          new TextRun({ text: "Date: ", bold: true, size: 16, font: 'Calibri' }),
          new TextRun({ text: "04 November 2026    |    ", size: 16, font: 'Calibri' }),
          new TextRun({ text: "Place of Supply: ", bold: true, size: 16, font: 'Calibri' }),
          new TextRun({ text: "33 - Tamil Nadu", size: 16, font: 'Calibri' })
        ]}),

        new Paragraph({ spacing: { after: 80 }, children: [
          new TextRun({ text: "TO:\n", bold: true, size: 16, font: 'Calibri' }),
          new TextRun({ text: "The General Manager / State Investment Promotion Officer,\n", bold: true, size: 16, font: 'Calibri' }),
          new TextRun({ text: "State Investment Promotion Office (SIPO) Chennai,\n", bold: true, size: 16, font: 'Calibri' }),
          new TextRun({ text: "Invest UP (Government of Uttar Pradesh),\n", bold: true, size: 16, color: "047857", font: 'Calibri' }),
          new TextRun({ text: "Olympia Cyberspace Pvt. Ltd., No. 21 & 22, Arulayiammanpettai, 2nd Street, Alandur Road, Guindy, Chennai - 600 032.\n", size: 15, font: 'Calibri' }),
          new TextRun({ text: "Email: gmsipo_chennai@investup.org.in | Attn: Logapriya Loks", bold: true, size: 15, color: "2563EB", font: 'Calibri' })
        ]}),

        new Paragraph({
          spacing: { before: 40, after: 100 },
          children: [
            new TextRun({ text: "SUBJECT: ", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "Commercial Quotation & BOQ for Monthly Hiring of Dedicated MUV (Maruti Ertiga / Kia Carens) with Chauffeur and Fuel for SIPO Chennai Office & KTCC Industrial Operations.", bold: true, size: 16, font: 'Calibri', color: "0F172A" })
          ]
        }),

        // Section 1: BOQ Table
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: "1. COMMERCIAL TARIFF & BOQ (8 HOURS & 12 HOURS DUTY SLABS)", bold: true, size: 17, color: "0F172A", font: 'Calibri' })
          ]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createCell("Item", true, false, 8),
                createCell("Vehicle Class & Specification", true, false, 28),
                createCell("SAC", true, false, 10),
                createCell("Monthly Duty Slab\n(26 Days / 2000 KM)", true, false, 18),
                createCell("Taxable (₹)", true, true, 13),
                createCell("CGST 2.5%", true, true, 11),
                createCell("SGST 2.5%", true, true, 11),
                createCell("Landed Total\n(Incl. 5% GST)", true, true, 13, "1E293B")
              ]
            }),
            new TableRow({
              children: [
                createCell("1A", false, false, 8),
                createCell("Maruti Suzuki Ertiga (Brand New BS-VI, AC, Smart Hybrid)\nDedicated 0-KM / Latest Batch | 6+1 Seater | Commercial T-Board", false, false, 28),
                createCell("996601", false, false, 10),
                createCell("08 Hours / Day", false, false, 18),
                createCell("₹ 72,000", false, true, 13),
                createCell("₹ 1,800", false, true, 11),
                createCell("₹ 1,800", false, true, 11),
                createCell("₹ 75,600", false, true, 13, "F1F5F9")
              ]
            }),
            new TableRow({
              children: [
                createCell("1B", false, false, 8),
                createCell("Maruti Suzuki Ertiga (Brand New BS-VI, AC, Smart Hybrid)\nDedicated 0-KM / Latest Batch | 6+1 Seater | Commercial T-Board", false, false, 28),
                createCell("996601", false, false, 10),
                createCell("12 Hours / Day", false, false, 18),
                createCell("₹ 78,000", false, true, 13),
                createCell("₹ 1,950", false, true, 11),
                createCell("₹ 1,950", false, true, 11),
                createCell("₹ 81,900", false, true, 13, "F1F5F9")
              ]
            }),
            new TableRow({
              children: [
                createCell("2A", false, false, 8),
                createCell("Kia Carens (Brand New BS-VI, Executive Premium MUV, AC)\nDedicated 0-KM / Latest Batch | 6+1 Seater | Commercial T-Board", false, false, 28),
                createCell("996601", false, false, 10),
                createCell("08 Hours / Day", false, false, 18),
                createCell("₹ 80,000", false, true, 13),
                createCell("₹ 2,000", false, true, 11),
                createCell("₹ 2,000", false, true, 11),
                createCell("₹ 84,000", false, true, 13, "F1F5F9")
              ]
            }),
            new TableRow({
              children: [
                createCell("2B", false, false, 8),
                createCell("Kia Carens (Brand New BS-VI, Executive Premium MUV, AC)\nDedicated 0-KM / Latest Batch | 6+1 Seater | Commercial T-Board", false, false, 28),
                createCell("996601", false, false, 10),
                createCell("12 Hours / Day", false, false, 18),
                createCell("₹ 88,000", false, true, 13),
                createCell("₹ 2,200", false, true, 11),
                createCell("₹ 2,200", false, true, 11),
                createCell("₹ 92,400", false, true, 13, "F1F5F9")
              ]
            })
          ]
        }),

        // Section 2: Extra Usage Surcharges
        new Paragraph({
          spacing: { before: 90, after: 40 },
          children: [
            new TextRun({ text: "2. EXTRA CHARGES & OVERTIME SLABS (BEYOND MONTHLY QUOTA)", bold: true, size: 17, color: "0F172A", font: 'Calibri' })
          ]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createCell("Billing Parameter", true, false, 40),
                createCell("Maruti Suzuki Ertiga", true, true, 20),
                createCell("Kia Carens", true, true, 20),
                createCell("GST Applicable", true, false, 20)
              ]
            }),
            new TableRow({
              children: [
                createCell("Extra Kilometers (Beyond 2,000 KM in calendar month)", false, false, 40),
                createCell("₹ 17 / km", false, true, 20),
                createCell("₹ 20 / km", false, true, 20),
                createCell("+ 5% GST (SAC 996601)", false, false, 20)
              ]
            }),
            new TableRow({
              children: [
                createCell("Extra Duty Hours (Beyond selected 8h or 12h shift)", false, false, 40),
                createCell("₹ 150 / hr", false, true, 20),
                createCell("₹ 180 / hr", false, true, 20),
                createCell("+ 5% GST (SAC 996601)", false, false, 20)
              ]
            }),
            new TableRow({
              children: [
                createCell("Sunday / Holiday Deployment (Chauffeur Allowance)", false, false, 40),
                createCell("₹ 1,200 / day", false, true, 20),
                createCell("₹ 1,200 / day", false, true, 20),
                createCell("Direct Driver Allowance", false, false, 20)
              ]
            })
          ]
        }),

        // Section 3: Compliance Matrix
        new Paragraph({
          spacing: { before: 90, after: 40 },
          children: [
            new TextRun({ text: "3. INVEST UP 7-POINT SPECIFICATION & COMPLIANCE MATRIX", bold: true, size: 17, color: "0F172A", font: 'Calibri' })
          ]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: tableBorder,
          rows: [
            new TableRow({
              children: [
                createCell("Sl.", true, false, 6),
                createCell("Invest UP RFP Requirement", true, false, 34),
                createCell("Kalidass Travels Contractual Commitment", true, false, 45),
                createCell("Compliance", true, false, 15)
              ]
            }),
            new TableRow({
              children: [
                createCell("1", false, false, 6),
                createCell("2000 KM per month", false, false, 34),
                createCell("Fully included in the monthly base rental. Daily odometer logged transparently.", false, false, 45),
                createCell("100% COMPLIANT", false, false, 15, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("2", false, false, 6),
                createCell("Monthly billing", false, false, 34),
                createCell("Consolidated monthly GST tax invoice submitted on last working day with signed duty slips.", false, false, 45),
                createCell("100% COMPLIANT", false, false, 15, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("3", false, false, 6),
                createCell("Fully insured, PUC, DL, RC validity, BS 6", false, false, 34),
                createCell("Commercial Yellow-Board taxi with Comprehensive Passenger Insurance, valid PUC, RC, FC, and PSV-badged chauffeur.", false, false, 45),
                createCell("100% COMPLIANT", false, false, 15, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("4", false, false, 6),
                createCell("Cost to include fuel and driver (8h / 12h)", false, false, 34),
                createCell("Wet Lease Model: 100% fuel, driver salary, uniform, and daily allowance included in base price.", false, false, 45),
                createCell("100% COMPLIANT", false, false, 15, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("5", false, false, 6),
                createCell("Region: KTCC (Kanchipuram, Thiruvallur, Chennai, Chengalpattu)", false, false, 34),
                createCell("Full coverage across all major industrial parks (Sriperumbudur, Oragadam, Irungattukottai, Mahindra World City, Maraimalai Nagar).", false, false, 45),
                createCell("100% COMPLIANT", false, false, 15, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("6", false, false, 6),
                createCell("Vehicle Age: Less than 3 years", false, false, 34),
                createCell("Strictly 2024 / 2025 / 2026 registered pristine commercial vehicles deployed.", false, false, 45),
                createCell("100% COMPLIANT", false, false, 15, "ECFDF5")
              ]
            }),
            new TableRow({
              children: [
                createCell("7", false, false, 6),
                createCell("Vehicle Class: Ertiga / KIA Carens", false, false, 34),
                createCell("Dedicated 7-seater MUV with guaranteed 60-90 min backup replacement vehicle in case of service or breakdown.", false, false, 45),
                createCell("100% COMPLIANT", false, false, 15, "ECFDF5")
              ]
            })
          ]
        }),

        // Section 4: Finance, GST & Banking Details
        new Paragraph({
          spacing: { before: 90, after: 40 },
          children: [
            new TextRun({ text: "4. STATUTORY GST, REVERSE CHARGE (RCM) & BANKING PARTICULARS", bold: true, size: 17, color: "0F172A", font: 'Calibri' })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• Service Accounting Code (SAC): ", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "996601 (Rental services of passenger motor vehicles with operator and fuel / Wet Lease).\n", size: 16, font: 'Calibri' }),
            new TextRun({ text: "• Applicable GST Rate: ", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "5% GST (2.5% CGST + 2.5% SGST) for intra-state passenger transport in Tamil Nadu.\n", size: 16, font: 'Calibri' }),
            new TextRun({ text: "• Reverse Charge Mechanism (RCM): ", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "Under Notification No. 22/2019 & 29/2019-Central Tax (Rate), 5% GST is payable by Client under RCM Section 9(3) if Body Corporate. If Forward Charge is preferred, Kalidass Travels issues GST Tax Invoice.\n", size: 16, font: 'Calibri' }),
            new TextRun({ text: "• Beneficiary Bank Details: ", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "Bank: State Bank of India | Account Name: KALIDASS TRAVELS | Current A/c No: 38921104823 | IFSC: SBIN0012345 (Medavakkam Branch, Chennai).\n", size: 16, font: 'Calibri' }),
            new TextRun({ text: "• Zero Dead-Mileage: ", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "Daily duty KM and time start and close strictly at Invest UP Chennai Office (Olympia Cyberspace, Guindy).\n", size: 16, font: 'Calibri' }),
            new TextRun({ text: "• Payment Terms: ", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "Consolidated monthly billing against verified duty log sheets. Payment credit period: 15 calendar days from invoice submission date.", size: 16, font: 'Calibri' })
          ]
        }),

        // Signatures
        new Paragraph({
          spacing: { before: 180 },
          children: [
            new TextRun({ text: "Confirmed & Accepted by Invest UP (SIPO Chennai):                    For KALIDASS TRAVELS, CHENNAI\n\n\n\n", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "_____________________________________________                    _____________________________________________\n", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "Authorized Signatory & Departmental Seal                                  Corporate Logistics & Fleet Desk\n", bold: true, size: 16, font: 'Calibri' }),
            new TextRun({ text: "                                                                                                   Phone: +91 89395 39211 | kalidasstravels2015@gmail.com", size: 14, color: "475569", font: 'Calibri' })
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '..', 'Kalidass_Travels_SIPO_InvestUP_Quotation.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Word quotation successfully generated: ${outputPath}`);

  try {
    const defaultPath = path.join(__dirname, '..', 'Kalidass_Travels_Corporate_Monthly_Quotation.docx');
    fs.writeFileSync(defaultPath, buffer);
    console.log(`Also updated default file: ${defaultPath}`);
  } catch (e) {
    console.log(`Default file locked`);
  }
}

generateDocx();
