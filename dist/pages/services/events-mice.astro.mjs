/* empty css                                         */
import { c as createComponent, r as renderComponent, a as renderTemplate } from '../../chunks/astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_D-d8fNH6.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { ArrowRight, Calendar, CheckCircle, UserCheck, MapPin, Megaphone, ClipboardCheck, Download, Mail, ChevronUp, MessageCircle, Users, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
export { renderers } from '../../renderers.mjs';

const FleetRow = ({ vehicle, seats, package12hr, extras, features }) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-100 hover:bg-slate-50 transition-colors", children: [
  /* @__PURE__ */ jsxs("td", { className: "p-5 align-top", children: [
    /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900 text-lg", children: vehicle }),
    /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center mt-1 text-slate-500 text-sm bg-slate-100 px-2 py-0.5 rounded", children: [
      /* @__PURE__ */ jsx(Users, { className: "w-3 h-3 mr-1" }),
      " ",
      seats,
      " Seater"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "md:hidden mt-3", children: [
      /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900 text-xl", children: package12hr }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: "Full Day (12 Hrs)" })
    ] })
  ] }),
  /* @__PURE__ */ jsxs("td", { className: "p-5 align-top hidden md:table-cell", children: [
    /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900 text-xl", children: package12hr }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: "Full Day (12 Hrs)" })
  ] }),
  /* @__PURE__ */ jsxs("td", { className: "p-5 align-top", children: [
    /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-700 font-medium", children: extras }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500 mt-1", children: "Day Bata Included" }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500 mt-0.5", children: "+ Tolls & Parking" })
  ] }),
  /* @__PURE__ */ jsx("td", { className: "p-5 align-top hidden sm:table-cell", children: /* @__PURE__ */ jsx("ul", { className: "text-sm text-slate-600 space-y-1", children: features.map((feat, idx) => /* @__PURE__ */ jsxs("li", { className: "flex items-center", children: [
    /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 text-green-500 mr-2 flex-shrink-0" }),
    feat
  ] }, idx)) }) })
] });
const FeatureBox = ({ icon: Icon, title, desc }) => /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all text-left group", children: [
  /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors", children: /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6" }) }),
  /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-900 mb-2 text-lg", children: title }),
  /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 leading-relaxed", children: desc })
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
function EventsMice() {
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
    doc.text("Subject: Quotation for Events & MICE Transport Services", 20, yPos + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Respected Sir/Madam,", 20, yPos + 15);
    const intro = "Thank you for your interest in our Event Logistics Services. We are pleased to present our fleet tariff for your upcoming event:";
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
    doc.text("EVENT TRANSPORT TARIFF (Chennai)", 105, yPos + 5.5, { align: "center" });
    yPos += 8;
    doc.setFillColor(226, 232, 240);
    doc.rect(20, yPos, 170, 10, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Type", 25, yPos + 6.5);
    doc.text("12 Hr Package", 70, yPos + 6.5);
    doc.text("Extras", 120, yPos + 6.5);
    doc.text("Features", 160, yPos + 6.5);
    yPos += 10;
    const drawRow = (vehicle, packageRate, extras, features, isFirst = false) => {
      const rowHeight = 25;
      if (isFirst) {
        doc.setFillColor(240, 249, 255);
        doc.rect(20, yPos, 170, rowHeight, "F");
      }
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(vehicle, 22, yPos + 8);
      doc.setFontSize(12);
      doc.setTextColor(22, 163, 74);
      doc.text(packageRate, 70, yPos + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("(+ 5% GST)", 70, yPos + 12);
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const extraLines = doc.splitTextToSize(extras, 35);
      doc.text(extraLines, 120, yPos + 8);
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      const featLines = doc.splitTextToSize(features, 35);
      doc.text(featLines, 160, yPos + 8);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(20, yPos + rowHeight, 190, yPos + rowHeight);
      yPos += rowHeight;
    };
    drawRow("Tempo Traveller / Urbania (12)", "₹7,500", "Fuel Only\nDay Bata Included\n+ Tolls & Parking", "Pushback Seats, AC Vents", true);
    drawRow("Urbania (21) / Mini Bus", "₹10,000", "Fuel Only\nDay Bata Included\n+ Tolls & Parking", "2+2 Seating, PA System");
    drawRow("Volvo / Benz Coach (45)", "₹18,000", "Fuel Only\nDay Bata Included\n+ Tolls & Parking", "Air Suspension, Onboard Toilet");
    drawRow("Innova Crysta (7)", "₹7,500", "Fuel Only\nDay Bata Included\n+ Tolls & Parking", "VIP Guest Movement, Captain Seats");
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    const tableTop = yPos - 100;
    doc.line(65, tableTop, 65, yPos);
    doc.line(115, tableTop, 115, yPos);
    doc.line(155, tableTop, 155, yPos);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(20, tableTop, 170, yPos - tableTop);
    yPos += 5;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text("* GST 5% applicable. Tolls & Parking at actuals.", 25, yPos);
    yPos += 15;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    const closing = "We specialize in handling large-scale logistics with precision and reliability. We look forward to supporting your event.";
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
    const fileName = `Kalidass_Travels_Event_Quote_${formData.companyName.replace(/\s+/g, "_") || "Event"}.pdf`;
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
      question: "Do you provide an on-ground coordinator?",
      answer: "Yes. For events with more than 5 vehicles, we assign a dedicated Transport Manager on-ground to handle parking, driver coordination, and guest boarding, ensuring you can focus on the event."
    },
    {
      question: "Can we brand the buses with our company logo?",
      answer: "Absolutely. We allow magnetic stickers or banners on the bus exterior and headrest covers inside. All branding material must be provided or approved 48 hours prior."
    },
    {
      question: "What happens if the event extends beyond booked hours?",
      answer: "We understand events run late. We offer a flexible buffer. Additional hours are billed at a pre-agreed hourly rate (approx ₹500-₹1000/hr depending on vehicle type)."
    },
    {
      question: "Do you handle outstation offsites (e.g., Pondicherry/Yelagiri)?",
      answer: "Yes. We specialize in outstation corporate retreats. Our packages include driver accommodation, state permits, and toll management for a seamless experience."
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "font-sans text-slate-900 bg-white", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative bg-blue-900 text-white py-24 lg:py-32 overflow-visible pb-32 lg:pb-40", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-900/90 to-transparent z-0" }),
      /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto text-center", children: [
        /* @__PURE__ */ jsx("span", { className: "inline-block py-1 px-3 rounded-full bg-blue-800 border border-blue-500/30 text-blue-200 text-xs font-bold uppercase tracking-wider mb-6", children: "Events & MICE Logistics" }),
        /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight", children: [
          "Transport for ",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-blue-400", children: "Large Crowds." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto", children: "From Annual General Meetings (AGM) to Team Offsites. We move 50 to 5000 people with military precision." }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-4 justify-center", children: /* @__PURE__ */ jsxs("button", { className: "bg-white text-blue-900 hover:bg-blue-50 px-8 py-3.5 rounded-lg font-bold transition-all flex items-center shadow-lg", children: [
          "Plan Event Transport ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 ml-2" })
        ] }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "relative -mt-24 lg:-mt-32 mb-12 z-20", children: /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl border border-blue-100 p-8 md:p-10 transform hover:scale-[1.02] transition-all duration-300 hover:shadow-blue-200/50", style: { boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.1)" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-blue-600 text-white rounded-full p-3 mr-4", children: /* @__PURE__ */ jsx(Calendar, { className: "w-6 h-6" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-2xl md:text-3xl font-bold text-slate-900", children: "We Handle Logistics For:" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-4", children: [
        "Corporate Annual Days",
        "Team Offsites & Retreats",
        "Factory/Site Visits",
        "Weddings & Large Delegations"
      ].map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-start bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all", children: [
        /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsx("span", { className: "text-slate-700 font-medium text-sm", children: item })
      ] }, idx)) })
    ] }) }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-slate-50", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center max-w-2xl mx-auto mb-12", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-slate-900", children: "Event Fleet Packages" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-3", children: "Standard 12-Hour disposal rates for Chennai City events." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-5xl mx-auto", children: [
        /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-100 text-slate-700 text-xs md:text-sm uppercase tracking-wider", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "p-5 font-bold", children: "Vehicle Type" }),
            /* @__PURE__ */ jsx("th", { className: "p-5 font-bold hidden md:table-cell", children: "12 Hr Package" }),
            /* @__PURE__ */ jsx("th", { className: "p-5 font-bold", children: "Extras" }),
            /* @__PURE__ */ jsx("th", { className: "p-5 font-bold hidden sm:table-cell", children: "Features" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100", children: [
            /* @__PURE__ */ jsx(
              FleetRow,
              {
                vehicle: "Tempo Traveller / Urbania",
                seats: "12",
                package12hr: "₹7,500",
                extras: "Fuel Only",
                features: ["Pushback Seats", "AC Vents per seat", "Ample Luggage"]
              }
            ),
            /* @__PURE__ */ jsx(
              FleetRow,
              {
                vehicle: "Urbania / Mini Bus",
                seats: "21",
                package12hr: "₹10,000",
                extras: "Fuel Only",
                features: ["2+2 Seating", "PA System / Mic", "Aisle Space"]
              }
            ),
            /* @__PURE__ */ jsx(
              FleetRow,
              {
                vehicle: "Volvo / Benz Coach",
                seats: "45",
                package12hr: "₹18,000",
                extras: "Fuel Only",
                features: ["Air Suspension", "Reclining Seats", "Onboard Toilet"]
              }
            ),
            /* @__PURE__ */ jsx(
              FleetRow,
              {
                vehicle: "Innova Crysta",
                seats: "7",
                package12hr: "₹7,500",
                extras: "Fuel Only",
                features: ["VIP Guest Movement", "Captain Seats", "Fast Transit"]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 p-4 text-center text-xs text-blue-800 border-t border-blue-100", children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Note:" }),
          " Rates exclusive of 5% GST. Tolls & Parking at actuals."
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-slate-900", children: "Why Event Managers Trust Us" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-2", children: "We don't just supply buses; we manage the movement." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-4 gap-6", children: [
        /* @__PURE__ */ jsx(
          FeatureBox,
          {
            icon: UserCheck,
            title: "On-Ground SPOC",
            desc: "A dedicated Transport Manager stationed at your venue to coordinate drivers and parking."
          }
        ),
        /* @__PURE__ */ jsx(
          FeatureBox,
          {
            icon: MapPin,
            title: "Route Planning",
            desc: "We optimize pickup routes for large groups to ensure everyone reaches the venue on time."
          }
        ),
        /* @__PURE__ */ jsx(
          FeatureBox,
          {
            icon: Megaphone,
            title: "Branding Ready",
            desc: "Buses available for magnetic stickers and banners. Make your corporate presence felt."
          }
        ),
        /* @__PURE__ */ jsx(
          FeatureBox,
          {
            icon: ClipboardCheck,
            title: "Backup Fleet",
            desc: "We always keep 1 standby vehicle for every 10 vehicles booked. Zero panic moments."
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8", children: [
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
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-gradient-to-br from-blue-50 to-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-slate-900 mb-4", children: "Download Event Rate Card" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-600", children: "Get our event fleet tariff in a professional PDF format" })
      ] }),
      !showQuoteForm ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-center gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowQuoteForm(true),
              className: "inline-flex items-center gap-3 bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-900/20 hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto justify-center",
              children: [
                /* @__PURE__ */ jsx(Download, { className: "w-6 h-6" }),
                "Generate Rate Card PDF"
              ]
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-3", children: "Instant PDF download with event rates" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "mailto:bookings@kalidasstravels.in?subject=Custom%20Quotation%20Request%20-%20Events%20MICE&body=Dear%20Kalidass%20Travels%20Team%2C%0A%0AI%20would%20like%20to%20request%20a%20custom%20quotation%20for%20Event%20Transport%20Services.%0A%0ACompany%20Details%3A%0AName%3A%20%5BYour%20Company%20Name%5D%0AAddress%3A%20%5BYour%20Company%20Address%5D%0A%0AEvent%20Details%3A%0A-%20Event%20Type%3A%20%0A-%20Date%20%26%20Time%3A%20%0A-%20Venue%3A%20%0A-%20Expected%20Guest%20Count%3A%20%0A-%20Vehicle%20Requirements%20(Bus/Traveller/Car)%3A%20%0A%0APlease%20provide%20a%20detailed%20plan%20and%20quote.%0A%0AThank%20you%2C%0A%5BYour%20Name%5D",
              className: "inline-flex items-center gap-3 bg-white hover:bg-blue-50 border-2 border-blue-900 text-blue-900 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto justify-center",
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
                className: "w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3",
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
    /* @__PURE__ */ jsx("section", { className: "bg-gradient-to-br from-blue-900 to-blue-950 text-white py-16 border-t border-blue-800", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx(MessageCircle, { className: "w-16 h-16 mx-auto mb-4 animate-pulse text-blue-400" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: "Plan Your Event Transport" }),
      /* @__PURE__ */ jsx("p", { className: "text-blue-200 text-lg mb-8 max-w-2xl mx-auto", children: "Connect with our Event Logistics Team for a custom plan and bulk rates." }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://wa.me/919092303060?text=Hi%2C%20I%27m%20planning%20an%20event%20and%20need%20transport%20services.%20Can%20we%20chat%3F",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "inline-flex items-center justify-center gap-3 bg-white text-blue-900 hover:bg-blue-50 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1",
          children: [
            /* @__PURE__ */ jsx(MessageCircle, { className: "w-6 h-6" }),
            "Chat on WhatsApp"
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-blue-300 text-sm mt-6", children: "💬 Typical response time: Under 5 minutes" })
    ] }) })
  ] });
}

const $$EventsMice = createComponent(($$result, $$props, $$slots) => {
  const title = "Events & MICE Logistics - Corporate Event Transport";
  const description = "Seamless transportation management for events, conferences, and MICE groups. From delegate transfers to VIP shuttles, we handle it all with dedicated coordinators.";
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
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${title} - Kalidass Travels`, "description": description, "schema": schema }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "EventsMice", EventsMice, { "client:load": true, "client:component-hydration": "load", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/EventsMice.jsx", "client:component-export": "default" })} ` })}`;
}, "D:/websites/kalidass-attempt-main/src/pages/services/events-mice.astro", void 0);

const $$file = "D:/websites/kalidass-attempt-main/src/pages/services/events-mice.astro";
const $$url = "/services/events-mice";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$EventsMice,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
