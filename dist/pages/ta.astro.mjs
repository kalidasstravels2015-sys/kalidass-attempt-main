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
    url: "https://kalidasstravels.in/ta",
    priceRange: "\u20B9\u20B9",
    inLanguage: "ta-IN"
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "\u0B95\u0BBE\u0BB3\u0BBF\u0BA4\u0BBE\u0BB8\u0BCD \u0B9F\u0BBF\u0BB0\u0BBE\u0BB5\u0BB2\u0BCD\u0BB8\u0BCD - \u0B9A\u0BC6\u0BA9\u0BCD\u0BA9\u0BC8 \u0B9A\u0BBF\u0BB1\u0BA8\u0BCD\u0BA4 \u0B9F\u0BBE\u0B95\u0BCD\u0BB8\u0BBF \u0B9A\u0BC7\u0BB5\u0BC8", "description": "\u0B9A\u0BC6\u0BA9\u0BCD\u0BA9\u0BC8\u0BAF\u0BBF\u0BB2\u0BCD \u0B9A\u0BBF\u0BB1\u0BA8\u0BCD\u0BA4 \u0B95\u0BCB\u0BB5\u0BBF\u0BB2\u0BCD \u0B9A\u0BC1\u0BB1\u0BCD\u0BB1\u0BC1\u0BB2\u0BBE \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0BB5\u0BC6\u0BB3\u0BBF\u0BAF\u0BC2\u0BB0\u0BCD \u0B9F\u0BBE\u0B95\u0BCD\u0BB8\u0BBF \u0B9A\u0BC7\u0BB5\u0BC8. \u0BAA\u0BBE\u0BA4\u0BC1\u0B95\u0BBE\u0BAA\u0BCD\u0BAA\u0BBE\u0BA9 \u0BAA\u0BAF\u0BA3\u0BAE\u0BCD, \u0B95\u0BC1\u0BB1\u0BC8\u0BA8\u0BCD\u0BA4 \u0B95\u0B9F\u0BCD\u0B9F\u0BA3\u0BAE\u0BCD.", "schema": schema, "image": ogImage, "lang": "ta" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Hero", $$Hero, {})} ${renderComponent($$result2, "BookingPanel", $$BookingPanel, { "lang": "ta" })} ${renderComponent($$result2, "Services", $$Services, {})} ${renderComponent($$result2, "FleetRoll", FleetRoll, { "client:visible": true, "currentLang": "ta", "client:component-hydration": "visible", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/react/FleetRoll.jsx", "client:component-export": "default" })} ${renderComponent($$result2, "Tours", $$Tours, {})}  ${renderComponent($$result2, "PartnersCarousel", PartnersCarousel, { "client:visible": true, "currentLang": "ta", "client:component-hydration": "visible", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/react/PartnersCarousel.jsx", "client:component-export": "default" })} ${renderComponent($$result2, "DriversCarousel", DriversCarousel, { "client:visible": true, "currentLang": "ta", "client:component-hydration": "visible", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/react/DriversCarousel.jsx", "client:component-export": "default" })} ${renderComponent($$result2, "ReviewsCarousel", ReviewsCarousel, { "client:visible": true, "currentLang": "ta", "client:component-hydration": "visible", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/react/ReviewsCarousel.jsx", "client:component-export": "default" })} ${renderComponent($$result2, "FAQ", $$FAQ, {})} ${renderComponent($$result2, "TariffCalculator", TariffCalculator, { "client:idle": true, "currentLang": "ta", "client:component-hydration": "idle", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/react/TariffCalculator.jsx", "client:component-export": "default" })} ${renderComponent($$result2, "SafetySection", $$SafetySection, {})} ` })}`;
}, "D:/websites/kalidass-attempt-main/src/pages/ta/index.astro", void 0);

const $$file = "D:/websites/kalidass-attempt-main/src/pages/ta/index.astro";
const $$url = "/ta";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Index,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
