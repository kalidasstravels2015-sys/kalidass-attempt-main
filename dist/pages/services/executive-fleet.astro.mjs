/* empty css                                         */
import { c as createComponent, r as renderComponent, a as renderTemplate } from '../../chunks/astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_D-d8fNH6.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { Crown, ArrowRight, Gem, UserCheck, Shield, Coffee, Wifi, Download, Mail, ChevronUp, MessageCircle, Star, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
export { renderers } from '../../renderers.mjs';

const RateRow = ({ vehicle, package8hr, extraKm, features }) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-100 hover:bg-slate-50 transition-colors", children: [
  /* @__PURE__ */ jsxs("td", { className: "p-5 align-top", children: [
    /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900 text-lg", children: vehicle }),
    /* @__PURE__ */ jsxs("div", { className: "md:hidden mt-1 text-slate-500 text-sm", children: [
      "8hr/80km: ",
      package8hr
    ] })
  ] }),
  /* @__PURE__ */ jsxs("td", { className: "p-5 align-top hidden md:table-cell", children: [
    /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900 text-xl", children: package8hr }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: "+ GST (18%)" })
  ] }),
  /* @__PURE__ */ jsxs("td", { className: "p-5 align-top", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-sm text-slate-700 font-medium", children: [
      "Extra Km: ",
      extraKm
    ] }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500 mt-1", children: "Extra Hr: ₹1000/hr (Approx)" })
  ] }),
  /* @__PURE__ */ jsx("td", { className: "p-5 align-top hidden sm:table-cell", children: /* @__PURE__ */ jsx("ul", { className: "text-sm text-slate-600 space-y-1", children: features.map((feat, idx) => /* @__PURE__ */ jsxs("li", { className: "flex items-center", children: [
    /* @__PURE__ */ jsx(Star, { className: "w-3 h-3 text-yellow-500 mr-2 flex-shrink-0" }),
    feat
  ] }, idx)) }) })
] });
const FeatureBox = ({ icon: Icon, title, desc }) => /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all text-center", children: [
  /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-900", children: /* @__PURE__ */ jsx(Icon, { className: "w-6 h-6" }) }),
  /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-900 mb-2", children: title }),
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
        isOpen ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-5 h-5 text-slate-900 flex-shrink-0" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-slate-400 flex-shrink-0" })
      ]
    }
  ),
  isOpen && /* @__PURE__ */ jsx("div", { className: "px-2 pb-6 text-slate-600 text-sm leading-relaxed", children: answer })
] });
function ExecutiveFleet() {
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
    doc.text("Subject: Quotation for Executive & VIP Fleet Services", 20, yPos + 5);
    doc.setFont("helvetica", "normal");
    doc.text("Respected Sir/Madam,", 20, yPos + 15);
    const intro = "Thank you for your interest in our Executive Fleet Services. We are pleased to present our premium vehicle tariff for your consideration:";
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
    doc.text("EXECUTIVE FLEET TARIFF (Chennai)", 105, yPos + 5.5, { align: "center" });
    yPos += 8;
    doc.setFillColor(226, 232, 240);
    doc.rect(20, yPos, 170, 10, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Class", 25, yPos + 6.5);
    doc.text("8Hr / 80Km Package", 70, yPos + 6.5);
    doc.text("Overtime Rates", 120, yPos + 6.5);
    doc.text("Key Features", 160, yPos + 6.5);
    yPos += 10;
    const drawRow = (vehicle, packageRate, overtime, features, isFirst = false) => {
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
      doc.text("(+ 18% GST)", 70, yPos + 12);
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const otLines = doc.splitTextToSize(overtime, 35);
      doc.text(otLines, 120, yPos + 8);
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      const featLines = doc.splitTextToSize(features, 35);
      doc.text(featLines, 160, yPos + 8);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(20, yPos + rowHeight, 190, yPos + rowHeight);
      yPos += rowHeight;
    };
    drawRow("Toyota Camry (Hybrid)", "₹7,500", "Extra Km: ₹75/km\nExtra Hr: ₹1000/hr", "Eco-Friendly, Rear Seat Control", true);
    drawRow("Mercedes E-Class", "₹12,000", "Extra Km: ₹120/km\nExtra Hr: ₹1200/hr", "Long Wheelbase, Reclining Seats");
    drawRow("BMW 5 Series", "₹12,000", "Extra Km: ₹120/km\nExtra Hr: ₹1200/hr", "Sporty Comfort, Gesture Control");
    drawRow("Toyota Vellfire (Van)", "₹18,000", "Extra Km: ₹180/km\nExtra Hr: ₹1800/hr", "Business Class Seats, Lounge Mode");
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
    doc.text("* Luxury Tax (GST 18%) applicable. Tolls & Parking at actuals.", 25, yPos);
    yPos += 15;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    const closing = "We ensure the highest standards of luxury, discretion, and professionalism for your executive travel requirements.";
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
    const fileName = `Kalidass_Travels_Executive_Fleet_Quote_${formData.companyName.replace(/\s+/g, "_") || "VIP"}.pdf`;
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
      question: "Are the chauffeurs English speaking?",
      answer: "Yes. For our Executive Fleet, we deploy only our 'Elite Category' chauffeurs. They are fluent in English, uniformed (Suit/Safari), and trained in corporate etiquette and discretion."
    },
    {
      question: "What amenities are included in the vehicle?",
      answer: "Every premium booking comes with complimentary mineral water bottles, tissues, hand sanitizer, and a daily newspaper. Wi-Fi dongles can be arranged upon prior request."
    },
    {
      question: "Is there a cancellation fee for premium cars?",
      answer: "Due to high demand for luxury vehicles, we require cancellation notice at least 4 hours prior to the booking time to avoid retention charges."
    },
    {
      question: "Do you support foreign delegations?",
      answer: "Absolutely. We have extensive experience handling convoys for international delegates, including coordination with security teams and airport meet-and-greet services."
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "font-sans text-slate-900 bg-white", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative bg-slate-950 text-white py-24 lg:py-32 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-0" }),
      /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10", children: /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 py-1 px-3 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-xs font-bold uppercase tracking-wider mb-6", children: [
            /* @__PURE__ */ jsx(Crown, { className: "w-3 h-3" }),
            " VIP & Executive Fleet"
          ] }),
          /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-5xl lg:text-6xl font-serif font-medium tracking-tight mb-6 leading-tight", children: [
            "Mobility for ",
            /* @__PURE__ */ jsx("br", {}),
            /* @__PURE__ */ jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500", children: "Leadership." })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-300 mb-8 leading-relaxed border-l-2 border-yellow-500 pl-6", children: "When you move the C-Suite, every detail counts. Immaculate vehicles, elite chauffeurs, and absolute discretion." }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-4", children: /* @__PURE__ */ jsxs("button", { className: "bg-white text-slate-900 hover:bg-slate-100 px-8 py-3.5 rounded shadow-[0_0_20px_rgba(255,255,255,0.3)] font-bold transition-all flex items-center", children: [
            "Request Priority Booking ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 ml-2" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 shadow-2xl", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-white mb-6 font-serif", children: "The Executive Standard" }),
          /* @__PURE__ */ jsx("ul", { className: "space-y-4", children: [
            "Board Meetings & AGMs",
            "International Delegate Visits",
            "Airport VIP Meet & Greet",
            "High-Profile Event Transport"
          ].map((item, idx) => /* @__PURE__ */ jsxs("li", { className: "flex items-center text-slate-200 text-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3 border border-yellow-500/30", children: /* @__PURE__ */ jsx(Gem, { className: "w-4 h-4 text-yellow-400" }) }),
            item
          ] }, idx)) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-slate-50", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center max-w-2xl mx-auto mb-12", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-slate-900 font-serif", children: "Executive Rate Sheet" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-3", children: "Premium packages for Chennai City usage (8 Hrs / 80 Kms)." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-w-5xl mx-auto", children: [
        /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-900 text-white text-xs md:text-sm uppercase tracking-wider", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "p-5 font-medium", children: "Vehicle Class" }),
            /* @__PURE__ */ jsx("th", { className: "p-5 font-medium hidden md:table-cell", children: "8Hr Package" }),
            /* @__PURE__ */ jsx("th", { className: "p-5 font-medium", children: "Overtime Rates" }),
            /* @__PURE__ */ jsx("th", { className: "p-5 font-medium hidden sm:table-cell", children: "Inclusions" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100", children: [
            /* @__PURE__ */ jsx(
              RateRow,
              {
                vehicle: "Toyota Camry (Hybrid)",
                package8hr: "₹7,500",
                extraKm: "₹75 / km",
                features: ["Eco-Friendly", "Rear Seat Control", "Silent Cabin"]
              }
            ),
            /* @__PURE__ */ jsx(
              RateRow,
              {
                vehicle: "Mercedes E-Class",
                package8hr: "₹12,000",
                extraKm: "₹120 / km",
                features: ["Long Wheelbase", "Reclining Seats", "Luxury Interiors"]
              }
            ),
            /* @__PURE__ */ jsx(
              RateRow,
              {
                vehicle: "BMW 5 Series",
                package8hr: "₹12,000",
                extraKm: "₹120 / km",
                features: ["Sporty Comfort", "Gesture Control", "Premium Sound"]
              }
            ),
            /* @__PURE__ */ jsx(
              RateRow,
              {
                vehicle: "Toyota Vellfire (Van)",
                package8hr: "₹18,000",
                extraKm: "₹180 / km",
                features: ["Business Class Seats", "Privacy Glass", "Lounge Mode"]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-100 p-4 text-center text-xs text-slate-500 border-t border-slate-200", children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: "Note:" }),
          " Luxury taxes (GST 18%) applicable. Parking & Tolls at actuals."
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-slate-900 font-serif", children: 'The "White Glove" Experience' }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-2", children: "It's not just a car. It's a service standard." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-4 gap-8", children: [
        /* @__PURE__ */ jsx(
          FeatureBox,
          {
            icon: UserCheck,
            title: "Elite Chauffeurs",
            desc: "Uniformed, English-speaking, and trained in defensive driving & confidentiality protocols."
          }
        ),
        /* @__PURE__ */ jsx(
          FeatureBox,
          {
            icon: Shield,
            title: "Privacy Guaranteed",
            desc: "Discretion is our currency. Our chauffeurs sign NDAs and respect your privacy at all times."
          }
        ),
        /* @__PURE__ */ jsx(
          FeatureBox,
          {
            icon: Coffee,
            title: "Onboard Amenities",
            desc: "Complimentary mineral water, daily newspaper, tissues, and hand sanitizer in every vehicle."
          }
        ),
        /* @__PURE__ */ jsx(
          FeatureBox,
          {
            icon: Wifi,
            title: "Connected Travel",
            desc: "4G/5G Wi-Fi dongles available on request to ensure your mobile office never disconnects."
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-900 mb-8 text-center font-serif", children: "Questions from Executive Assistants" }),
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
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-gradient-to-br from-slate-50 to-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-slate-900 mb-4 font-serif", children: "Download Executive Rate Card" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-600", children: "Get our premium fleet tariff in a professional PDF format" })
      ] }),
      !showQuoteForm ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-center gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowQuoteForm(true),
              className: "inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto justify-center",
              children: [
                /* @__PURE__ */ jsx(Download, { className: "w-6 h-6" }),
                "Generate Rate Card PDF"
              ]
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-3", children: "Instant PDF download with executive rates" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "mailto:bookings@kalidasstravels.in?subject=Custom%20Quotation%20Request%20-%20Executive%20Fleet&body=Dear%20Kalidass%20Travels%20Team%2C%0A%0AI%20would%20like%20to%20request%20a%20custom%20quotation%20for%20Executive%20Fleet%20Services.%0A%0ACompany%20Details%3A%0AName%3A%20%5BYour%20Company%20Name%5D%0AAddress%3A%20%5BYour%20Company%20Address%5D%0A%0ARequirements%3A%0A-%20Vehicle%20preference%20(Camry/Benz/BMW/Vellfire)%3A%20%0A-%20Date%20of%20requirement%3A%20%0A-%20Duration%20(Hrs/Days)%3A%20%0A%0APlease%20provide%20availability%20and%20quote.%0A%0AThank%20you%2C%0A%5BYour%20Name%5D",
              className: "inline-flex items-center gap-3 bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 w-full md:w-auto justify-center",
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
                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all"
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
                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all resize-none"
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
                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all"
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
                  className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all"
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
                  className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all"
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
                className: "w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3",
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
    /* @__PURE__ */ jsx("section", { className: "bg-slate-950 text-white py-16 border-t border-slate-900", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx(MessageCircle, { className: "w-16 h-16 mx-auto mb-4 animate-pulse text-green-500" }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-4 font-serif", children: "Priority Assistance" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-lg mb-8 max-w-2xl mx-auto", children: "Connect directly with our Executive Desk for immediate booking assistance." }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://wa.me/919092303060?text=Hi%2C%20I%27m%20interested%20in%20Executive%20Fleet%20Services.%20I%20have%20some%20questions.",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "inline-flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1",
          children: [
            /* @__PURE__ */ jsx(MessageCircle, { className: "w-6 h-6" }),
            "Chat on WhatsApp"
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mt-6", children: "💬 Typical response time: Under 5 minutes" })
    ] }) })
  ] });
}

const $$ExecutiveFleet = createComponent(($$result, $$props, $$slots) => {
  const title = "Executive & VIP Fleet - Luxury Chauffeur Service";
  const description = "Premium luxury vehicles with professional chauffeurs for executives, VIPs, and high-profile clients. Mercedes, BMW, and Toyota Vellfire with elite service standards.";
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
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${title} - Kalidass Travels`, "description": description, "schema": schema }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "ExecutiveFleet", ExecutiveFleet, { "client:load": true, "client:component-hydration": "load", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/ExecutiveFleet.jsx", "client:component-export": "default" })} ` })}`;
}, "D:/websites/kalidass-attempt-main/src/pages/services/executive-fleet.astro", void 0);

const $$file = "D:/websites/kalidass-attempt-main/src/pages/services/executive-fleet.astro";
const $$url = "/services/executive-fleet";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$ExecutiveFleet,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
