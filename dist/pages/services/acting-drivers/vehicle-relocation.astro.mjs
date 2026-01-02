/* empty css                                            */
import { c as createComponent, r as renderComponent, a as renderTemplate } from '../../../chunks/astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../../chunks/Layout_DqQjb86R.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { MapPin, MessageCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { V as VehicleRelocationCalculator } from '../../../chunks/VehicleRelocationCalculator_CjPSfBBW.mjs';
import { $ as $$Drivers } from '../../../chunks/Drivers_CfWGC3G5.mjs';
export { renderers } from '../../../renderers.mjs';

const ProcessStep = ({ step, title, desc }) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-center md:flex-row md:text-left md:items-start gap-3 md:gap-4", children: [
  /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold border-2 border-indigo-200 text-sm md:text-base", children: step }),
  /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-900 text-sm md:text-lg", children: title }),
    /* @__PURE__ */ jsx("p", { className: "text-xs md:text-sm text-slate-600 leading-relaxed mt-1 hidden md:block", children: desc })
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
        isOpen ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-5 h-5 text-indigo-600 flex-shrink-0" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-5 h-5 text-slate-400 flex-shrink-0" })
      ]
    }
  ),
  isOpen && /* @__PURE__ */ jsx("div", { className: "px-2 pb-6 text-slate-600 text-sm leading-relaxed", children: answer })
] });
function VehicleRelocation({ children }) {
  const [openFaq, setOpenFaq] = useState(0);
  const faqs = [
    {
      question: "How does the driver reach the pickup location?",
      answer: "We send the driver via Bus or Train to the city where your car is located. You will need to reimburse this travel ticket cost (actuals) along with the driving charges."
    },
    {
      question: "What about fuel and toll charges?",
      answer: "The car owner pays for Fuel and FastTag tolls. We recommend filling the tank before handover. Our driver will provide bills for any refuelling done during the trip."
    },
    {
      question: "Do you inspect the car before starting?",
      answer: "Yes. Before touching the steering wheel, our driver initiates a Video Call with you. He walks around the car, documenting existing scratches, dents, and the odometer reading to ensure transparency."
    },
    {
      question: "What if my car breaks down mid-way?",
      answer: "Our drivers are trained to handle basic checks. If a major breakdown occurs, they will coordinate with roadside assistance and stay with your vehicle until help arrives. They will not abandon the car."
    }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "font-sans text-slate-900 bg-white", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative bg-slate-900 text-white pt-20 pb-32 lg:pt-28 lg:pb-48 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/80 to-slate-900 z-0" }),
      /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 py-1 px-3 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-6", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
          " Inter-District Transfer"
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight", children: [
          "Move Your Car. ",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "Without Moving Yourself." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto", children: "Need your car brought from your hometown to Chennai? Or sending it back? We pick it up, drive it safely, and deliver it to your doorstep." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "relative z-20 -mt-24 px-4 pb-12", children: /* @__PURE__ */ jsx("div", { className: "max-w-xl mx-auto", children: /* @__PURE__ */ jsx(VehicleRelocationCalculator, {}) }) }),
    /* @__PURE__ */ jsx("section", { className: "py-12 md:py-20 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10 md:mb-16", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-slate-900", children: "How It Works" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mt-2 text-sm md:text-base", children: "Professional logistics for your personal vehicle." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8", children: [
        /* @__PURE__ */ jsx(
          ProcessStep,
          {
            step: "1",
            title: "Driver Dispatch",
            desc: "We send a verified driver by Bus/Train to the pickup city (e.g., Coimbatore/Madurai)."
          }
        ),
        /* @__PURE__ */ jsx(
          ProcessStep,
          {
            step: "2",
            title: "Video Inspection",
            desc: "Before starting, the driver does a live video call to record scratches, dents, and fuel levels."
          }
        ),
        /* @__PURE__ */ jsx(
          ProcessStep,
          {
            step: "3",
            title: "The Drive",
            desc: "Live location sharing on WhatsApp. Safe driving speed (Max 90kmph) maintained throughout."
          }
        ),
        /* @__PURE__ */ jsx(
          ProcessStep,
          {
            step: "4",
            title: "Doorstep Delivery",
            desc: "Car is delivered to your destination. Final inspection and key handover."
          }
        )
      ] })
    ] }) }),
    children,
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
    /* @__PURE__ */ jsx("section", { className: "bg-gradient-to-br from-green-600 to-green-700 text-white py-16", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(MessageCircle, { className: "w-16 h-16 mb-4 animate-pulse" }) }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: "Have Questions? Let's Chat!" }),
      /* @__PURE__ */ jsx("p", { className: "text-green-50 text-lg mb-8 max-w-2xl mx-auto", children: "Get instant answers about our services, pricing, or custom requirements. Our team is ready to help you find the perfect transport solution." }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://wa.me/919092303060?text=Hi%2C%20I%27m%20interested%20in%20Vehicle%20Relocation%20Services.%20I%20have%20some%20questions.",
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

const $$VehicleRelocation = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Vehicle Relocation Services - Acting Drivers" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "VehicleRelocationComponent", VehicleRelocation, { "client:load": true, "client:component-hydration": "load", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/VehicleRelocation.jsx", "client:component-export": "default" }, { "default": ($$result3) => renderTemplate` ${renderComponent($$result3, "Drivers", $$Drivers, {})} ` })} ` })}`;
}, "D:/websites/kalidass-attempt-main/src/pages/services/acting-drivers/vehicle-relocation.astro", void 0);

const $$file = "D:/websites/kalidass-attempt-main/src/pages/services/acting-drivers/vehicle-relocation.astro";
const $$url = "/services/acting-drivers/vehicle-relocation";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$VehicleRelocation,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
