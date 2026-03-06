/* empty css                                      */
import { c as createComponent, r as renderComponent, a as renderTemplate } from '../chunks/astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_D-d8fNH6.mjs';
import { $ as $$Hero, a as $$BookingPanel, b as $$Services, F as FleetRoll, c as $$Tours, P as PartnersCarousel, D as DriversCarousel, R as ReviewsCarousel, d as $$FAQ, T as TariffCalculator, e as $$SafetySection } from '../chunks/TariffCalculator_6kRhkuj7.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const ogImage = "/images/logo.png";
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Kalidass Travels",
    image: "https://kalidasstravels.in/images/logo.png",
    telephone: "+919092303060",
    email: "bookings@kalidasstravels.in",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Chennai",
      addressRegion: "Tamil Nadu",
      addressCountry: "IN"
    },
    url: "https://kalidasstravels.in",
    priceRange: "\u20B9\u20B9"
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Kalidass Travels - Premium Travel Experience in South India", "description": "Trusted travel partner in Chennai for Temple Tours, Corporate Travel, and Outstation Cabs. Verified drivers, transparent pricing, and 24/7 support.", "schema": schema, "image": ogImage }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Hero", $$Hero, {})} ${renderComponent($$result2, "BookingPanel", $$BookingPanel, { "lang": "en" })} ${renderComponent($$result2, "Services", $$Services, {})} ${renderComponent($$result2, "FleetRoll", FleetRoll, { "client:visible": true, "currentLang": "en", "client:component-hydration": "visible", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/react/FleetRoll.jsx", "client:component-export": "default" })} ${renderComponent($$result2, "Tours", $$Tours, {})}  ${renderComponent($$result2, "PartnersCarousel", PartnersCarousel, { "client:visible": true, "currentLang": "en", "client:component-hydration": "visible", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/react/PartnersCarousel.jsx", "client:component-export": "default" })} ${renderComponent($$result2, "DriversCarousel", DriversCarousel, { "client:visible": true, "currentLang": "en", "client:component-hydration": "visible", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/react/DriversCarousel.jsx", "client:component-export": "default" })} ${renderComponent($$result2, "ReviewsCarousel", ReviewsCarousel, { "client:visible": true, "currentLang": "en", "client:component-hydration": "visible", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/react/ReviewsCarousel.jsx", "client:component-export": "default" })} ${renderComponent($$result2, "FAQ", $$FAQ, {})} ${renderComponent($$result2, "TariffCalculator", TariffCalculator, { "client:idle": true, "currentLang": "en", "client:component-hydration": "idle", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/react/TariffCalculator.jsx", "client:component-export": "default" })} ${renderComponent($$result2, "SafetySection", $$SafetySection, {})} ` })}`;
}, "D:/websites/kalidass-attempt-main/src/pages/index.astro", void 0);

const $$file = "D:/websites/kalidass-attempt-main/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
