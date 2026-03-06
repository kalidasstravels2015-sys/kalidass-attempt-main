/* empty css                                         */
import { c as createComponent, r as renderComponent, a as renderTemplate } from '../../chunks/astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_D-d8fNH6.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { CheckCircle, Star, ChevronDown, Car, Users, FileText, ShieldCheck, Briefcase, Clock, MapPin, Download, Mail, ChevronUp, MessageCircle } from 'lucide-react';
import jsPDF from 'jspdf';
export { renderers } from '../../renderers.mjs';

const FeatureItem = ({ icon: Icon, title, desc }) => /* @__PURE__ */ jsxs("div", { className: "flex items-start p-4 rounded-lg bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow", children: [
  /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 mt-1", children: /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6 text-blue-600" }) }),
  /* @__PURE__ */ jsxs("div", { className: "ml-4", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-slate-900", children: title }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-slate-600 leading-relaxed", children: desc })
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
function EmployeeTransportation() {
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
    doc.text("Subject: Quotation for Employee Transportation Services", 20, yPos + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Respected Sir/Madam,", 20, yPos + 15);
    const intro = "Thank you for your interest in our Employee Transportation Services. We are pleased to present our monthly rental rates for your consideration:";
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
    doc.text("MONTHLY RENTAL RATES (Chennai)", 105, yPos + 5.5, { align: "center" });
    yPos += 8;
    doc.setFillColor(226, 232, 240);
    doc.rect(20, yPos, 170, 10, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Type", 25, yPos + 6.5);
    doc.text("Package Inclusions", 70, yPos + 6.5);
    doc.text("Duty Hours", 120, yPos + 6.5);
    doc.text("Fuel Policy", 155, yPos + 6.5);
    yPos += 10;
    const drawVehicleRow = (vehicleType, models, monthlyRate, breakdown, isFirst = false) => {
      const rowHeight = 28;
      if (isFirst) {
        doc.setFillColor(240, 249, 255);
        doc.rect(20, yPos, 170, rowHeight, "F");
      }
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(vehicleType, 22, yPos + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text(models, 22, yPos + 11);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(22, 163, 74);
      doc.text(monthlyRate, 22, yPos + 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("(+ GST)", 42, yPos + 18);
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.text("+ Vehicle Rent", 70, yPos + 7);
      doc.text("+ Professional Driver", 70, yPos + 12);
      doc.text("+ Maintenance & Insurance", 70, yPos + 17);
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text("(Monthly Fixed)", 70, yPos + 22);
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "normal");
      doc.text("10 Hrs/Day", 120, yPos + 9);
      doc.text("26 Days/Month", 120, yPos + 15);
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text("Client pays", 155, yPos + 9);
      doc.text("actuals", 155, yPos + 14);
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text("(Logbook tracked)", 155, yPos + 19);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(20, yPos + rowHeight, 190, yPos + rowHeight);
      yPos += rowHeight;
    };
    drawVehicleRow(
      "Sedan",
      "Dzire / Etios / Aura",
      "₹52,000",
      {},
      true
    );
    drawVehicleRow(
      "SUV",
      "Innova Crysta / Hycross",
      "₹75,000");
    drawVehicleRow(
      "Tempo Traveller",
      "Force Urbania / Traveller (12+)",
      "₹90,000");
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    const tableTop = yPos - 94;
    doc.line(65, tableTop, 65, yPos);
    doc.line(115, tableTop, 115, yPos);
    doc.line(150, tableTop, 150, yPos);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(20, tableTop, 170, yPos - tableTop);
    yPos += 3;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text("* Fuel, Tolls & Parking billed at actuals with supporting receipts attached to monthly invoice.", 25, yPos);
    yPos += 10;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    const closing = "We would be delighted to serve your organization and ensure safe, reliable transportation for your team. Please feel free to contact us for any clarifications.";
    const closingLines = doc.splitTextToSize(closing, 170);
    closingLines.forEach((line) => {
      doc.text(line, 20, yPos);
      yPos += 4;
    });
    yPos += 6;
    doc.text("Thank you for considering Kalidass Travels.", 20, yPos);
    yPos += 12;
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
    const fileName = `Kalidass_Travels_Quotation_${formData.companyName.replace(/\s+/g, "_") || "ETS"}.pdf`;
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
      question: "Will you submit the PF/ESI ECR copies for our audit?",
      answer: "Yes. Since we strictly follow Central Government Minimum Wages, we are happy to submit the monthly ECR (Electronic Challan Return) copies and wage registers whenever your compliance team requests them."
    },
    {
      question: "Do you provide supporting documents for variable charges (Fuel/Tolls)?",
      answer: "Yes. We attach original fuel bills, toll receipts, and parking tickets along with the digital trip sheets to your monthly invoice. You pay exactly what the receipt says at actuals."
    },
    {
      question: "Can you provide Police Verification Certificates (PVC) for the drivers?",
      answer: "Yes. We do not deploy any driver without a background check. Valid PVC copies, along with driving license details and address proof, are submitted to your Security/Admin team before onboarding."
    },
    {
      question: "Is your invoice valid for claiming GST Input Tax Credit?",
      answer: "Yes. We issue a proper commercial GST tax invoice with the correct SAC code. Your finance team can claim full Input Tax Credit (ITC) without issues."
    },
    {
      question: "Do all vehicles have valid commercial permits?",
      answer: "Yes. Every vehicle on our roster holds a valid 'Yellow Board' registration, Fitness Certificate (FC), and Commercial Insurance. We ensure your company carries zero legal liability."
    },
    {
      question: "What is your SLA (Service Level Agreement) for breakdowns?",
      answer: "We adhere to a strict 60-minute replacement guarantee. In case of a mechanical failure or driver unavailability, a backup vehicle is dispatched immediately to ensure your operations continue."
    },
    {
      question: "Can we sign a single contract for multiple Tamil Nadu branches?",
      answer: "Yes. We support multi-city operations (Chennai, Coimbatore, Madurai, Hosur). You can sign one master agreement for all locations to standardize your billing and service quality."
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "font-sans text-slate-900 bg-white", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative bg-slate-900 text-white py-20 lg:py-28 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/40 z-0" }),
      /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10", children: /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "inline-block py-1 px-3 rounded-full bg-blue-900/50 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-6", children: "Corporate Plan" }),
          /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight", children: [
            "Monthly Car With Driver ",
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("span", { className: "text-blue-500", children: "No Surprises." })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-300 mb-8 leading-relaxed border-l-4 border-blue-500 pl-6", children: "Your company deserves reliable travel. We share all charges upfront — no sudden add-ons, no confusion." })
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
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-slate-900", children: "Transparent Monthly Pricing" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-3", children: "What you see is exactly what you pay. No hidden driver batas." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-slate-900 text-white", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left text-sm font-bold uppercase tracking-wider", children: "Vehicle Type" }),
          /* @__PURE__ */ jsxs("th", { className: "px-6 py-4 text-left text-sm font-bold uppercase tracking-wider", children: [
            "Package Inclusions",
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-slate-300", children: "(Chennai)" })
          ] }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left text-sm font-bold uppercase tracking-wider", children: "Duty Hours" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left text-sm font-bold uppercase tracking-wider", children: "Fuel Policy" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-200", children: [
          /* @__PURE__ */ jsxs("tr", { className: "hover:bg-blue-50 transition-colors bg-blue-50/30", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(Star, { className: "w-6 h-6 text-yellow-500 fill-current" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900 text-lg", children: "Sedan" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-500", children: "Dzire / Etios / Aura" }),
                /* @__PURE__ */ jsx("span", { className: "inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full", children: "Most Popular" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-green-600 mb-2", children: [
                "₹52,000 ",
                /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-500 font-normal", children: "(+ GST)" })
              ] }),
              /* @__PURE__ */ jsxs("details", { className: "group", children: [
                /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-blue-600 font-semibold text-sm flex items-center gap-2 hover:text-blue-700", children: [
                  /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 group-open:rotate-180 transition-transform" }),
                  /* @__PURE__ */ jsx("span", { children: "View Package Inclusions" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-1 text-sm text-slate-600 ml-5 bg-slate-50 p-3 rounded-lg", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
                    /* @__PURE__ */ jsx("span", { children: "+ Vehicle Rent" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
                    /* @__PURE__ */ jsx("span", { children: "+ Professional Driver" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
                    /* @__PURE__ */ jsx("span", { children: "+ Maintenance & Insurance" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-6", children: [
              /* @__PURE__ */ jsx("div", { className: "text-slate-700 font-medium", children: "10 Hrs / Day" }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-500", children: "26 Days / Month" })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-6", children: [
              /* @__PURE__ */ jsx("div", { className: "text-slate-700 font-medium", children: "Client pays actuals" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: "(Logbook tracked)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(Car, { className: "w-6 h-6 text-slate-400" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900 text-lg", children: "SUV" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-500", children: "Innova Crysta / Hycross" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-green-600 mb-2", children: [
                "₹75,000 ",
                /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-500 font-normal", children: "(+ GST)" })
              ] }),
              /* @__PURE__ */ jsxs("details", { className: "group", children: [
                /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-blue-600 font-semibold text-sm flex items-center gap-2 hover:text-blue-700", children: [
                  /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 group-open:rotate-180 transition-transform" }),
                  /* @__PURE__ */ jsx("span", { children: "View Package Inclusions" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-1 text-sm text-slate-600 ml-5 bg-slate-50 p-3 rounded-lg", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
                    /* @__PURE__ */ jsx("span", { children: "+ Vehicle Rent" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
                    /* @__PURE__ */ jsx("span", { children: "+ Professional Driver" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
                    /* @__PURE__ */ jsx("span", { children: "+ Maintenance & Insurance" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-6", children: [
              /* @__PURE__ */ jsx("div", { className: "text-slate-700 font-medium", children: "10 Hrs / Day" }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-500", children: "26 Days / Month" })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-6", children: [
              /* @__PURE__ */ jsx("div", { className: "text-slate-700 font-medium", children: "Client pays actuals" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: "(Logbook tracked)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(Users, { className: "w-6 h-6 text-slate-400" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900 text-lg", children: "Tempo Traveller" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-500", children: "Force Urbania / Traveller (12+)" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-green-600 mb-2", children: [
                "₹90,000 ",
                /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-500 font-normal", children: "(+ GST)" })
              ] }),
              /* @__PURE__ */ jsxs("details", { className: "group", children: [
                /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-blue-600 font-semibold text-sm flex items-center gap-2 hover:text-blue-700", children: [
                  /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 group-open:rotate-180 transition-transform" }),
                  /* @__PURE__ */ jsx("span", { children: "View Package Inclusions" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-1 text-sm text-slate-600 ml-5 bg-slate-50 p-3 rounded-lg", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
                    /* @__PURE__ */ jsx("span", { children: "+ Vehicle Rent" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
                    /* @__PURE__ */ jsx("span", { children: "+ Professional Driver" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }),
                    /* @__PURE__ */ jsx("span", { children: "+ Maintenance & Insurance" })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-6", children: [
              /* @__PURE__ */ jsx("div", { className: "text-slate-700 font-medium", children: "10 Hrs / Day" }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-500", children: "26 Days / Month" })
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-6", children: [
              /* @__PURE__ */ jsx("div", { className: "text-slate-700 font-medium", children: "Client pays actuals" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: "(Logbook tracked)" })
            ] })
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-500 mt-8", children: "* Fuel, Tolls & Parking billed at actuals (Logbook). Mileage logged daily in digital trip sheet." })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-slate-50 border-t border-slate-200", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-slate-900", children: "Operational Excellence" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-2", children: "We manage the liability and logistics. You focus on business." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsx(
          FeatureItem,
          {
            icon: FileText,
            title: "Audit-Ready Billing",
            desc: "Consolidated GST invoice with attached Fuel, Toll & Parking bills (at actuals). Mileage logged daily."
          }
        ),
        /* @__PURE__ */ jsx(
          FeatureItem,
          {
            icon: ShieldCheck,
            title: "100% Statutory Compliance",
            desc: "We follow Central Govt Minimum Wages. PF & ESI filed diligently. Zero legal liability for you."
          }
        ),
        /* @__PURE__ */ jsx(
          FeatureItem,
          {
            icon: Briefcase,
            title: "Strict Driver Vetting",
            desc: "Mandatory Police Verification Certificate (PVC) obtained for every driver and renewed every 2 years."
          }
        ),
        /* @__PURE__ */ jsx(
          FeatureItem,
          {
            icon: Clock,
            title: "60-Min Backup Promise",
            desc: "Vehicle breakdown? Driver sick? A backup vehicle reaches your office in < 60 minutes."
          }
        ),
        /* @__PURE__ */ jsx(
          FeatureItem,
          {
            icon: MapPin,
            title: "Tamil Nadu Wide Support",
            desc: "Seamless fleet operations across Chennai, Coimbatore, Madurai, and Hosur under one contract."
          }
        ),
        /* @__PURE__ */ jsx(
          FeatureItem,
          {
            icon: Users,
            title: "Dedicated Fleet Manager",
            desc: "No call centers. Direct mobile access to a dedicated supervisor who manages your roster daily."
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-900 mb-8 text-center", children: "Frequently Asked Questions (Audit & Compliance)" }),
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
              href: "mailto:bookings@kalidasstravels.in?subject=Custom%20Quotation%20Request%20-%20Employee%20Transportation&body=Dear%20Kalidass%20Travels%20Team%2C%0A%0AI%20would%20like%20to%20request%20a%20custom%20quotation%20for%20Employee%20Transportation%20Services.%0A%0ACompany%20Details%3A%0AName%3A%20%5BYour%20Company%20Name%5D%0AAddress%3A%20%5BYour%20Company%20Address%5D%0A%0ARequirements%3A%0A-%20Number%20of%20vehicles%20needed%3A%20%0A-%20Vehicle%20type%20preference%3A%20%0A-%20Duty%20hours%20required%3A%20%0A-%20Start%20date%3A%20%0A-%20Any%20special%20requirements%3A%20%0A%0APlease%20provide%20a%20detailed%20quotation%20at%20your%20earliest%20convenience.%0A%0AThank%20you%2C%0A%5BYour%20Name%5D",
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
      /* @__PURE__ */ jsx("p", { className: "text-green-50 text-lg mb-8 max-w-2xl mx-auto", children: "Get instant answers about our services, pricing, or custom requirements. Our team is ready to help you find the perfect transport solution." }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://wa.me/919092303060?text=Hi%2C%20I%27m%20interested%20in%20Employee%20Transportation%20Services.%20I%20have%20some%20questions.",
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

const $$EmployeeTransportation = createComponent(($$result, $$props, $$slots) => {
  const title = "Employee Transportation Services (ETS)";
  const description = "Safe, punctual daily commute solutions for your workforce with automated rostering, real-time tracking, and route optimization.";
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
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${title} - Kalidass Travels`, "description": description, "schema": schema }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "EmployeeTransportation", EmployeeTransportation, { "client:load": true, "client:component-hydration": "load", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/EmployeeTransportation.jsx", "client:component-export": "default" })} ` })}`;
}, "D:/websites/kalidass-attempt-main/src/pages/services/employee-transportation.astro", void 0);

const $$file = "D:/websites/kalidass-attempt-main/src/pages/services/employee-transportation.astro";
const $$url = "/services/employee-transportation";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$EmployeeTransportation,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
