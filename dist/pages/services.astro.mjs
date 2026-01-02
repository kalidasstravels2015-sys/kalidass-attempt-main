/* empty css                                      */
import { d as createAstro, c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from '../chunks/astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_DqQjb86R.mjs';
import { s as serviceDetails } from '../chunks/serviceDetails_CAUNQnnT.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://kalidasstravels.in");
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const servicesByCategory = serviceDetails.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {});
  const categories = Object.keys(servicesByCategory);
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "All Services - Kalidass Travels",
    "description": "Explore our wide range of travel solutions including Temple Tours, Corporate Travel, and Outstation Cabs.",
    "url": Astro2.url.href,
    "image": "https://kalidasstravels.in/images/logo.png"
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "All Services - Kalidass Travels", "description": "Browse our complete list of travel services. From spiritual temple tours to professional corporate cab services in Chennai.", "schema": schema }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="bg-gray-50 min-h-screen py-20"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="text-center mb-16"> <h1 class="text-4xl font-bold text-gray-900 mb-4">Our Complete Services</h1> <p class="text-lg text-gray-600">Explore our wide range of travel solutions</p> </div> <div class="space-y-16"> ${categories.map((category) => renderTemplate`<section> <h2 class="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2"> ${category} </h2> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> ${servicesByCategory[category].map((service) => renderTemplate`<a${addAttribute(`/services/${service.slug}`, "href")} class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"> <h3 class="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors mb-2"> ${service.title} </h3> ${service.overview && renderTemplate`<p class="text-gray-500 text-sm line-clamp-2"> ${service.overview} </p>`} <div class="mt-4 text-red-600 text-sm font-medium flex items-center gap-1">
View Details <i class="fa-solid fa-arrow-right text-xs"></i> </div> </a>`)} </div> </section>`)} </div> </div> </main> ` })}`;
}, "D:/websites/kalidass-attempt-main/src/pages/services/index.astro", void 0);

const $$file = "D:/websites/kalidass-attempt-main/src/pages/services/index.astro";
const $$url = "/services";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
