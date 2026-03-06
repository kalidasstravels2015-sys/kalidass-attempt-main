/* empty css                                         */
import { c as createComponent, r as renderComponent, a as renderTemplate } from '../../chunks/astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_D-d8fNH6.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { ArrowRight, CheckCircle, FileText, CreditCard, ShieldCheck, Briefcase, Download, Mail, ChevronUp, MessageCircle, XCircle, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
export { renderers } from '../../renderers.mjs';

const RateRow = ({ service, vehicle, rate, details }) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-100 hover:bg-slate-50 transition-colors", children: [
  /* @__PURE__ */ jsxs("td", { className: "p-4 align-top", children: [
    /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900", children: service }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500 mt-1 md:hidden", children: vehicle })
  ] }),
  /* @__PURE__ */ jsx("td", { className: "p-4 align-top hidden md:table-cell", children: /* @__PURE__ */ jsx("div", { className: "text-slate-700 font-medium", children: vehicle }) }),
  /* @__PURE__ */ jsxs("td", { className: "p-4 align-top", children: [
    /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900 text-lg", children: rate }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: "+ GST" })
  ] }),
  /* @__PURE__ */ jsx("td", { className: "p-4 align-top", children: /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-600 space-y-1", children: details.map((detail, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
    /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 text-blue-500 mr-2 flex-shrink-0" }),
    detail
  ] }, idx)) }) })
] });
const FeatureItem = ({ icon: Icon, title, desc }) => /* @__PURE__ */ jsxs("div", { className: "flex items-start p-4 rounded-lg bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow", children: [
  /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 mt-1", children: /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6 text-blue-600" }) }),
  /* @__PURE__ */ jsxs("div", { className: "ml-4", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-slate-900", children: title }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-600 leading-relaxed", children: desc })
  ] })
] });
const ComparisonRow = ({ feature, appCab, corporateFleet }) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 py-3 border-b border-slate-100 last:border-0 text-sm", children: [
  /* @__PURE__ */ jsx("div", { className: "font-semibold text-slate-700", children: feature }),
  /* @__PURE__ */ jsxs("div", { className: "text-red-500 flex items-center", children: [
    /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4 mr-1 md:mr-2 flex-shrink-0" }),
    " ",
    /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: appCab })
  ] }),
  /* @__PURE__ */ jsxs("div", { className: "text-green-600 font-bold flex items-center", children: [
    /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 mr-1 md:mr-2 flex-shrink-0" }),
    " ",
    /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: corporateFleet })
  ] })
] });
const AccordionItem = ({ question, answer, isOpen, onClick }) => /* @__PURE__ */ jsxs("div", { className: "border-b border-slate-200 last:border-0", children: [
  /* @__PURE__ */ jsxs(
    "button",
    {
      className: "w-full py-4 px-2 flex justify-between items-center text-left focus:outline-none hover:bg-slate-50 transition-colors",
      onClick,
      children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-900 text-sm md:text-base pr-4", children: question }),
        isOpen ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-5 h-5 text-blue-600 flex-shrink-0" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-slate-400 flex-shrink-0" })
      ]
    }
  ),
  isOpen && /* @__PURE__ */ jsx("div", { className: "px-2 pb-6 text-slate-600 text-sm leading-relaxed", children: answer })
] });
function BusinessTravel() {
  const [openFaq, setOpenFaq] = useState(0);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    address: "",
    gst: "",
    phone: "",
    email: ""
  });
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const generatePDF = () => {
    const doc = new jsPDF();
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("KALIDASS TRAVELS", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("No. 4/220, E88, Ponniamman Kovil Street, Annamalai Nagar,", 105, 27, { align: "center" });
    doc.text("Medavakkam, Chennai - 600 100.", 105, 32, { align: "center" });
    doc.text("GSTIN: 33COVPM0531D1Z4", 105, 37, { align: "center" });
    doc.text("Phone: +91 90923 03060 | Email: bookings@kalidasstravels.in", 105, 42, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(20, 47, 190, 47);
    doc.setFontSize(10);
    doc.text(`Date: ${currentDate}`, 20, 55);
    doc.setFont("helvetica", "bold");
    doc.text("To,", 20, 65);
    doc.setFont("helvetica", "normal");
    doc.text(formData.companyName || "[Company Name]", 20, 72);
    const addressLines = doc.splitTextToSize(formData.address || "[Company Address]", 170);
    let yPos = 77;
    addressLines.forEach((line) => {
      doc.text(line, 20, yPos);
      yPos += 5;
    });
    if (formData.gst) {
      doc.text(`GST: ${formData.gst}`, 20, yPos + 2);
      yPos += 7;
    } else {
      yPos += 2;
    }
    doc.setFont("helvetica", "bold");
    doc.text("Subject: Quotation for Corporate Business Travel Services", 20, yPos + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Respected Sir/Madam,", 20, yPos + 15);
    const intro = "Thank you for your interest in our Business Travel Services. We are pleased to present our standard corporate tariff for your consideration:";
    const introLines = doc.splitTextToSize(intro, 170);
    yPos += 22;
    introLines.forEach((line) => {
      doc.text(line, 20, yPos);
      yPos += 5;
    });
    yPos += 8;
    doc.setFont("helvetica", "bold");
    doc.setFillColor(15, 23, 42);
    doc.rect(20, yPos, 170, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text("CORPORATE TARIFF (Chennai)", 105, yPos + 5.5, { align: "center" });
    yPos += 8;
    doc.setFillColor(226, 232, 240);
    doc.rect(20, yPos, 170, 10, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Service Package", 25, yPos + 6.5);
    doc.text("Vehicle Type", 70, yPos + 6.5);
    doc.text("Rate", 120, yPos + 6.5);
    doc.text("Inclusions / Notes", 150, yPos + 6.5);
    yPos += 10;
    const drawRow = (service, vehicle, rate, notes, isFirst = false) => {
      const rowHeight = 20;
      if (isFirst) {
        doc.setFillColor(240, 249, 255);
        doc.rect(20, yPos, 170, rowHeight, "F");
      }
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(service, 22, yPos + 8);
      doc.setFont("helvetica", "normal");
      doc.text(vehicle, 70, yPos + 8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text(rate, 120, yPos + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("(+ GST)", 120, yPos + 12);
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      const noteLines = doc.splitTextToSize(notes, 35);
      doc.text(noteLines, 150, yPos + 8);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(20, yPos + rowHeight, 190, yPos + rowHeight);
      yPos += rowHeight;
    };
    drawRow("Airport Drop", "Sedan (Etios/Dzire)", "₹950", "Zone A (Guindy/OMR). Parking at Actuals.", true);
    drawRow("8 Hrs / 80 Kms", "Sedan (Etios/Dzire)", "₹2,200", "Extra Km: ₹14/km\nExtra Hr: ₹150/hr");
    drawRow("8 Hrs / 80 Kms", "SUV (Innova)", "₹3,000", "Extra Km: ₹18/km\nExtra Hr: ₹250/hr");
    drawRow("Outstation Trip", "Innova Crysta", "₹22 / km", "Min 250 km/day.\nDriver Bata: ₹500/day");
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    const tableTop = yPos - 80;
    doc.line(65, tableTop, 65, yPos);
    doc.line(115, tableTop, 115, yPos);
    doc.line(145, tableTop, 145, yPos);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(20, tableTop, 170, yPos - tableTop);
    yPos += 5;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text("* Night Bata applicable 10 PM - 6 AM. Tolls & Parking at actuals.", 25, yPos);
    yPos += 15;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    const closing = "We look forward to serving your business travel needs with our premium fleet and professional chauffeurs.";
    doc.text(closing, 20, yPos);
    yPos += 10;
    doc.text("Thank you for considering Kalidass Travels.", 20, yPos);
    yPos += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Yours Sincerely,", 20, yPos);
    yPos += 10;
    doc.text("Perumal Manikumar", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text("Proprietor", 20, yPos + 5);
    doc.text("Kalidass Travels", 20, yPos + 10);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("This is a computer-generated quotation and does not require a signature.", 105, 285, { align: "center" });
    const fileName = `Kalidass_Travels_Business_Travel_Quote_${formData.companyName.replace(/\s+/g, "_") || "Corp"}.pdf`;
    doc.save(fileName);
    setShowQuoteForm(false);
    setFormData({
      companyName: "",
      address: "",
      gst: "",
      phone: "",
      email: ""
    });
  };
  const faqs = [
    {
      question: "How does the 'Bill-to-Company' process work?",
      answer: "We open a corporate account for your entity. Authorized employees can book rides via email/WhatsApp without paying cash. At the end of the month, we send a single consolidated GST invoice for all trips, payable within the agreed credit period."
    },
    {
      question: "Are there cancellation charges?",
      answer: "We have a flexible policy for corporates. No charge if cancelled 2 hours before the pickup time. This helps you manage last-minute meeting changes without penalties."
    },
    {
      question: "Do you provide GST invoices for Input Tax Credit?",
      answer: "Yes. Unlike B2C app cabs, every invoice we generate is a B2B Tax Invoice with your GSTIN and the correct SAC code, ensuring you can claim 100% Input Tax Credit."
    },
    {
      question: "Is there a night charge?",
      answer: "Yes, a standard Driver Bata (Night Allowance) is applicable for trips happening between 10:00 PM and 6:00 AM. This goes directly to the chauffeur."
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "font-sans text-slate-900 bg-white", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative bg-slate-900 text-white py-20 lg:py-28 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1554224155-1696413565d3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/40 z-0" }),
      /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10", children: /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "inline-block py-1 px-3 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6", children: "On-Demand Business Travel" }),
          /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight", children: [
            "Premium Corporate Cabs. ",
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("span", { className: "text-blue-500", children: "No Surge. No Cancellations." })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-300 mb-8 leading-relaxed border-l-4 border-blue-500 pl-6", children: "Professional chauffeur services for your client meetings, airport transfers, and site visits. Book 24/7, we bill your company at month-end." }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-4", children: /* @__PURE__ */ jsxs("button", { className: "bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-lg font-bold transition-all flex items-center shadow-lg shadow-blue-900/50", children: [
            "Book a Ride ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 ml-2" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-white mb-4", children: "Who is this for?" }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: [
            "Daily official visits & Sales rounds",
            "Client meetings & Airport pickups",
            "Transporting staff safely (Late shifts)",
            "Management-level mobility"
          ].map((item, idx) => /* @__PURE__ */ jsxs("li", { className: "flex items-center text-slate-200 text-sm", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-400 mr-3 flex-shrink-0" }),
            item
          ] }, idx)) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-slate-50", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center max-w-2xl mx-auto mb-12", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-slate-900", children: "Transparent Standard Rates" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-3", children: "Fixed corporate tariffs for Chennai. No surge pricing ever." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-5xl mx-auto", children: [
        /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-100 text-slate-700 text-xs md:text-sm uppercase tracking-wider", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "p-4 border-b border-slate-200 font-bold", children: "Service Package" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 border-b border-slate-200 font-bold hidden md:table-cell", children: "Vehicle Type" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 border-b border-slate-200 font-bold", children: "Base Rate" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 border-b border-slate-200 font-bold", children: "Inclusions / Notes" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100", children: [
            /* @__PURE__ */ jsx(
              RateRow,
              {
                service: "Airport Drop",
                vehicle: "Sedan (Etios/Dzire)",
                rate: "₹950",
                details: ["Zone A (Guindy/OMR)", "Meet & Greet included", "Parking at Actuals"]
              }
            ),
            /* @__PURE__ */ jsx(
              RateRow,
              {
                service: "8 Hrs / 80 Kms",
                vehicle: "Sedan (Etios/Dzire)",
                rate: "₹2,200",
                details: ["Extra Km: ₹14/km", "Extra Hr: ₹150/hr", "Ideal for Local Sales"]
              }
            ),
            /* @__PURE__ */ jsx(
              RateRow,
              {
                service: "8 Hrs / 80 Kms",
                vehicle: "SUV (Innova)",
                rate: "₹3,000",
                details: ["Extra Km: ₹18/km", "Extra Hr: ₹250/hr", "Executive Comfort"]
              }
            ),
            /* @__PURE__ */ jsx(
              RateRow,
              {
                service: "Outstation Trip",
                vehicle: "Innova Crysta",
                rate: "₹22 / km",
                details: ["Min 250 km / day", "Driver Bata: ₹500/day", "Tolls at Actuals"]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 p-4 text-center text-xs text-blue-800 border-t border-blue-100", children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Note:" }),
          " Night Bata applicable between 10 PM - 6 AM. All rates exclusive of 5% GST."
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-white border-t border-slate-200", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-slate-900", children: 'The "Bill-to-Company" Advantage' }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-2", children: "Why Corporates switch from App Cabs to our Fleet." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsx(
            FeatureItem,
            {
              icon: FileText,
              title: "One Monthly Invoice",
              desc: "Stop collecting 50 reimbursement bills. Get one consolidated GST invoice."
            }
          ),
          /* @__PURE__ */ jsx(
            FeatureItem,
            {
              icon: CreditCard,
              title: "Cashless Travel",
              desc: "Employees book and ride. Company pays at month-end. No petty cash needed."
            }
          ),
          /* @__PURE__ */ jsx(
            FeatureItem,
            {
              icon: ShieldCheck,
              title: "Zero Cancellations",
              desc: "Our drivers don't ask 'Drop location?'. Guaranteed pickup for scheduled rides."
            }
          ),
          /* @__PURE__ */ jsx(
            FeatureItem,
            {
              icon: Briefcase,
              title: "GST Input Credit",
              desc: "100% compliant B2B invoices ensure you don't lose money on taxes."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 rounded-xl p-8 border border-slate-200", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-900 mb-6", children: "App Cabs vs. Corporate Fleet" }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 bg-slate-100 p-3 font-bold text-xs text-slate-500 uppercase tracking-wide", children: [
              /* @__PURE__ */ jsx("div", { children: "Feature" }),
              /* @__PURE__ */ jsx("div", { children: "App Cabs" }),
              /* @__PURE__ */ jsx("div", { children: "Our Fleet" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-2", children: [
              /* @__PURE__ */ jsx(ComparisonRow, { feature: "Pricing", appCab: "Surge Pricing", corporateFleet: "Fixed Rates" }),
              /* @__PURE__ */ jsx(ComparisonRow, { feature: "Reliability", appCab: "May Cancel", corporateFleet: "Guaranteed" }),
              /* @__PURE__ */ jsx(ComparisonRow, { feature: "Invoicing", appCab: "B2C Receipt", corporateFleet: "B2B Tax Invoice" }),
              /* @__PURE__ */ jsx(ComparisonRow, { feature: "Peak Hrs", appCab: "Unavailable", corporateFleet: "Pre-booked" })
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-slate-50", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-900 mb-8 text-center", children: "Frequently Asked Questions" }),
      /* @__PURE__ */ jsx("div", { className: "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", children: faqs.map((faq, index) => /* @__PURE__ */ jsx(
        AccordionItem,
        {
          question: faq.question,
          answer: faq.answer,
          isOpen: openFaq === index,
          onClick: () => setOpenFaq(openFaq === index ? -1 : index)
        },
        index
      )) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-gradient-to-br from-blue-50 to-slate-50", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-slate-900 mb-4", children: "Download Personalized Quotation" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-600", children: "Get a professional quotation letter with our rate sheet in PDF format" })
      ] }),
      !showQuoteForm ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-center gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowQuoteForm(true),
              className: "inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto justify-center",
              children: [
                /* @__PURE__ */ jsx(Download, { className: "w-6 h-6" }),
                "Generate Quotation PDF"
              ]
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-3", children: "Instant PDF download with standard rates" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "mailto:bookings@kalidasstravels.in?subject=Custom%20Quotation%20Request%20-%20Business%20Travel&body=Dear%20Kalidass%20Travels%20Team%2C%0A%0AI%20would%20like%20to%20request%20a%20custom%20quotation%20for%20Business%20Travel%20Services.%0A%0ACompany%20Details%3A%0AName%3A%20%5BYour%20Company%20Name%5D%0AAddress%3A%20%5BYour%20Company%20Address%5D%0A%0ARequirements%3A%0A-%20Type%20of%20service%20(Airport/Hourly/Outstation)%3A%20%0A-%20Vehicle%20preference%3A%20%0A-%20Expected%20monthly%20volume%3A%20%0A%0APlease%20provide%20a%20detailed%20quotation.%0A%0AThank%20you%2C%0A%5BYour%20Name%5D",
              className: "inline-flex items-center gap-3 bg-white hover:bg-slate-50 border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto justify-center",
              children: [
                /* @__PURE__ */ jsx(Mail, { className: "w-6 h-6" }),
                "Send Custom Request"
              ]
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-3", children: "For specific requirements via Email" })
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 border border-slate-200", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-900", children: "Enter Company Details" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setShowQuoteForm(false),
              className: "text-slate-400 hover:text-slate-600 transition-colors",
              children: /* @__PURE__ */ jsx(ChevronUp, { className: "w-6 h-6" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-slate-700 mb-2", children: [
              "Company Name ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "companyName",
                value: formData.companyName,
                onChange: handleInputChange,
                placeholder: "e.g., ABC Technologies Pvt Ltd",
                required: true,
                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-slate-700 mb-2", children: [
              "Company Address ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                name: "address",
                value: formData.address,
                onChange: handleInputChange,
                placeholder: "e.g., 123 OMR, Thoraipakkam, Chennai - 600097",
                required: true,
                rows: "3",
                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-slate-700 mb-2", children: [
              "GST Number ",
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs", children: "(Optional)" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                name: "gst",
                value: formData.gst,
                onChange: handleInputChange,
                placeholder: "e.g., 33XXXXX1234X1ZX",
                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-slate-700 mb-2", children: [
                "Phone ",
                /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "tel",
                  name: "phone",
                  value: formData.phone,
                  onChange: handleInputChange,
                  placeholder: "e.g., +91 98765 43210",
                  className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-sm font-semibold text-slate-700 mb-2", children: [
                "Email ",
                /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs", children: "(Optional)" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  name: "email",
                  value: formData.email,
                  onChange: handleInputChange,
                  placeholder: "e.g., hr@company.com",
                  className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pt-4 space-y-3", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: generatePDF,
                disabled: !formData.companyName || !formData.address,
                className: "w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3",
                children: [
                  /* @__PURE__ */ jsx(Download, { className: "w-5 h-5" }),
                  "Download Quotation PDF"
                ]
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 text-center mt-3", children: "A professional quotation letter will be generated with our rate sheet" })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-gradient-to-br from-green-600 to-green-700 text-white py-16", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx(MessageCircle, { className: "w-16 h-16 mx-auto mb-4 animate-pulse" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: "Have Questions? Let's Chat!" }),
      /* @__PURE__ */ jsx("p", { className: "text-green-50 text-lg mb-8 max-w-2xl mx-auto", children: "Get instant answers about our business travel packages, billing, or custom requirements." }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://wa.me/919092303060?text=Hi%2C%20I%27m%20interested%20in%20Business%20Travel%20Services.%20I%20have%20some%20questions.",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "inline-flex items-center justify-center gap-3 bg-white text-green-600 hover:bg-green-50 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1",
          children: [
            /* @__PURE__ */ jsx(MessageCircle, { className: "w-6 h-6" }),
            "Chat on WhatsApp"
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-green-100 text-sm mt-6", children: "💬 Typical response time: Under 5 minutes during business hours" })
    ] }) })
  ] });
}

const $$BusinessTravel = createComponent(($$result, $$props, $$slots) => {
  const title = "On-Demand Business Travel - Premium Corporate Cab Service";
  const description = "Professional chauffeur services for corporate travel, client meetings, and airport transfers. Fixed rates, no surge pricing, bill-to-company facility with GST invoices.";
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description,
    provider: {
      "@type": "Organization",
      name: "Kalidass Travels"
    }
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${title} - Kalidass Travels`, "description": description, "schema": schema }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "BusinessTravel", BusinessTravel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/BusinessTravel.jsx", "client:component-export": "default" })} ` })}`;
}, "D:/websites/kalidass-attempt-main/src/pages/services/business-travel.astro", void 0);

const $$file = "D:/websites/kalidass-attempt-main/src/pages/services/business-travel.astro";
const $$url = "/services/business-travel";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$BusinessTravel,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
