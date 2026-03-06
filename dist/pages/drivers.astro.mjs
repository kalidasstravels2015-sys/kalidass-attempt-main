/* empty css                                      */
import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from '../chunks/astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { $ as $$Layout, s as siteContent } from '../chunks/Layout_D-d8fNH6.mjs';
import { Star, ShieldCheck, Clock, Languages } from 'lucide-react';
export { renderers } from '../renderers.mjs';

const $$Drivers = createComponent(($$result, $$props, $$slots) => {
  const drivers = siteContent.drivers;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Our Drivers - Kalidass Travels", "description": "Meet our professional, verified, and experienced drivers." }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="pt-24 pb-12 bg-slate-50 min-h-screen"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="text-center mb-12"> <h1 class="text-4xl font-bold text-slate-900 mb-4">Our Professional Drivers</h1> <p class="text-lg text-slate-600 max-w-2xl mx-auto">
Experienced, verified, and multilingual drivers dedicated to making your journey safe and comfortable.
</p> </div> <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"> ${drivers.map((driver) => renderTemplate`<div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all duration-300 group flex flex-col h-full"> <div class="relative mb-4 overflow-hidden rounded-xl shrink-0"> <img${addAttribute(driver.image, "src")} class="w-full h-48 md:h-64 object-cover transform group-hover:scale-105 transition-transform duration-500"${addAttribute(driver.name, "alt")}> </div> <div class="flex justify-between items-start mb-2"> <h3 class="font-bold text-lg text-slate-900 leading-tight">${driver.name}</h3> <div class="flex items-center bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 shrink-0 ml-2"> ${renderComponent($$result2, "Star", Star, { "className": "w-3 h-3 text-amber-500 fill-current" })} <span class="text-[10px] font-bold text-slate-700 ml-1">${driver.rating || "4.8"}</span> </div> </div> <div class="flex flex-wrap gap-2 mb-3"> <div class="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-100 rounded text-[10px] font-bold text-green-700"> ${renderComponent($$result2, "ShieldCheck", ShieldCheck, { "className": "w-3 h-3" })}
PVC Verified
</div> ${driver.trips && renderTemplate`<div class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-600"> <span class="text-indigo-600">●</span> ${driver.trips} Trips
</div>`} </div> <div class="text-sm text-slate-600 space-y-2 mb-4 flex-grow"> <div class="flex items-center gap-2"> ${renderComponent($$result2, "Clock", Clock, { "className": "w-4 h-4 text-slate-400 shrink-0" })} <span class="truncate">${driver.experience}</span> </div> <div class="flex items-center gap-2"> ${renderComponent($$result2, "Languages", Languages, { "className": "w-4 h-4 text-slate-400 shrink-0" })} <span class="truncate">${driver.languages}</span> </div> </div> </div>`)} </div> </div> </main> ` })}`;
}, "D:/websites/kalidass-attempt-main/src/pages/drivers.astro", void 0);

const $$file = "D:/websites/kalidass-attempt-main/src/pages/drivers.astro";
const $$url = "/drivers";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Drivers,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
