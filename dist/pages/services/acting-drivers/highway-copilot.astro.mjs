/* empty css                                            */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../../../chunks/astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../../chunks/Layout_DqQjb86R.mjs';
import { $ as $$DriverFeeEstimator } from '../../../chunks/DriverFeeEstimator_B8G6dqhW.mjs';
import { $ as $$Drivers } from '../../../chunks/Drivers_CfWGC3G5.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { ChevronUp, ChevronDown, Moon, UserCheck, Briefcase, Heart, Coffee, ShieldCheck, MapPin, Clock, MessageCircle } from 'lucide-react';
export { renderers } from '../../../renderers.mjs';

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
function HighwayCopilotFaq() {
  const [openFaq, setOpenFaq] = useState(0);
  const faqs = [
    {
      question: "Do I need to provide food for the driver?",
      answer: "Yes, food expenses during the trip are to be borne by the customer. If the trip involves an overnight stay, safe accommodation for the driver must also be provided."
    },
    {
      question: "What if the trip extends beyond the estimated time?",
      answer: "Our charges are based on the actual duration and distance. Any additional hours or kilometers will be calculated as per the standard tariff card."
    },
    {
      question: "Are your drivers experienced with automatic cars?",
      answer: "Absolutely. All our 'Night Owl' pilots are senior drivers with 5+ years of experience handling both manual and automatic luxury vehicles."
    },
    {
      question: "How do you ensure the driver is not sleepy?",
      answer: "We have a strict 'Fresh Driver' policy. A driver assigned to a night duty is mandated to have rested for at least 8 hours during the day. We also enforce a 10-minute coffee break every 3 hours."
    },
    {
      question: "Is the return fare applicable if I only need a drop?",
      answer: "Yes, for one-way drops, the return bus/train fare for the driver to return to their base location must be paid by the customer."
    }
  ];
  return /* @__PURE__ */ jsx("section", { className: "py-12 md:py-20 bg-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center", children: "Frequently Asked Questions" }),
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
  ] }) });
}

const $$HighwayCopilot = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Highway Acting Driver | Kalidass Travels" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="font-sans text-slate-900 bg-white">  <section class="relative bg-slate-900 text-white pt-20 pb-32 lg:pt-28 lg:pb-48 overflow-hidden"> <div class="absolute inset-0 z-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"></div> <div class="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/80 to-slate-900 z-0"></div> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"> <div class="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-6"> ${renderComponent($$result2, "Moon", Moon, { "client:load": true, "client:component-hydration": "load", "client:component-path": "lucide-react", "client:component-export": "Moon" })} Night Travel Specialist
</div> <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
You Sleep. We Drive. <br> <span class="text-indigo-400">Arrive Fresh.</span> </h1> <p class="text-lg text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
Turn your car into a luxury sleeper. Our specialist night drivers handle the highway glare and heavy trucks while you rest in the back seat.
</p> </div> </section>  <section class="relative z-20 -mt-24 px-4 pb-12"> <div class="max-w-md mx-auto"> ${renderComponent($$result2, "DriverFeeEstimator", $$DriverFeeEstimator, {})} </div> </section>  <section class="py-12 md:py-20 bg-white"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="text-center mb-10 md:mb-16"> <h2 class="text-2xl md:text-3xl font-bold text-slate-900">Who Is This For?</h2> <p class="text-slate-500 mt-2 text-sm md:text-base">Perfect for anyone who values their time and safety over driving stress.</p> </div> <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">  <div class="bg-slate-50 rounded-xl md:rounded-2xl p-5 md:p-8 border border-slate-100 hover:shadow-md transition-shadow flex flex-row md:flex-col items-start gap-4 md:gap-0"> <div class="shrink-0 w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-lg md:rounded-xl flex items-center justify-center md:mb-6 text-indigo-600"> ${renderComponent($$result2, "UserCheck", UserCheck, { "client:load": true, "className": "w-5 h-5 md:w-6 md:h-6", "client:component-hydration": "load", "client:component-path": "lucide-react", "client:component-export": "UserCheck" })} </div> <div> <h3 class="text-lg md:text-xl font-bold text-slate-900 mb-1 md:mb-3">Wedding Guests</h3> <p class="text-sm md:text-base text-slate-600 leading-relaxed">
Don't let a 7-hour drive ruin the celebration. Sleep on the way and arrive fresh.
</p> </div> </div>  <div class="bg-slate-50 rounded-xl md:rounded-2xl p-5 md:p-8 border border-slate-100 hover:shadow-md transition-shadow flex flex-row md:flex-col items-start gap-4 md:gap-0"> <div class="shrink-0 w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-lg md:rounded-xl flex items-center justify-center md:mb-6 text-indigo-600"> ${renderComponent($$result2, "Briefcase", Briefcase, { "client:load": true, "className": "w-5 h-5 md:w-6 md:h-6", "client:component-hydration": "load", "client:component-path": "lucide-react", "client:component-export": "Briefcase" })} </div> <div> <h3 class="text-lg md:text-xl font-bold text-slate-900 mb-1 md:mb-3">Business Travelers</h3> <p class="text-sm md:text-base text-slate-600 leading-relaxed">
Turn travel time into work time. Prepare for meetings or rest before the big presentation.
</p> </div> </div>  <div class="bg-slate-50 rounded-xl md:rounded-2xl p-5 md:p-8 border border-slate-100 hover:shadow-md transition-shadow flex flex-row md:flex-col items-start gap-4 md:gap-0"> <div class="shrink-0 w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-lg md:rounded-xl flex items-center justify-center md:mb-6 text-indigo-600"> ${renderComponent($$result2, "Heart", Heart, { "client:load": true, "className": "w-5 h-5 md:w-6 md:h-6", "client:component-hydration": "load", "client:component-path": "lucide-react", "client:component-export": "Heart" })} </div> <div> <h3 class="text-lg md:text-xl font-bold text-slate-900 mb-1 md:mb-3">Medical Visits</h3> <p class="text-sm md:text-base text-slate-600 leading-relaxed">
Safe driving for hospital visits. We handle parking and logistics while you rest.
</p> </div> </div> </div> </div> </section>  <section class="py-12 md:py-20 bg-slate-50"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="text-center mb-10 md:mb-12"> <h2 class="text-2xl md:text-3xl font-bold text-slate-900">The "Night Owl" Safety Protocol</h2> <p class="text-slate-500 mt-2 text-sm md:text-base">We don't just drive; we follow a strict safety regimen.</p> </div> <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6"> <div class="bg-white p-3 md:p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2 md:gap-4"> <div class="shrink-0 w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-lg flex items-center justify-center md:mb-4 text-indigo-600"> ${renderComponent($$result2, "Coffee", Coffee, { "client:load": true, "className": "w-5 h-5 md:w-6 md:h-6", "client:component-hydration": "load", "client:component-path": "lucide-react", "client:component-export": "Coffee" })} </div> <div> <h3 class="font-bold text-slate-900 mb-1 md:mb-2 text-sm md:text-lg">Mandatory Breaks</h3> <p class="text-xs md:text-sm text-slate-600 leading-relaxed hidden md:block">Drivers take a 10-minute coffee stop every 3 hours to ensure alertness.</p> </div> </div> <div class="bg-white p-3 md:p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2 md:gap-4"> <div class="shrink-0 w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-lg flex items-center justify-center md:mb-4 text-indigo-600"> ${renderComponent($$result2, "ShieldCheck", ShieldCheck, { "client:load": true, "className": "w-5 h-5 md:w-6 md:h-6", "client:component-hydration": "load", "client:component-path": "lucide-react", "client:component-export": "ShieldCheck" })} </div> <div> <h3 class="font-bold text-slate-900 mb-1 md:mb-2 text-sm md:text-lg">Defensive Driving</h3> <p class="text-xs md:text-sm text-slate-600 leading-relaxed hidden md:block">We stick to the safe lane. No rash overtaking. We treat your car like a baby on board.</p> </div> </div> <div class="bg-white p-3 md:p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2 md:gap-4"> <div class="shrink-0 w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-lg flex items-center justify-center md:mb-4 text-indigo-600"> ${renderComponent($$result2, "MapPin", MapPin, { "client:load": true, "className": "w-5 h-5 md:w-6 md:h-6", "client:component-hydration": "load", "client:component-path": "lucide-react", "client:component-export": "MapPin" })} </div> <div> <h3 class="font-bold text-slate-900 mb-1 md:mb-2 text-sm md:text-lg">Live Location</h3> <p class="text-xs md:text-sm text-slate-600 leading-relaxed hidden md:block">Driver shares live WhatsApp location with your family before the trip starts.</p> </div> </div> <div class="bg-white p-3 md:p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center gap-2 md:gap-4"> <div class="shrink-0 w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-lg flex items-center justify-center md:mb-4 text-indigo-600"> ${renderComponent($$result2, "Clock", Clock, { "client:load": true, "className": "w-5 h-5 md:w-6 md:h-6", "client:component-hydration": "load", "client:component-path": "lucide-react", "client:component-export": "Clock" })} </div> <div> <h3 class="font-bold text-slate-900 mb-1 md:mb-2 text-sm md:text-lg">Speed Governor</h3> <p class="text-xs md:text-sm text-slate-600 leading-relaxed hidden md:block">We strictly adhere to a safe speed limit (90-100 kmph) for maximum control.</p> </div> </div> </div> </div> </section>  ${renderComponent($$result2, "Drivers", $$Drivers, {})}  ${renderComponent($$result2, "HighwayCopilotFaq", HighwayCopilotFaq, { "client:load": true, "client:component-hydration": "load", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/HighwayCopilotFaq.jsx", "client:component-export": "default" })}  <section class="bg-gradient-to-br from-green-600 to-green-700 text-white py-16"> <div class="max-w-4xl mx-auto px-4 text-center"> <div class="mb-6"> <div class="flex justify-center"> ${renderComponent($$result2, "MessageCircle", MessageCircle, { "client:load": true, "className": "w-16 h-16 mb-4 animate-pulse", "client:component-hydration": "load", "client:component-path": "lucide-react", "client:component-export": "MessageCircle" })} </div> </div> <h2 class="text-3xl md:text-4xl font-bold mb-4">Have Questions? Let's Chat!</h2> <p class="text-green-50 text-lg mb-8 max-w-2xl mx-auto">
Get instant answers about our services, pricing, or custom requirements. Our team is ready to help you find the perfect transport solution.
</p> <a href="https://wa.me/919092303060?text=Hi%2C%20I%27m%20interested%20in%20Highway%20Co-Pilot%20Services.%20I%20have%20some%20questions." target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-3 bg-white text-green-600 hover:bg-green-50 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"> ${renderComponent($$result2, "MessageCircle", MessageCircle, { "client:load": true, "className": "w-6 h-6", "client:component-hydration": "load", "client:component-path": "lucide-react", "client:component-export": "MessageCircle" })}
Chat on WhatsApp
</a> <p class="text-green-100 text-sm mt-6">
💬 Typical response time: Under 5 minutes during business hours
</p> </div> </section> <!-- FAQ will be a separate component --> </div> ` })}`;
}, "D:/websites/kalidass-attempt-main/src/pages/services/acting-drivers/highway-copilot.astro", void 0);

const $$file = "D:/websites/kalidass-attempt-main/src/pages/services/acting-drivers/highway-copilot.astro";
const $$url = "/services/acting-drivers/highway-copilot";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$HighwayCopilot,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
