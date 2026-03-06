/* empty css                                      */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_D-d8fNH6.mjs';
import { Q as QuotationEngine } from '../chunks/QuotationEngine_3XpVGP06.mjs';
import { $ as $$DriverFeeEstimator } from '../chunks/DriverFeeEstimator_B8G6dqhW.mjs';
import { V as VehicleRelocationCalculator } from '../chunks/VehicleRelocationCalculator_CjPSfBBW.mjs';
export { renderers } from '../renderers.mjs';

const $$Calculator = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Travel Cost Estimator | Kalidass Travels", "description": "Calculate costs for Taxi, Acting Drivers, and Vehicle Relocation services." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="bg-slate-50 min-h-screen pt-24 pb-12"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="text-center mb-12"> <h1 class="text-4xl font-bold text-slate-900 mb-4"> <span class="lang-en">Travel Cost Estimator</span> <span class="lang-ta">பயண செலவு கணிப்பான்</span> </h1> <p class="text-lg text-slate-600 max-w-2xl mx-auto"> <span class="lang-en">Get instant price estimates for Taxi, Acting Drivers, and Vehicle Relocation services.</span> <span class="lang-ta">எங்கள் ஆக்டிங் டிரைவர் மற்றும் வாகன இடமாற்ற சேவைகளுக்கான பயண செலவுகளை உடனடியாக மதிப்பிடுங்கள்.</span> </p> </div> <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">  <div class="w-full flex justify-center"> ${renderComponent($$result2, "QuotationEngine", QuotationEngine, { "client:load": true, "showAirportTab": false, "showBookingButton": false, "title": "Taxi Fare Estimator", "variant": "card", "client:component-hydration": "load", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/QuotationEngine.jsx", "client:component-export": "default" })} </div>  <div class="w-full flex justify-center"> ${renderComponent($$result2, "DriverFeeEstimator", $$DriverFeeEstimator, {})} </div>  <div class="w-full flex justify-center lg:col-span-2"> ${renderComponent($$result2, "VehicleRelocationCalculator", VehicleRelocationCalculator, { "client:load": true, "client:component-hydration": "load", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/VehicleRelocationCalculator.jsx", "client:component-export": "default" })} </div> </div> </div> </div> ` })}`;
}, "D:/websites/kalidass-attempt-main/src/pages/calculator.astro", void 0);

const $$file = "D:/websites/kalidass-attempt-main/src/pages/calculator.astro";
const $$url = "/calculator";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Calculator,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
