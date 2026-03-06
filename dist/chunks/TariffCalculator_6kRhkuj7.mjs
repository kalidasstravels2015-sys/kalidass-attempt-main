import { c as createComponent, m as maybeRenderHead, b as addAttribute, r as renderComponent, a as renderTemplate, d as createAstro } from './astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { $ as $$OptimizedImage } from './OptimizedImage_BicJadH1.mjs';
import { s as siteContent, u as useLanguage } from './Layout_D-d8fNH6.mjs';
import { Q as QuotationEngine, t as trackEvent } from './QuotationEngine_3XpVGP06.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Zap, Users, ArrowRight, Star, Clock, Languages } from 'lucide-react';
import { s as serviceDetails } from './serviceDetails_CAUNQnnT.mjs';
/* empty css                         */
import 'clsx';

const $$Hero = createComponent(($$result, $$props, $$slots) => {
  const hero = siteContent.hero;
  const heroImages = hero.images ?? [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1920"
  ];
  return renderTemplate`${maybeRenderHead()}<section class="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-20"> <!-- Background Slideshow --> <div class="absolute inset-0 z-0"> <div class="hero-slides absolute inset-0 pointer-events-none" aria-hidden="true"> ${heroImages.map((image, index) => renderTemplate`<div class="hero-slide relative w-full h-full"${addAttribute(`animation-delay: ${index * 6}s; opacity: 0;`, "style")}> ${renderComponent($$result, "OptimizedImage", $$OptimizedImage, { "src": image, "alt": "Hero Background", "class": "absolute inset-0 w-full h-full object-cover", "loading": index === 0 ? "eager" : "lazy" })} </div>`)} </div> <div class="absolute inset-0" style="background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6));"></div> </div> <div class="relative z-10 max-w-4xl mx-4 sm:mx-auto text-center space-y-8 -mt-12"> <div class="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-black/50 border border-white/20 mb-2 shadow-lg"> <span class="text-green-500 text-[10px]">●</span> <p class="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/90"> <span class="lang-en">Trusted by 1,000+ Families</span> <span class="lang-ta">1,000+ குடும்பங்களின் நம்பிக்கை</span> </p> </div> <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight drop-shadow-[0_8px_8px_rgba(0,0,0,0.6)] mb-4"> <span class="lang-en block">Premium Taxi Service</span> <span class="lang-en block text-3xl sm:text-5xl lg:text-5xl text-yellow-400 mt-2 font-black italic tracking-normal">Chennai & South India</span> <span class="lang-ta block">சிறந்த டாக்ஸி சேவை</span> <span class="lang-ta block text-2xl sm:text-3xl lg:text-4xl text-yellow-400 mt-2 font-bold">சென்னை மற்றும் தென்னிந்தியா</span> </h1> <p class="text-base sm:text-xl text-white font-medium drop-shadow-md px-4 max-w-2xl mx-auto leading-relaxed"> <span class="lang-en">Safe, reliable, and professional transportation at transparent rates.
        Temple tours, airport transfers & corporate travel.</span> <span class="lang-ta">பாதுகாப்பான மற்றும் வசதியான வெளியூர் பயணங்கள் மற்றும் அலுவலகப்
        போக்குவரத்துக்கு எங்களை அணுகவும்.</span> </p> <div class="pt-6"> <a href="#booking-panel" class="inline-flex items-center gap-3 px-10 py-5 bg-red-600 hover:bg-red-700 text-white text-lg font-black rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(220,38,38,0.3)] hover:shadow-[0_20px_50px_rgba(220,38,38,0.5)]"> <span class="lang-en">Book Your Ride Now</span> <span class="lang-ta">முன்பதிவு செய்யுங்கள்</span> <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path> </svg> </a> </div> </div> <!-- Scroll Indicator --> <a href="#booking-panel" class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hover:text-yellow-300 transition-colors" aria-label="Scroll to booking form"> <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path> </svg> </a> </section> <style>
  .hero-slides {
    position: absolute;
    inset: 0;
    overflow: hidden;
    mix-blend-mode: normal;
  }

  .hero-slide {
    position: absolute;
    inset: 0;
    /* Opacity handled by animation */
    /* background properties removed as we use img tag now */
    animation: heroCinematic 24s ease-in-out infinite;
    animation-fill-mode: both;
    filter: saturate(1.1);
  }

  @keyframes heroCinematic {
    0% {
      opacity: 0;
      transform: scale(1.08);
    }
    10% {
      opacity: 1;
      transform: scale(1);
    }
    30% {
      opacity: 1;
      transform: scale(1.02);
    }
    40% {
      opacity: 0;
      transform: scale(1.1);
    }
    100% {
      opacity: 0;
      transform: scale(1.08);
    }
  }
</style>`;
}, "D:/websites/kalidass-attempt-main/src/components/Hero.astro", void 0);

const $$Astro = createAstro("https://kalidasstravels.in");
const $$BookingPanel = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BookingPanel;
  const { lang = "en" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<section id="booking-panel" class="relative z-20 py-16 md:py-24 px-4 max-w-3xl mx-auto scroll-mt-20"> ${renderComponent($$result, "QuotationEngine", QuotationEngine, { "client:load": true, "currentLang": lang, "client:component-hydration": "load", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/QuotationEngine.jsx", "client:component-export": "default" })} </section>`;
}, "D:/websites/kalidass-attempt-main/src/components/BookingPanel.astro", void 0);

const $$Services = createComponent(($$result, $$props, $$slots) => {
  const services = siteContent.services;
  return renderTemplate`${maybeRenderHead()}<section id="services" class="py-10 md:py-16 bg-gray-50"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <!-- Section Header --> <div class="text-center mb-8"> <h2 class="text-3xl md:text-5xl font-extrabold text-gray-900 inline-block relative mb-4 leading-tight"> <span class="lang-en">Our Premium Travel Services</span> <span class="lang-ta">எங்களின் சிறப்பான பயண சேவைகள்</span> <div class="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-24 h-1.5 bg-blue-600 rounded-full"></div> </h2> <p class="text-lg text-gray-600 max-w-3xl mx-auto mt-4 font-medium"> <span class="lang-en">From specialized Temple Tours to Corporate Employee Transport, we provide safe and reliable taxi services across Chennai and Tamil Nadu.</span> <span class="lang-ta">கோவில் சுற்றுலா முதல் அலுவலகப் போக்குவரத்து வரை, சென்னை மற்றும் தமிழ்நாடு முழுவதும் பாதுகாப்பான மற்றும் நம்பகமான டாக்ஸி சேவைகளை நாங்கள் வழங்குகிறோம்.</span> </p> </div> <!-- Services Grid --> <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8"> ${services.map((service) => renderTemplate`<a${addAttribute(service.link, "href")}${addAttribute(`Book ${service.title} in Chennai`, "title")} class="group relative h-64 sm:h-96 rounded-2xl overflow-hidden shadow-lg border border-gray-100 cursor-pointer block transform hover:-translate-y-1 transition duration-300"> <!-- Background Image --> ${renderComponent($$result, "OptimizedImage", $$OptimizedImage, { "src": service.image, "alt": `Kalidass Travels - ${service.title}`, "class": "absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" })} <!-- Gradient Overlay --> <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90"></div> <!-- Content --> <div class="absolute inset-0 flex flex-col justify-end p-4 sm:p-6"> <h3 class="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight drop-shadow-md"> <span class="lang-en">${service.title}</span> <span class="lang-ta">${service.title_ta}</span> </h3> <p class="text-gray-200 text-xs sm:text-sm line-clamp-3 mb-4 hidden sm:block"> <span class="lang-en">${service.description}</span> <span class="lang-ta">${service.description_ta}</span> </p> <div class="flex items-center text-blue-300 font-bold text-xs uppercase tracking-wider bg-black/30 w-fit px-3 py-1 rounded-full backdrop-blur-sm group-hover:bg-blue-600 group-hover:text-white transition-colors"> <span class="lang-en mr-1 sm:mr-2">Book ${service.title}</span> <span class="lang-ta mr-1 sm:mr-2">முன்பதிவு செய்க</span> <i class="fas fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i> </div> </div> </a>`)} </div> </div> </section>`;
}, "D:/websites/kalidass-attempt-main/src/components/Services.astro", void 0);

const FleetCard = ({ vehicle, lang, isVisible }) => {
  const isTa = lang === "ta";
  vehicle.name.includes("Tempo");
  vehicle.name.toLowerCase().includes("innova") || vehicle.name.toLowerCase().includes("bolero") || vehicle.name.toLowerCase().includes("sumo");
  return /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 w-80 snap-center md:w-auto md:snap-align-none transition-opacity duration-500 opacity-100 h-full", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col", children: [
    /* @__PURE__ */ jsx("div", { className: "relative h-56 overflow-hidden bg-slate-100", children: isVisible && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: vehicle.image,
          alt: isTa ? vehicle.name_ta || vehicle.name : vehicle.name,
          className: "w-full h-full object-cover transition-transform duration-700 hover:scale-110",
          loading: "lazy"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" }),
      /* @__PURE__ */ jsxs("div", { className: "absolute top-4 left-4 flex flex-col gap-2", children: [
        vehicle.details.some((d) => d.toLowerCase().includes("sanitized")) && /* @__PURE__ */ jsxs("span", { className: "bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 w-fit", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3 h-3" }),
          isTa ? "சுத்திகரிக்கப்பட்டது" : "Sanitized Every Trip"
        ] }),
        vehicle.details.some((d) => d.toLowerCase().includes("mountain")) && /* @__PURE__ */ jsxs("span", { className: "bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 w-fit", children: [
          /* @__PURE__ */ jsx(Zap, { className: "w-3 h-3" }),
          isTa ? "மலைப் பயணம் சிறந்தது" : "Hill Specialist"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-4 left-4", children: /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-white tracking-tight", children: isTa ? vehicle.name_ta || vehicle.name : vehicle.name }) })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 flex-1 flex flex-col", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-3 rounded-xl border border-slate-100", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1", children: isTa ? "கட்டணம்" : "Starting From" }),
          /* @__PURE__ */ jsx("p", { className: "text-xl font-black text-indigo-600 leading-none", children: isTa ? vehicle.rate_ta || vehicle.rate : vehicle.rate })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-3 rounded-xl border border-slate-100", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1", children: isTa ? "இருக்கைகள்" : "Capacity" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 text-slate-600" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700", children: isTa ? vehicle.caps_ta || vehicle.caps : vehicle.caps })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-3 flex-1", children: vehicle.details.filter((f) => !f.toLowerCase().includes("sanitized")).map((feature, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "mt-1 bg-indigo-50 p-1 rounded", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3 h-3 text-indigo-600" }) }),
        /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-600 font-medium leading-tight", children: feature })
      ] }, idx)) })
    ] })
  ] }) });
};
const FleetRoll = ({ currentLang }) => {
  const fleet = siteContent.fleet;
  const isSSR = !!currentLang;
  const contextLang = useLanguage();
  const lang = isSSR ? currentLang : contextLang;
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const labels = siteContent.ui_labels;
  const heading = lang === "ta" ? labels.our_premium_fleet_ta : labels.our_premium_fleet;
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollLeft, offsetWidth } = containerRef.current;
        const index = Math.round(scrollLeft / (offsetWidth * 0.85));
        setActiveIndex(Math.min(index, fleet.length - 1));
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [fleet.length]);
  return /* @__PURE__ */ jsxs("section", { id: "fleet", className: "py-20 bg-white", ref: containerRef, "aria-labelledby": "fleet-heading", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsxs("h2", { id: "fleet-heading", className: "text-2xl md:text-4xl font-extrabold text-gray-900 inline-block relative mb-4", children: [
          heading,
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-red-600 rounded-full" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-base text-gray-600 max-w-2xl mx-auto mt-4", children: lang === "ta" ? "உங்கள் பயணத்திற்கு ஏற்ற வாகனத்தைத் தேர்வு செய்யவும்" : "Choose from our well-maintained fleet of vehicles for your journey" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: containerRef,
            className: "flex overflow-x-auto snap-x snap-mandatory pb-8 space-x-6 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 md:space-x-0 md:overflow-visible md:pb-0 scrollbar-hide focus:outline-none rounded-xl",
            tabIndex: 0,
            role: "region",
            "aria-label": "Fleet Gallery",
            children: fleet.map((vehicle, index) => /* @__PURE__ */ jsx(FleetCard, { vehicle, lang, isVisible: true }, index))
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-6 space-x-2 md:hidden", "aria-hidden": "true", children: fleet.map((_, index) => /* @__PURE__ */ jsx(
          "div",
          {
            className: `w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeIndex === index ? "bg-red-600 w-6" : "bg-slate-300"}`
          },
          index
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { jsx: true, children: `
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      ` })
  ] });
};

const $$Tours = createComponent(($$result, $$props, $$slots) => {
  const templeTripsSlugs = [
    "sabarimala-trip",
    "thiruvannamalai-girivalam-trip",
    "tirupati-package",
    "rameswaram-2-days",
    "chidambaram-temple-trip",
    "navagraha-tour"
  ];
  const templeTrips = serviceDetails.filter(
    (service) => templeTripsSlugs.includes(service.slug)
  );
  const destinationSlugs = [
    "pondicherry-one-day-trip",
    "mahabalipuram-ecr-temple-route",
    "one-day-chennai-city-tour"
  ];
  const popularDestinations = serviceDetails.filter(
    (service) => destinationSlugs.includes(service.slug)
  );
  const tourImages = {
    "tirupati-package": "/images/temple/Tirupati-Balaji.jpg",
    "thiruvannamalai-girivalam-trip": "/images/temple/Thiruvannamalai-Girivalam.jpg",
    "rameswaram-2-days": "/images/temple/Rameswaram.jpg",
    "navagraha-tour": "/images/temple/Navagraha.jpg",
    "kanchipuram-temple-trip": "/images/temple/Kanchipuram-Temple.jpg",
    "chidambaram-temple-trip": "/images/temple/Chidambaram-Natarajar-Temple.jpg",
    "sabarimala-trip": "/images/temple/Sabarimala-Temple.jpg",
    "pondicherry-one-day-trip": "https://images.pexels.com/photos/32009229/pexels-photo-32009229.jpeg?auto=compress&cs=tinysrgb&w=800",
    "vellore-golden-temple": "/images/temple/Vellore-Golden.jpg",
    "mahabalipuram-ecr-temple-route": "/images/temple/Mahabalipuram-ECR-Temples.jpg",
    "one-day-chennai-city-tour": "/images/temple/chennai-city.jpg"
  };
  const tourImageAlts = {
    "tirupati-package": "Tirupati Balaji Temple darshan package with taxi service from Chennai",
    "thiruvannamalai-girivalam-trip": "Thiruvannamalai Girivalam full moon day trip from Chennai",
    "rameswaram-2-days": "Rameswaram 2-day pilgrimage tour including Dhanushkodi beach",
    "navagraha-tour": "Complete Navagraha temple tour package Kumbakonam taxi",
    "chidambaram-temple-trip": "Chidambaram Nataraja Temple spiritual visit taxi service",
    "sabarimala-trip": "Sabarimala Mandala Pooja pilgrimage taxi package from Chennai",
    "pondicherry-one-day-trip": "Pondicherry one day sightseeing trip from Chennai by car",
    "mahabalipuram-ecr-temple-route": "Mahabalipuram and ECR temple heritage tour taxi",
    "one-day-chennai-city-tour": "Chennai local city sightseeing day tour cab service"
  };
  return renderTemplate`${maybeRenderHead()}<section id="tours" class="py-10 md:py-16 bg-gray-50" data-astro-cid-pycgp2iy> <div class="max-w-7xl mx-auto px-4" data-astro-cid-pycgp2iy> <!-- SECTION 1: POPULAR TEMPLE TRIPS --> <div class="mb-12" data-astro-cid-pycgp2iy> <div class="text-center mb-8" data-astro-cid-pycgp2iy> <h2 class="text-2xl md:text-4xl font-extrabold text-gray-900 inline-block relative mb-3" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>Popular Temple Trips</span> <span class="lang-ta" data-astro-cid-pycgp2iy>பிரபலமான கோவில் சுற்றுலா</span> <div class="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-16 h-1 bg-orange-600 rounded-full" data-astro-cid-pycgp2iy></div> </h2> <p class="text-base text-gray-600 max-w-2xl mx-auto mt-2" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>Sacred pilgrimages and spiritual journeys.</span> <span class="lang-ta" data-astro-cid-pycgp2iy>புனித யாத்திரைகள் மற்றும் ஆன்மீக பயணங்கள்.</span> </p> </div> <div class="flex overflow-x-auto gap-4 px-2 pb-6 scrollbar-hide snap-x" data-astro-cid-pycgp2iy> ${templeTrips.map((tour) => renderTemplate`<a${addAttribute(`/services/${tour.slug}`, "href")} class="block flex-none w-64 sm:w-72 snap-center bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-md transition" data-astro-cid-pycgp2iy> <div class="h-36 sm:h-40 overflow-hidden relative" data-astro-cid-pycgp2iy> ${renderComponent($$result, "OptimizedImage", $$OptimizedImage, { "src": tourImages[tour.slug] || "https://images.unsplash.com/photo-1596700414605-e45f1b1c7c9a?q=80&w=600", "alt": tourImageAlts[tour.slug] || tour.title, "class": "w-full h-full object-cover group-hover:scale-105 transition duration-700", "data-astro-cid-pycgp2iy": true })} <span class="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>PILGRIMAGE</span> <span class="lang-ta" data-astro-cid-pycgp2iy>யாத்திரை</span> </span> </div> <div class="p-4" data-astro-cid-pycgp2iy> <h3 class="font-bold text-base text-gray-900 mb-1 line-clamp-1" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>${tour.title}</span> <span class="lang-ta" data-astro-cid-pycgp2iy>${tour.title_ta}</span> </h3> <p class="text-xs text-gray-500 mb-3 line-clamp-2" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>${tour.overview}</span> <span class="lang-ta" data-astro-cid-pycgp2iy>${tour.overview_ta}</span> </p> <div class="flex items-center text-orange-600 font-bold text-xs uppercase tracking-wide group-hover:text-orange-700" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>Book ${tour.title}</span> <span class="lang-ta" data-astro-cid-pycgp2iy>${tour.title_ta} முன்பதிவு</span> <i class="fas fa-arrow-right ml-1 group-hover:translate-x-1 transition" data-astro-cid-pycgp2iy></i> </div> </div> </a>`)} </div> <div class="text-center mt-4" data-astro-cid-pycgp2iy> <a href="/services/category/temple-tours" class="inline-flex items-center text-orange-600 font-bold text-sm hover:text-orange-700 transition" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>View All</span> <span class="lang-ta" data-astro-cid-pycgp2iy>அனைத்தையும் காண்க</span> <i class="fas fa-arrow-right ml-2" data-astro-cid-pycgp2iy></i> </a> </div> </div> <!-- SECTION 2: POPULAR DESTINATIONS --> <div data-astro-cid-pycgp2iy> <div class="text-center mb-8" data-astro-cid-pycgp2iy> <h2 class="text-2xl md:text-4xl font-extrabold text-gray-900 inline-block relative mb-3" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>Popular Destinations</span> <span class="lang-ta" data-astro-cid-pycgp2iy>பிரபலமான இடங்கள்</span> <div class="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-16 h-1 bg-green-600 rounded-full" data-astro-cid-pycgp2iy></div> </h2> <p class="text-base text-gray-600 max-w-2xl mx-auto mt-2" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>Explore heritage sites, beaches, and city tours.</span> <span class="lang-ta" data-astro-cid-pycgp2iy>பாரம்பரிய இடங்கள், கடற்கரைகள் மற்றும் நகர சுற்றுலா.</span> </p> </div> <div class="flex overflow-x-auto gap-4 px-2 pb-6 scrollbar-hide snap-x" data-astro-cid-pycgp2iy> ${popularDestinations.map((tour) => renderTemplate`<a${addAttribute(`/services/${tour.slug}`, "href")} class="block flex-none w-64 sm:w-72 snap-center bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-md transition" data-astro-cid-pycgp2iy> <div class="h-36 sm:h-40 overflow-hidden relative" data-astro-cid-pycgp2iy> ${renderComponent($$result, "OptimizedImage", $$OptimizedImage, { "src": tourImages[tour.slug] || "https://images.unsplash.com/photo-1596700414605-e45f1b1c7c9a?q=80&w=600", "alt": tourImageAlts[tour.slug] || tour.title, "class": "w-full h-full object-cover group-hover:scale-105 transition duration-700", "data-astro-cid-pycgp2iy": true })} <span class="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>DESTINATION</span> <span class="lang-ta" data-astro-cid-pycgp2iy>சுற்றுலா தலம்</span> </span> </div> <div class="p-4" data-astro-cid-pycgp2iy> <h3 class="font-bold text-base text-gray-900 mb-1 line-clamp-1" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>${tour.title}</span> <span class="lang-ta" data-astro-cid-pycgp2iy>${tour.title_ta}</span> </h3> <p class="text-xs text-gray-500 mb-3 line-clamp-2" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>${tour.overview}</span> <span class="lang-ta" data-astro-cid-pycgp2iy>${tour.overview_ta}</span> </p> <div class="flex items-center text-green-600 font-bold text-xs uppercase tracking-wide group-hover:text-green-700" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>Explore ${tour.title}</span> <span class="lang-ta" data-astro-cid-pycgp2iy>${tour.title_ta} சுற்றுலா</span> <i class="fas fa-arrow-right ml-1 group-hover:translate-x-1 transition" data-astro-cid-pycgp2iy></i> </div> </div> </a>`)} </div> <div class="text-center mt-6" data-astro-cid-pycgp2iy> <a href="/services/category/popular-destinations" class="inline-flex items-center text-green-600 font-bold text-sm hover:text-green-700 transition" data-astro-cid-pycgp2iy> <span class="lang-en" data-astro-cid-pycgp2iy>View All</span> <span class="lang-ta" data-astro-cid-pycgp2iy>அனைத்தையும் காண்க</span> <i class="fas fa-arrow-right ml-2" data-astro-cid-pycgp2iy></i> </a> </div> </div> </div> </section> `;
}, "D:/websites/kalidass-attempt-main/src/components/Tours.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$FAQ = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate(_a || (_a = __template(["", '<section class="py-12 bg-gray-50 border-t border-gray-200"> <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="text-center mb-10"> <h2 class="text-3xl font-extrabold text-gray-900 mb-4"> <span class="lang-en">Common Questions About Taxi Services in Chennai</span> <span class="lang-ta">\u0B9A\u0BC6\u0BA9\u0BCD\u0BA9\u0BC8 \u0B9F\u0BBE\u0B95\u0BCD\u0BB8\u0BBF \u0B9A\u0BC7\u0BB5\u0BC8\u0B95\u0BB3\u0BCD \u0BAA\u0BB1\u0BCD\u0BB1\u0BBF\u0BAF \u0BAA\u0BCA\u0BA4\u0BC1\u0BB5\u0BBE\u0BA9 \u0B95\u0BC7\u0BB3\u0BCD\u0BB5\u0BBF\u0B95\u0BB3\u0BCD</span> </h2> <p class="text-gray-600"> <span class="lang-en">Find answers to frequently asked questions about our temple\n                    tours, corporate travel, and outstation cabs.</span> <span class="lang-ta">\u0B8E\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B95\u0BCB\u0BB5\u0BBF\u0BB2\u0BCD \u0B9A\u0BC1\u0BB1\u0BCD\u0BB1\u0BC1\u0BB2\u0BBE, \u0B95\u0BBE\u0BB0\u0BCD\u0BAA\u0BCD\u0BAA\u0BB0\u0BC7\u0B9F\u0BCD \u0BAA\u0BAF\u0BA3\u0BAE\u0BCD \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0BB5\u0BC6\u0BB3\u0BBF\u0BAF\u0BC2\u0BB0\u0BCD\n                    \u0B9F\u0BBE\u0B95\u0BCD\u0BB8\u0BBF \u0B9A\u0BC7\u0BB5\u0BC8\u0B95\u0BB3\u0BCD \u0BAA\u0BB1\u0BCD\u0BB1\u0BBF\u0BAF \u0B95\u0BC7\u0BB3\u0BCD\u0BB5\u0BBF\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BBE\u0BA9 \u0BAA\u0BA4\u0BBF\u0BB2\u0BCD\u0B95\u0BB3\u0BCD.</span> </p> </div> <div class="space-y-4"> <!-- FAQ Item 1 --> <details class="group bg-white rounded-lg shadow-sm"> <summary class="flex justify-between items-center font-medium cursor-pointer list-none p-6"> <span class="text-gray-900 font-semibold lang-en">Do you offer one-way drops from Chennai to other\n                        cities?</span> <span class="text-gray-900 font-semibold lang-ta">\u0B9A\u0BC6\u0BA9\u0BCD\u0BA9\u0BC8\u0BAF\u0BBF\u0BB2\u0BBF\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4\u0BC1 \u0BAE\u0BB1\u0BCD\u0BB1 \u0BA8\u0B95\u0BB0\u0B99\u0BCD\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0B92\u0BB0\u0BC1 \u0BB5\u0BB4\u0BBF \u0BAA\u0BAF\u0BA3\u0BAE\u0BCD\n                        \u0B89\u0BB3\u0BCD\u0BB3\u0BA4\u0BBE?</span> <span class="transition group-open:rotate-180"> <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg> </span> </summary> <div class="text-gray-600 px-6 pb-6"> <p class="lang-en">\nYes, we provide affordable one-way drop taxi services\n                        from Chennai to major cities like Bangalore, Coimbatore,\n                        Trichy, and Madurai. You only pay for the one-way\n                        distance traveled.\n</p> <p class="lang-ta">\n\u0B86\u0BAE\u0BCD, \u0B9A\u0BC6\u0BA9\u0BCD\u0BA9\u0BC8\u0BAF\u0BBF\u0BB2\u0BBF\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4\u0BC1 \u0BAA\u0BC6\u0B99\u0BCD\u0B95\u0BB3\u0BC2\u0BB0\u0BCD, \u0B95\u0BCB\u0BAF\u0BAE\u0BCD\u0BAA\u0BC1\u0BA4\u0BCD\u0BA4\u0BC2\u0BB0\u0BCD, \u0BA4\u0BBF\u0BB0\u0BC1\u0B9A\u0BCD\u0B9A\u0BBF\n                        \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0BAE\u0BA4\u0BC1\u0BB0\u0BC8 \u0BAA\u0BCB\u0BA9\u0BCD\u0BB1 \u0BAE\u0BC1\u0B95\u0BCD\u0B95\u0BBF\u0BAF \u0BA8\u0B95\u0BB0\u0B99\u0BCD\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0B92\u0BB0\u0BC1 \u0BB5\u0BB4\u0BBF \u0B9F\u0BBE\u0B95\u0BCD\u0BB8\u0BBF\n                        \u0B9A\u0BC7\u0BB5\u0BC8\u0B95\u0BB3\u0BC8 \u0BA8\u0BBE\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BB5\u0BB4\u0B99\u0BCD\u0B95\u0BC1\u0B95\u0BBF\u0BB1\u0BCB\u0BAE\u0BCD.\n</p> </div> </details> <!-- FAQ Item 2 --> <details class="group bg-white rounded-lg shadow-sm"> <summary class="flex justify-between items-center font-medium cursor-pointer list-none p-6"> <span class="text-gray-900 font-semibold lang-en">What vehicles are available for temple tour packages?</span> <span class="text-gray-900 font-semibold lang-ta">\u0B95\u0BCB\u0BB5\u0BBF\u0BB2\u0BCD \u0B9A\u0BC1\u0BB1\u0BCD\u0BB1\u0BC1\u0BB2\u0BBE\u0B95\u0BCD\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0B8E\u0BA9\u0BCD\u0BA9 \u0BB5\u0BBE\u0B95\u0BA9\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B89\u0BB3\u0BCD\u0BB3\u0BA9?</span> <span class="transition group-open:rotate-180"> <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg> </span> </summary> <div class="text-gray-600 px-6 pb-6"> <p class="lang-en">\nWe have a diverse fleet suitable for all group sizes,\n                        including Swift Dzire (4 pax), Toyota Etios (4 pax),\n                        Innova Crysta (6-7 pax), and Tempo Traveller (12+ pax)\n                        for larger family pilgrimages to Tirupati, Rameswaram,\n                        and Navagraha temples.\n</p> <p class="lang-ta">\n\u0B8E\u0B99\u0BCD\u0B95\u0BB3\u0BBF\u0B9F\u0BAE\u0BCD \u0BB8\u0BCD\u0BB5\u0BBF\u0B83\u0BAA\u0BCD\u0B9F\u0BCD \u0B9F\u0BBF\u0B9A\u0BC8\u0BAF\u0BB0\u0BCD, \u0B9F\u0BCA\u0BAF\u0BCB\u0B9F\u0BCD\u0B9F\u0BBE \u0B8E\u0B9F\u0BCD\u0B9F\u0BBF\u0BAF\u0BCB\u0BB8\u0BCD, \u0B87\u0BA9\u0BCD\u0BA9\u0BCB\u0BB5\u0BBE\n                        \u0B95\u0BBF\u0BB0\u0BBF\u0BB8\u0BCD\u0B9F\u0BBE \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF \u0B95\u0BC1\u0B9F\u0BC1\u0BAE\u0BCD\u0BAA\u0B99\u0BCD\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0B9F\u0BC6\u0BAE\u0BCD\u0BAA\u0BCB \u0B9F\u0BBF\u0BB0\u0BBE\u0BB5\u0BB2\u0BB0\u0BCD\n                        \u0BAA\u0BCB\u0BA9\u0BCD\u0BB1 \u0BAA\u0BB2\u0BCD\u0BB5\u0BC7\u0BB1\u0BC1 \u0BB5\u0BBE\u0B95\u0BA9\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B89\u0BB3\u0BCD\u0BB3\u0BA9.\n</p> </div> </details> <!-- FAQ Item 3 --> <details class="group bg-white rounded-lg shadow-sm"> <summary class="flex justify-between items-center font-medium cursor-pointer list-none p-6"> <span class="text-gray-900 font-semibold lang-en">Are driver batta and toll charges included?</span> <span class="text-gray-900 font-semibold lang-ta">\u0B9F\u0BBF\u0BB0\u0BC8\u0BB5\u0BB0\u0BCD \u0BAA\u0BC7\u0B9F\u0BCD\u0B9F\u0BBE \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0B9F\u0BCB\u0BB2\u0BCD \u0B95\u0B9F\u0BCD\u0B9F\u0BA3\u0B99\u0BCD\u0B95\u0BB3\u0BCD\n                        \u0B9A\u0BC7\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BC1\u0BB3\u0BCD\u0BB3\u0BA4\u0BBE?</span> <span class="transition group-open:rotate-180"> <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg> </span> </summary> <div class="text-gray-600 px-6 pb-6"> <p class="lang-en">\nOur package estimates usually include driver batta.\n                        However, toll gate charges, parking fees, and interstate\n                        permit taxes are to be paid directly by the guest as per\n                        actuals.\n</p> <p class="lang-ta">\n\u0B8E\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B95\u0B9F\u0BCD\u0B9F\u0BA3 \u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC0\u0B9F\u0BCD\u0B9F\u0BBF\u0BB2\u0BCD \u0B9F\u0BBF\u0BB0\u0BC8\u0BB5\u0BB0\u0BCD \u0BAA\u0BC7\u0B9F\u0BCD\u0B9F\u0BBE \u0B85\u0B9F\u0B99\u0BCD\u0B95\u0BC1\u0BAE\u0BCD.\n                        \u0B86\u0BA9\u0BBE\u0BB2\u0BCD, \u0B9F\u0BCB\u0BB2\u0BCD \u0B95\u0B9F\u0BCD\u0B9F\u0BA3\u0BAE\u0BCD, \u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BBF\u0B99\u0BCD \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0BAE\u0BBE\u0BA8\u0BBF\u0BB2 \u0BB5\u0BB0\u0BBF\n                        \u0B86\u0B95\u0BBF\u0BAF\u0BB5\u0BB1\u0BCD\u0BB1\u0BC8 \u0BB5\u0BBE\u0B9F\u0BBF\u0B95\u0BCD\u0B95\u0BC8\u0BAF\u0BBE\u0BB3\u0BB0\u0BCD\u0B95\u0BB3\u0BCD \u0B9A\u0BC6\u0BB2\u0BC1\u0BA4\u0BCD\u0BA4 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD.\n</p> </div> </details> <!-- FAQ Item 4 --> <details class="group bg-white rounded-lg shadow-sm"> <summary class="flex justify-between items-center font-medium cursor-pointer list-none p-6"> <span class="text-gray-900 font-semibold lang-en">Do you offer airport pickup and drop services?</span> <span class="text-gray-900 font-semibold lang-ta">\u0BB5\u0BBF\u0BAE\u0BBE\u0BA9 \u0BA8\u0BBF\u0BB2\u0BC8\u0BAF \u0BAA\u0BBF\u0B95\u0BCD\u0B95\u0BAA\u0BCD \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0B9F\u0BBF\u0BB0\u0BBE\u0BAA\u0BCD \u0B9A\u0BC7\u0BB5\u0BC8\u0B95\u0BB3\u0BCD \u0B89\u0BB3\u0BCD\u0BB3\u0BA4\u0BBE?</span> <span class="transition group-open:rotate-180"> <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg> </span> </summary> <div class="text-gray-600 px-6 pb-6"> <p class="lang-en">\nYes, we provide 24/7 reliable airport taxi services for\n                        Chennai International Airport (MAA). Pre-book your ride\n                        to ensure on-time pickup or drop-off.\n</p> <p class="lang-ta">\n\u0B86\u0BAE\u0BCD, \u0B9A\u0BC6\u0BA9\u0BCD\u0BA9\u0BC8 \u0B9A\u0BB0\u0BCD\u0BB5\u0BA4\u0BC7\u0B9A \u0BB5\u0BBF\u0BAE\u0BBE\u0BA9 \u0BA8\u0BBF\u0BB2\u0BC8\u0BAF\u0BA4\u0BCD\u0BA4\u0BBF\u0BB1\u0BCD\u0B95\u0BC1 24/7 \u0B9F\u0BBE\u0B95\u0BCD\u0BB8\u0BBF\n                        \u0B9A\u0BC7\u0BB5\u0BC8\u0B95\u0BB3\u0BC8 \u0BB5\u0BB4\u0B99\u0BCD\u0B95\u0BC1\u0B95\u0BBF\u0BB1\u0BCB\u0BAE\u0BCD.\n</p> </div> </details> <!-- FAQ Item 5 --> <details class="group bg-white rounded-lg shadow-sm"> <summary class="flex justify-between items-center font-medium cursor-pointer list-none p-6"> <span class="text-gray-900 font-semibold lang-en">Can I book a cab for local Chennai sightseeing?</span> <span class="text-gray-900 font-semibold lang-ta">\u0B9A\u0BC6\u0BA9\u0BCD\u0BA9\u0BC8 \u0B89\u0BB3\u0BCD\u0BB3\u0BC2\u0BB0\u0BCD \u0B9A\u0BC1\u0BB1\u0BCD\u0BB1\u0BC1\u0BB2\u0BBE\u0BB5\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0B9F\u0BBE\u0B95\u0BCD\u0BB8\u0BBF \u0BAE\u0BC1\u0BA9\u0BCD\u0BAA\u0BA4\u0BBF\u0BB5\u0BC1\n                        \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF\u0BB2\u0BBE\u0BAE\u0BBE?</span> <span class="transition group-open:rotate-180"> <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg> </span> </summary> <div class="text-gray-600 px-6 pb-6"> <p class="lang-en">\nAbsolutely! We offer 8hrs/80km and 12hrs/120km packages\n                        for local city tours, shopping, and beach visits within\n                        Chennai.\n</p> <p class="lang-ta">\n\u0BA8\u0BBF\u0B9A\u0BCD\u0B9A\u0BAF\u0BAE\u0BBE\u0B95! \u0B9A\u0BC6\u0BA9\u0BCD\u0BA9\u0BC8 \u0BA8\u0B95\u0BB0 \u0B9A\u0BC1\u0BB1\u0BCD\u0BB1\u0BC1\u0BB2\u0BBE \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0BB7\u0BBE\u0BAA\u0BCD\u0BAA\u0BBF\u0B99\u0BCD\u0B95\u0BBF\u0BB1\u0BCD\u0B95\u0BC1 8\n                        \u0BAE\u0BA3\u0BBF\u0BA8\u0BC7\u0BB0\u0BAE\u0BCD/80\u0B95\u0BBF\u0BAE\u0BC0 \u0BAA\u0BC7\u0B95\u0BCD\u0B95\u0BC7\u0B9C\u0BC1\u0B95\u0BB3\u0BC8 \u0BB5\u0BB4\u0B99\u0BCD\u0B95\u0BC1\u0B95\u0BBF\u0BB1\u0BCB\u0BAE\u0BCD.\n</p> </div> </details> <!-- FAQ Item 6 --> <details class="group bg-white rounded-lg shadow-sm"> <summary class="flex justify-between items-center font-medium cursor-pointer list-none p-6"> <span class="text-gray-900 font-semibold lang-en">Is it safe for night travel?</span> <span class="text-gray-900 font-semibold lang-ta">\u0B87\u0BB0\u0BB5\u0BC1 \u0BAA\u0BAF\u0BA3\u0BAE\u0BCD \u0BAA\u0BBE\u0BA4\u0BC1\u0B95\u0BBE\u0BAA\u0BCD\u0BAA\u0BBE\u0BA9\u0BA4\u0BBE?</span> <span class="transition group-open:rotate-180"> <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg> </span> </summary> <div class="text-gray-600 px-6 pb-6"> <p class="lang-en">\nYes, safety is our priority. All our drivers are\n                        background-verified and experienced in night driving. We\n                        also track our vehicles for added security.\n</p> <p class="lang-ta">\n\u0B86\u0BAE\u0BCD, \u0BAA\u0BBE\u0BA4\u0BC1\u0B95\u0BBE\u0BAA\u0BCD\u0BAA\u0BC1 \u0B8E\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BAE\u0BC1\u0BA9\u0BCD\u0BA9\u0BC1\u0BB0\u0BBF\u0BAE\u0BC8. \u0B8E\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BCD\u0B95\u0BB3\u0BCD\n                        \u0B85\u0BA9\u0BC8\u0BB5\u0BB0\u0BC1\u0BAE\u0BCD \u0B9A\u0BB0\u0BBF\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BB5\u0BB0\u0BCD\u0B95\u0BB3\u0BCD \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0B87\u0BB0\u0BB5\u0BC1 \u0BAA\u0BAF\u0BA3\u0B99\u0BCD\u0B95\u0BB3\u0BBF\u0BB2\u0BCD\n                        \u0B85\u0BA9\u0BC1\u0BAA\u0BB5\u0BAE\u0BCD \u0BB5\u0BBE\u0BAF\u0BCD\u0BA8\u0BCD\u0BA4\u0BB5\u0BB0\u0BCD\u0B95\u0BB3\u0BCD.\n</p> </div> </details> <!-- FAQ Item 7 --> <details class="group bg-white rounded-lg shadow-sm"> <summary class="flex justify-between items-center font-medium cursor-pointer list-none p-6"> <span class="text-gray-900 font-semibold lang-en">How do I pay for the ride?</span> <span class="text-gray-900 font-semibold lang-ta">\u0B95\u0B9F\u0BCD\u0B9F\u0BA3\u0BAE\u0BCD \u0B8E\u0BAA\u0BCD\u0BAA\u0B9F\u0BBF \u0B9A\u0BC6\u0BB2\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0BB5\u0BA4\u0BC1?</span> <span class="transition group-open:rotate-180"> <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg> </span> </summary> <div class="text-gray-600 px-6 pb-6"> <p class="lang-en">\nYou can pay via cash, Google Pay, PhonePe, or bank\n                        transfer directly to the driver or owner after the trip\n                        completion.\n</p> <p class="lang-ta">\n\u0BAA\u0BAF\u0BA3\u0BAE\u0BCD \u0BAE\u0BC1\u0B9F\u0BBF\u0BA8\u0BCD\u0BA4 \u0BAA\u0BBF\u0BB1\u0B95\u0BC1 \u0BB0\u0BCA\u0B95\u0BCD\u0B95\u0BAE\u0BCD, Google Pay \u0B85\u0BB2\u0BCD\u0BB2\u0BA4\u0BC1 PhonePe\n                        \u0BAE\u0BC2\u0BB2\u0BAE\u0BCD \u0B9A\u0BC6\u0BB2\u0BC1\u0BA4\u0BCD\u0BA4\u0BB2\u0BBE\u0BAE\u0BCD.\n</p> </div> </details> <!-- FAQ Item 8 --> <details class="group bg-white rounded-lg shadow-sm"> <summary class="flex justify-between items-center font-medium cursor-pointer list-none p-6"> <span class="text-gray-900 font-semibold lang-en">Do you offer corporate employee transportation?</span> <span class="text-gray-900 font-semibold lang-ta">\u0B95\u0BBE\u0BB0\u0BCD\u0BAA\u0BCD\u0BAA\u0BB0\u0BC7\u0B9F\u0BCD \u0B8A\u0BB4\u0BBF\u0BAF\u0BB0\u0BCD \u0BAA\u0BCB\u0B95\u0BCD\u0B95\u0BC1\u0BB5\u0BB0\u0BA4\u0BCD\u0BA4\u0BC1 \u0B9A\u0BC7\u0BB5\u0BC8 \u0B89\u0BB3\u0BCD\u0BB3\u0BA4\u0BBE?</span> <span class="transition group-open:rotate-180"> <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg> </span> </summary> <div class="text-gray-600 px-6 pb-6"> <p class="lang-en">\nYes, we specialize in corporate employee pickup and\n                        drops, as well as monthly cab services for companies in\n                        OMR, Guindy, and Siruseri IT parks.\n</p> <p class="lang-ta">\n\u0B86\u0BAE\u0BCD, \u0B95\u0BBE\u0BB0\u0BCD\u0BAA\u0BCD\u0BAA\u0BB0\u0BC7\u0B9F\u0BCD \u0BA8\u0BBF\u0BB1\u0BC1\u0BB5\u0BA9\u0B99\u0BCD\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0BAE\u0BBE\u0BA4\u0BBE\u0BA8\u0BCD\u0BA4\u0BBF\u0BB0 \u0BB5\u0BBE\u0B9F\u0B95\u0BC8\n                        \u0B85\u0B9F\u0BBF\u0BAA\u0BCD\u0BAA\u0B9F\u0BC8\u0BAF\u0BBF\u0BB2\u0BCD \u0B8A\u0BB4\u0BBF\u0BAF\u0BB0\u0BCD \u0BAA\u0BCB\u0B95\u0BCD\u0B95\u0BC1\u0BB5\u0BB0\u0BA4\u0BCD\u0BA4\u0BC1 \u0B9A\u0BC7\u0BB5\u0BC8\u0BAF\u0BC8 \u0BB5\u0BB4\u0B99\u0BCD\u0B95\u0BC1\u0B95\u0BBF\u0BB1\u0BCB\u0BAE\u0BCD.\n</p> </div> </details> <!-- FAQ Item 9 --> <details class="group bg-white rounded-lg shadow-sm"> <summary class="flex justify-between items-center font-medium cursor-pointer list-none p-6"> <span class="text-gray-900 font-semibold lang-en">Can I customize my tour package?</span> <span class="text-gray-900 font-semibold lang-ta">\u0B9A\u0BC1\u0BB1\u0BCD\u0BB1\u0BC1\u0BB2\u0BBE \u0BA4\u0BBF\u0B9F\u0BCD\u0B9F\u0BA4\u0BCD\u0BA4\u0BC8 \u0BAE\u0BBE\u0BB1\u0BCD\u0BB1\u0BBF\u0BAF\u0BAE\u0BC8\u0B95\u0BCD\u0B95 \u0BAE\u0BC1\u0B9F\u0BBF\u0BAF\u0BC1\u0BAE\u0BBE?</span> <span class="transition group-open:rotate-180"> <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg> </span> </summary> <div class="text-gray-600 px-6 pb-6"> <p class="lang-en">\nYes, all our temple tour and holiday packages are fully\n                        customizable. Tell us your preferred destinations, and\n                        we will plan the itinerary for you.\n</p> <p class="lang-ta">\n\u0B86\u0BAE\u0BCD, \u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BB5\u0BBF\u0BB0\u0BC1\u0BAA\u0BCD\u0BAA\u0BA4\u0BCD\u0BA4\u0BBF\u0BB1\u0BCD\u0B95\u0BC1 \u0B8F\u0BB1\u0BCD\u0BAA \u0B9A\u0BC1\u0BB1\u0BCD\u0BB1\u0BC1\u0BB2\u0BBE \u0B87\u0B9F\u0B99\u0BCD\u0B95\u0BB3\u0BC8\n                        \u0BAE\u0BBE\u0BB1\u0BCD\u0BB1\u0BBF\u0BAF\u0BAE\u0BC8\u0BA4\u0BCD\u0BA4\u0BC1\u0BA4\u0BCD \u0BA4\u0BB0\u0BC1\u0BB5\u0BCB\u0BAE\u0BCD.\n</p> </div> </details> <!-- FAQ Item 10 --> <details class="group bg-white rounded-lg shadow-sm"> <summary class="flex justify-between items-center font-medium cursor-pointer list-none p-6"> <span class="text-gray-900 font-semibold lang-en">How far in advance should I book?</span> <span class="text-gray-900 font-semibold lang-ta">\u0B8E\u0BB5\u0BCD\u0BB5\u0BB3\u0BB5\u0BC1 \u0BAE\u0BC1\u0BA9\u0BCD\u0BA9\u0BA4\u0BBE\u0B95 \u0BAE\u0BC1\u0BA9\u0BCD\u0BAA\u0BA4\u0BBF\u0BB5\u0BC1 \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD?</span> <span class="transition group-open:rotate-180"> <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg> </span> </summary> <div class="text-gray-600 px-6 pb-6"> <p class="lang-en">\nFor local trips, 4 hours notice is sufficient. For\n                        outstation and long temple tours, we recommend booking\n                        at least 24-48 hours in advance to secure the best\n                        vehicle.\n</p> <p class="lang-ta">\n\u0B89\u0BB3\u0BCD\u0BB3\u0BC2\u0BB0\u0BCD \u0BAA\u0BAF\u0BA3\u0B99\u0BCD\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1 4 \u0BAE\u0BA3\u0BBF\u0BA8\u0BC7\u0BB0\u0BAE\u0BCD \u0BAE\u0BC1\u0BA9\u0BCD\u0BA9\u0BA4\u0BBE\u0B95\u0BB5\u0BC1\u0BAE\u0BCD, \u0BB5\u0BC6\u0BB3\u0BBF\u0BAF\u0BC2\u0BB0\u0BCD\n                        \u0BAA\u0BAF\u0BA3\u0B99\u0BCD\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1 24-48 \u0BAE\u0BA3\u0BBF\u0BA8\u0BC7\u0BB0\u0BAE\u0BCD \u0BAE\u0BC1\u0BA9\u0BCD\u0BA9\u0BA4\u0BBE\u0B95\u0BB5\u0BC1\u0BAE\u0BCD \u0BAE\u0BC1\u0BA9\u0BCD\u0BAA\u0BA4\u0BBF\u0BB5\u0BC1\n                        \u0B9A\u0BC6\u0BAF\u0BCD\u0BB5\u0BA4\u0BC1 \u0B9A\u0BBF\u0BB1\u0BA8\u0BCD\u0BA4\u0BA4\u0BC1.\n</p> </div> </details> </div> </div> </section> <script type="application/ld+json">\n    {\n        "@context": "https://schema.org",\n        "@type": "FAQPage",\n        "mainEntity": [\n            {\n                "@type": "Question",\n                "name": "Do you offer one-way drops from Chennai to other cities?",\n                "acceptedAnswer": {\n                    "@type": "Answer",\n                    "text": "Yes, we provide affordable one-way drop taxi services from Chennai to major cities like Bangalore, Coimbatore, Trichy, and Madurai. You only pay for the one-way distance traveled."\n                }\n            },\n            {\n                "@type": "Question",\n                "name": "What vehicles are available for temple tour packages?",\n                "acceptedAnswer": {\n                    "@type": "Answer",\n                    "text": "We have a diverse fleet suitable for all group sizes, including Swift Dzire (4 pax), Toyota Etios (4 pax), Innova Crysta (6-7 pax), and Tempo Traveller (12+ pax) for larger family pilgrimages."\n                }\n            },\n            {\n                "@type": "Question",\n                "name": "Are driver batta and toll charges included?",\n                "acceptedAnswer": {\n                    "@type": "Answer",\n                    "text": "Our package estimates usually include driver batta. However, toll gate charges, parking fees, and interstate permit taxes are to be paid directly by the guest as per actuals."\n                }\n            },\n            {\n                "@type": "Question",\n                "name": "Do you offer airport pickup and drop services?",\n                "acceptedAnswer": {\n                    "@type": "Answer",\n                    "text": "Yes, we provide 24/7 reliable airport taxi services for Chennai International Airport (MAA)."\n                }\n            },\n            {\n                "@type": "Question",\n                "name": "Can I book a cab for local Chennai sightseeing?",\n                "acceptedAnswer": {\n                    "@type": "Answer",\n                    "text": "Absolutely! We offer 8hrs/80km and 12hrs/120km packages for local city tours, shopping, and beach visits within Chennai."\n                }\n            },\n            {\n                "@type": "Question",\n                "name": "Is it safe for night travel?",\n                "acceptedAnswer": {\n                    "@type": "Answer",\n                    "text": "Yes, safety is our priority. All our drivers are background-verified and experienced in night driving."\n                }\n            },\n            {\n                "@type": "Question",\n                "name": "How do I pay for the ride?",\n                "acceptedAnswer": {\n                    "@type": "Answer",\n                    "text": "You can pay via cash, Google Pay, PhonePe, or bank transfer directly to the driver or owner after the trip completion."\n                }\n            },\n            {\n                "@type": "Question",\n                "name": "Do you offer corporate employee transportation?",\n                "acceptedAnswer": {\n                    "@type": "Answer",\n                    "text": "Yes, we specialize in corporate employee pickup and drops, as well as monthly cab services for companies in OMR, Guindy, and Siruseri IT parks."\n                }\n            },\n            {\n                "@type": "Question",\n                "name": "Can I customize my tour package?",\n                "acceptedAnswer": {\n                    "@type": "Answer",\n                    "text": "Yes, all our temple tour and holiday packages are fully customizable."\n                }\n            },\n            {\n                "@type": "Question",\n                "name": "How far in advance should I book?",\n                "acceptedAnswer": {\n                    "@type": "Answer",\n                    "text": "For local trips, 4 hours notice is sufficient. For outstation and long temple tours, we recommend booking at least 24-48 hours in advance."\n                }\n            }\n        ]\n    }\n<\/script>'])), maybeRenderHead());
}, "D:/websites/kalidass-attempt-main/src/components/FAQ.astro", void 0);

const $$SafetySection = createComponent(($$result, $$props, $$slots) => {
  const safetyItems = [
    {
      title: "Travel Responsibility",
      description: "Important safety & responsible travel guidelines for passengers.",
      buttonText: "View Checklist",
      link: "#",
      modalId: "responsibility-modal",
      icon: "shield"
    },
    {
      title: "Official Govt. Resources",
      description: "Verified Tamil Nadu Government tourism & travel portals.",
      buttonText: "View",
      link: "#",
      modalId: "resources-modal",
      icon: "building"
    },
    {
      title: "Kaaval Uthavi App",
      description: "Get quick police assistance, SOS alerts, emergency location sharing.",
      buttonText: "Download App",
      link: "https://play.google.com/store/apps/details?id=com.amtexsystems.kaavaluthavi&hl=en_IN",
      icon: "siren"
    },
    {
      title: "Emergency Helpline",
      description: "Police: 100\nAmbulance: 108\nNational Emergency: 112\nWomen Helpline: 1091\nHighway Patrol: 103",
      buttonText: "Call Now",
      link: "tel:100",
      icon: "phone"
    }
  ];
  return renderTemplate`${maybeRenderHead()}<section class="py-10 md:py-16 bg-white"> <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"> <!-- Section Header --> <div class="text-center mb-12"> <h2 class="text-2xl md:text-4xl font-extrabold text-gray-900 inline-block relative mb-4">
Travel Awareness & Safety
<div class="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-red-600 rounded-full"></div> </h2> <p class="text-base text-gray-600 max-w-2xl mx-auto mt-4">
Your safety is our priority. Verified resources and emergency contacts.
</p> </div> <!-- Safety Grid --> <div class="grid grid-cols-2 gap-3 md:gap-6"> ${safetyItems.map((item) => renderTemplate`<div class="bg-white rounded-2xl p-4 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.1)] transition-all duration-300 text-center border border-gray-100 flex flex-col items-center h-full"> <!-- Icon --> <div class="mb-4"> ${item.icon === "shield" && renderTemplate`<svg class="w-10 h-10 md:w-12 md:h-12 text-blue-500" viewBox="0 0 24 24" fill="currentColor"> <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill-opacity="0.2"></path> <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#3B82F6"></path> </svg>`} ${item.icon === "building" && renderTemplate`<svg class="w-10 h-10 md:w-12 md:h-12 text-gray-500" viewBox="0 0 24 24" fill="currentColor"> <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="#6B7280"></path> <path d="M4 22h16v-2H4v2z" fill="#6B7280"></path> <path d="M12 2L2 7h20L12 2z" fill="#9CA3AF"></path> </svg>`} ${item.icon === "siren" && renderTemplate`<svg class="w-10 h-10 md:w-12 md:h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M12 3L4 7V13C4 17.4183 7.58172 21 12 21C16.4183 21 20 17.4183 20 13V7L12 3Z" fill="#FCA5A5" fill-opacity="0.2"></path> <path d="M12 22C16.9706 22 21 17.9706 21 13V7L12 3L3 7V13C3 17.9706 7.02944 22 12 22Z" stroke="#EF4444" stroke-width="0"></path> <path d="M12 6C13.6569 6 15 7.34315 15 9V14H9V9C9 7.34315 10.3431 6 12 6Z" fill="#EF4444"></path> <path d="M7 14H17V16H7V14Z" fill="#EF4444"></path> <path d="M12 2C12.5523 2 13 1.55228 13 1C13 0.447715 12.5523 0 12 0C11.4477 0 11 0.447715 11 1C11 1.55228 11.4477 2 12 2Z" fill="#F59E0B"></path> <path d="M16.2426 4.24264L17.6569 2.82843" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"></path> <path d="M7.75736 4.24264L6.34315 2.82843" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"></path> </svg>`} ${item.icon === "phone" && renderTemplate`<svg class="w-10 h-10 md:w-12 md:h-12 text-pink-500" viewBox="0 0 24 24" fill="currentColor"> <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.057 15.057 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.59 3.99C8.59 3.44 8.14 3 7.59 3H4.03C3.48 3 3 3.44 3 3.99 3 13.28 10.73 21 20.01 21c.55 0 .99-.45 .99-.99v-3.56c0-.55-.45-.99-.99-.99z" fill="#EC4899"></path> </svg>`} </div> <!-- Title --> <h3 class="text-base md:text-lg font-extrabold text-gray-900 mb-2 md:mb-3"> ${item.title} </h3> <!-- Description --> <div class="text-gray-600 text-xs md:text-sm mb-4 md:mb-6 flex-grow whitespace-pre-line leading-relaxed"> ${item.description} </div> <!-- Action Button --> ${item.modalId ? renderTemplate`<button${addAttribute(item.modalId, "data-modal-target")} class="inline-block bg-black text-white px-4 py-2 md:px-6 md:py-2 rounded-lg font-medium text-xs md:text-sm hover:bg-gray-800 transition-colors cursor-pointer"> ${item.buttonText} </button>` : renderTemplate`<a${addAttribute(item.link, "href")} class="inline-block bg-black text-white px-4 py-2 md:px-6 md:py-2 rounded-lg font-medium text-xs md:text-sm hover:bg-gray-800 transition-colors"> ${item.buttonText} </a>`} </div>`)} </div> <!-- Modals --> <!-- Responsibility Modal --> <div id="responsibility-modal" class="fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true"> <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"> <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" data-modal-close="responsibility-modal"></div> <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span> <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"> <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4"> <div class="sm:flex sm:items-start"> <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10"> <svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path> </svg> </div> <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full"> <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
Passenger Travel Responsibility
</h3> <div class="mt-4"> <ul class="space-y-3 text-sm text-gray-600"> <li class="flex items-start"> <span class="text-green-500 mr-2">✓</span> <span><strong>Respect the Vehicle:</strong> Please help us keep the car clean. Avoid littering or leaving trash behind.</span> </li> <li class="flex items-start"> <span class="text-green-500 mr-2">✓</span> <span><strong>No Smoking/Alcohol:</strong> Consumption of alcohol and smoking is strictly prohibited inside the vehicle.</span> </li> <li class="flex items-start"> <span class="text-green-500 mr-2">✓</span> <span><strong>Punctuality:</strong> Please adhere to the scheduled pickup and drop-off timings to ensure a smooth journey.</span> </li> <li class="flex items-start"> <span class="text-green-500 mr-2">✓</span> <span><strong>Safety First:</strong> Always wear seatbelts while the vehicle is in motion. It is for your own safety.</span> </li> <li class="flex items-start"> <span class="text-green-500 mr-2">✓</span> <span><strong>Driver Interaction:</strong> Treat our drivers with respect. They are trained professionals here to serve you.</span> </li> </ul> </div> </div> </div> </div> <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"> <button type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm" data-modal-close="responsibility-modal">
Understood
</button> </div> </div> </div> </div> <!-- Resources Modal --> <div id="resources-modal" class="fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true"> <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"> <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" data-modal-close="resources-modal"></div> <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span> <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"> <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4"> <div class="sm:flex sm:items-start"> <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10"> <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path> </svg> </div> <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full"> <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
Official Government Resources
</h3> <div class="mt-4"> <div class="grid gap-3"> <a href="https://www.tamilnadutourism.tn.gov.in/" target="_blank" rel="noopener noreferrer" class="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"> <img src="https://www.tamilnadutourism.tn.gov.in/img/logo.png" alt="TN Tourism" class="w-8 h-8 object-contain mr-3" onerror="this.style.display='none'"> <div> <div class="font-bold text-gray-900 text-sm">Tamil Nadu Tourism</div> <div class="text-xs text-gray-500">Official Tourism Website</div> </div> <i class="fas fa-external-link-alt ml-auto text-gray-400 text-xs"></i> </a> <a href="https://tourism.gov.in/" target="_blank" rel="noopener noreferrer" class="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"> <div class="w-8 h-8 flex items-center justify-center bg-orange-100 rounded-full mr-3 text-orange-600 font-bold text-xs">IN</div> <div> <div class="font-bold text-gray-900 text-sm">Ministry of Tourism</div> <div class="text-xs text-gray-500">Government of India</div> </div> <i class="fas fa-external-link-alt ml-auto text-gray-400 text-xs"></i> </a> <a href="https://www.ttdconline.com/" target="_blank" rel="noopener noreferrer" class="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"> <div class="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full mr-3 text-blue-600 font-bold text-xs">TTDC</div> <div> <div class="font-bold text-gray-900 text-sm">TTDC Online Booking</div> <div class="text-xs text-gray-500">Hotels & Tours</div> </div> <i class="fas fa-external-link-alt ml-auto text-gray-400 text-xs"></i> </a> <a href="https://hrce.tn.gov.in/" target="_blank" rel="noopener noreferrer" class="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"> <div class="w-8 h-8 flex items-center justify-center bg-yellow-100 rounded-full mr-3 text-yellow-600 font-bold text-xs">HRCE</div> <div> <div class="font-bold text-gray-900 text-sm">HRCE Department</div> <div class="text-xs text-gray-500">Temple Information</div> </div> <i class="fas fa-external-link-alt ml-auto text-gray-400 text-xs"></i> </a> </div> </div> </div> </div> </div> <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse"> <button type="button" class="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm" data-modal-close="resources-modal">
Close
</button> </div> </div> </div> </div> </div> </section> `;
}, "D:/websites/kalidass-attempt-main/src/components/SafetySection.astro", void 0);

const partners = [
  {
    name: "Airport Authority of India",
    logo: "/images/partners/airport-chennai.webp",
    alt: "Airport Authority of India - Official taxi partner for Chennai Airport pickup and drop"
  },
  {
    name: "L&T",
    logo: "/images/partners/landt.webp",
    alt: "Larsen & Toubro (L&T) Construction Chennai - Corporate employee transport partner"
  },
  {
    name: "Reliance Jio",
    logo: "/images/partners/jio.webp",
    alt: "Reliance Jio Infocomm - Monthly cab services for corporate staff in Chennai"
  },
  {
    name: "Savaari",
    logo: "/images/partners/Savaari.webp",
    alt: "Savaari Car Rentals - Trusted local taxi operator partner"
  },
  {
    name: "Saravn Enterprises",
    logo: "/images/partners/saravn.webp",
    alt: "Saravn Enterprises - Dedicated logistics and staff transport provider"
  },
  {
    name: "Cognizant",
    logo: "/images/partners/Cognizant.webp",
    alt: "Cognizant Technology Solutions - IT employee daily commute partner"
  },
  {
    name: "TN Police",
    logo: "/images/partners/tn-police.webp",
    alt: "Tamil Nadu Police - Trusted vehicle provider for official duties"
  },
  {
    name: "Mahindra Logistics",
    logo: "/images/partners/MAHINDRA_LOGISTICS_LOGO.jpg",
    alt: "Mahindra Logistics - Official transport partner"
  },
  {
    name: "Kaleesuwari",
    logo: "/images/partners/kaleesuwari.png",
    alt: "Kaleesuwari Refinery Private Limited - Trusted corporate partner"
  }
];
const PartnersCarousel = ({ currentLang }) => {
  const isSSR = !!currentLang;
  const contextLang = useLanguage();
  const lang = isSSR ? currentLang : contextLang;
  const scrollingPartners = [...partners, ...partners];
  return /* @__PURE__ */ jsxs("section", { className: "py-10 md:py-16 bg-gray-50 overflow-hidden border-t border-gray-200", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 mb-12 text-center", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-2xl md:text-4xl font-extrabold text-gray-900 inline-block relative mb-4", children: [
        lang === "ta" ? "தொழில்துறை தலைவர்களால் நம்பப்படுகிறது" : "Trusted By Industry Leaders",
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-red-600 rounded-full" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-base text-gray-600 max-w-2xl mx-auto mt-4", children: lang === "ta" ? "இந்த மதிப்புமிக்க நிறுவனங்களுக்கு சேவை செய்வதில் பெருமை கொள்கிறோம்" : "Proud to serve these esteemed organizations" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "flex w-max animate-scroll items-center gap-6 pb-8",
          role: "region",
          "aria-label": "Partner Logos",
          children: scrollingPartners.map((partner, index) => /* @__PURE__ */ jsx(
            "div",
            {
              className: "flex-shrink-0 mx-4 md:mx-8",
              "aria-hidden": index >= partners.length ? "true" : "false",
              children: /* @__PURE__ */ jsx("div", { className: "w-44 h-24 md:w-56 md:h-32 flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100 p-4", children: partner.logo ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: partner.logo,
                  alt: index >= partners.length ? "" : partner.alt || partner.name,
                  className: "object-contain w-full h-full transition-all duration-500 transform hover:scale-110",
                  loading: "lazy"
                }
              ) : /* @__PURE__ */ jsx("span", { className: "font-bold text-gray-400 text-lg", children: partner.name }) })
            },
            index
          ))
        }
      )
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); } 
          }
          .animate-scroll {
            animation: scroll 30s linear infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-scroll {
              animation: scroll 60s linear infinite;
            }
          }
      ` })
  ] });
};

const DriverCard = ({ driver, lang }) => {
  const isTa = lang === "ta";
  return /* @__PURE__ */ jsxs("div", { className: "flex-none w-72 snap-center bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all duration-300 group", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative mb-4 overflow-hidden rounded-xl", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: driver.image,
          className: "w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-500",
          alt: isTa ? driver.name_ta || driver.name : driver.name,
          loading: "lazy"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "absolute top-2 left-2 flex flex-col gap-1.5", children: /* @__PURE__ */ jsx("span", { className: "bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm w-fit", children: isTa ? driver.tag_ta || driver.tag : driver.tag }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg text-slate-900", children: isTa ? driver.name_ta || driver.name : driver.name }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-100", children: [
        /* @__PURE__ */ jsx(Star, { className: "w-3.5 h-3.5 text-amber-500 fill-current" }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-700", children: driver.rating })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5 mt-1 mb-2 px-2 py-0.5 bg-green-50 border border-green-100 rounded-md text-[10px] font-bold text-green-700", children: [
      /* @__PURE__ */ jsx(ShieldCheck, { className: "w-3 h-3" }),
      "PVC Verified"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-sm text-slate-600 mt-1 space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-slate-500", "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("span", { children: isTa ? driver.experience_ta || driver.experience : driver.experience })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Languages, { className: "w-4 h-4 text-slate-500", "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("span", { children: isTa ? driver.languages_ta || driver.languages : driver.languages })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 pt-3 border-t border-slate-100", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 italic", children: isTa ? `${driver.name_ta || driver.name} ${driver.experience_ta || driver.experience} அனுபவம் கொண்டவர், ${driver.languages_ta || driver.languages} மொழிகளை சரளமாக பேசக்கூடியவர்.` : `${driver.name} has ${driver.experience} and is fluent in ${driver.languages}.` }) })
  ] });
};
const DriversCarousel = ({ currentLang }) => {
  const drivers = siteContent.drivers;
  const isSSR = !!currentLang;
  const contextLang = useLanguage();
  const lang = isSSR ? currentLang : contextLang;
  const [visibleCount] = useState(drivers.length);
  const labels = siteContent.ui_labels;
  const heading = lang === "ta" ? labels.our_professional_drivers_ta : labels.our_professional_drivers;
  const visibleDrivers = drivers.slice(0, visibleCount);
  return /* @__PURE__ */ jsxs("section", { className: "py-20 bg-slate-50", "aria-labelledby": "drivers-heading", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
        /* @__PURE__ */ jsxs("h2", { id: "drivers-heading", className: "text-2xl md:text-4xl font-extrabold text-gray-900 inline-block relative mb-4", children: [
          heading,
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-red-600 rounded-full" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-base text-gray-600 max-w-2xl mx-auto mt-4", children: lang === "ta" ? "அனுபவம் வாய்ந்த, சரிபார்க்கப்பட்ட மற்றும் பன்மொழி பேசும் ஓட்டுநர்கள் உங்கள் சேவையில்." : "Experienced, verified, and multilingual drivers at your service." })
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "flex overflow-x-auto gap-6 pb-8 snap-x scrollbar-hide focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl",
          tabIndex: 0,
          role: "region",
          "aria-label": "Drivers List",
          children: visibleDrivers.map((driver, index) => /* @__PURE__ */ jsx(DriverCard, { driver, lang }, index))
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "text-center mt-6", children: /* @__PURE__ */ jsxs(
        "a",
        {
          href: "/drivers",
          className: "inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg px-2",
          children: [
            lang === "ta" ? "அனைத்து ஓட்டுநர்களையும் காண்க" : "View All Drivers",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200", "aria-hidden": "true" })
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx("style", { jsx: true, children: `
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      ` })
  ] });
};

const ReviewsCarousel = ({ currentLang }) => {
  const reviews = siteContent.reviews.slice(0, 5);
  return /* @__PURE__ */ jsxs("section", { id: "reviews", className: "py-10 md:py-16 bg-gray-50", children: [
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl md:text-4xl font-extrabold text-gray-900 inline-block relative mb-3", children: [
          "Client Reviews",
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-16 h-1 bg-red-600 rounded-full" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-base text-gray-600 max-w-2xl mx-auto mt-2", children: [
          /* @__PURE__ */ jsx("span", { className: "lang-en", children: "Hear from our happy customers about their journey with us." }),
          /* @__PURE__ */ jsx("span", { className: "lang-ta", children: "எங்கள் வாடிக்கையாளர்களின் கருத்துக்களைப் பாருங்கள்." })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "flex overflow-x-auto gap-4 pb-6 scrollbar-hide snap-x focus:outline-none focus:ring-2 focus:ring-red-500 rounded-xl",
          tabIndex: 0,
          role: "region",
          "aria-label": "Client Reviews",
          children: reviews.map((review, index) => /* @__PURE__ */ jsx("div", { className: "flex-none w-64 sm:w-80 bg-white p-6 rounded-xl shadow-sm border border-gray-100 snap-center flex flex-col justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm", "aria-hidden": "true", children: review.name.charAt(0) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-gray-900 leading-none", children: review.name }),
                  /* @__PURE__ */ jsx("div", { className: "flex text-yellow-400 text-[10px] mt-1 space-x-0.5", "aria-label": "Rated 5 out of 5 stars", role: "img", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsx("i", { className: "fas fa-star", "aria-hidden": "true" }, i)) })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-blue-500 opacity-20", children: /* @__PURE__ */ jsx("i", { className: "fab fa-google text-xl", "aria-hidden": "true" }) })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 italic leading-relaxed", children: [
              '"',
              review.quote,
              '"'
            ] })
          ] }) }, index))
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "text-center mt-6", children: /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://maps.app.goo.gl/i2LdJhWMi2ZgAiCa8",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "inline-flex items-center text-blue-600 font-bold text-sm hover:text-blue-700 transition",
          "aria-label": "See More Reviews on Google (opens in a new tab)",
          children: [
            "See More Reviews on Google ",
            /* @__PURE__ */ jsx("i", { className: "fas fa-arrow-right ml-2", "aria-hidden": "true" })
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
      ` })
  ] });
};

const trips = [
	{
		id: 1,
		title: "Tirupati Balaji Darshan",
		type: "Temple",
		image: "https://images.unsplash.com/photo-1563116668-3c3228775f9f?q=80&w=600",
		kmOneWay: 160,
		duration: "2 Days",
		desc: "Complete darshan package with accommodation assistance."
	},
	{
		id: 2,
		title: "Kodaikanal Hills",
		type: "Mountain",
		image: "https://images.unsplash.com/photo-1596700414605-e45f1b1c7c9a?q=80&w=600",
		kmOneWay: 530,
		duration: "3 Days",
		desc: "Princess of Hills. Boating, Pine Forest, and misty views."
	},
	{
		id: 3,
		title: "Munnar Tea Gardens",
		type: "Mountain",
		image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=600",
		kmOneWay: 580,
		duration: "3 Days",
		desc: "Lush tea plantations, waterfalls, and breathtaking valley views."
	},
	{
		id: 4,
		title: "Rameshwaram Dham",
		type: "Temple",
		image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=600",
		kmOneWay: 575,
		duration: "2 Days",
		desc: "Sacred pilgrimage to one of the Char Dham. Temple and beach visit."
	}
];

const TariffCalculator = ({ currentLang }) => {
  useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);
  const [costs, setCosts] = useState({ etios: 0, innova: 0, bata: 0, totalKm: 0 });
  const modalRef = React.useRef(null);
  useEffect(() => {
    const handleOpen = (event) => {
      const tripData = event.detail;
      const tripId = parseInt(tripData.id);
      const foundTrip = trips.find((t) => t.id === tripId);
      if (foundTrip) {
        const totalKm = foundTrip.kmOneWay * 2;
        const durationDays = parseInt(foundTrip.duration);
        const driverBata = 300 * durationDays;
        const etiosCost = totalKm * 13 + driverBata;
        const innovaCost = totalKm * 18 + driverBata;
        setActiveTrip(foundTrip);
        setCosts({
          etios: etiosCost,
          innova: innovaCost,
          bata: driverBata,
          totalKm
        });
        setIsOpen(true);
        document.body.style.overflow = "hidden";
        trackEvent("tariff_calculator_opened", {
          destination: foundTrip.title,
          duration: foundTrip.duration
        });
      }
    };
    document.addEventListener("open-calculator", handleOpen);
    return () => {
      document.removeEventListener("open-calculator", handleOpen);
    };
  }, []);
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => modalRef.current?.focus(), 50);
      const handleKeyDown = (e) => {
        if (e.key === "Escape") closeModal();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);
  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = "";
    setActiveTrip(null);
  };
  const handleWhatsApp = () => {
    if (!activeTrip) return;
    trackEvent("tariff_calculator_whatsapp", {
      destination: activeTrip.title,
      costs
    });
    const message = encodeURIComponent(
      `Hi! I'm interested in the ${activeTrip.title} package.

Estimated Costs:
Etios: ₹${costs.etios.toLocaleString("en-IN")}
Innova: ₹${costs.innova.toLocaleString("en-IN")}

Please confirm the final pricing and availability.`
    );
    window.open(`https://wa.me/919952749408?text=${message}`, "_blank");
  };
  if (!isOpen || !activeTrip) return null;
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
        onClick: closeModal,
        "aria-hidden": "true"
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        ref: modalRef,
        className: "relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up outline-none",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "modal-title",
        tabIndex: -1,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("h3", { id: "modal-title", className: "text-2xl font-bold", children: "Trip Calculator" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: closeModal,
                  className: "text-white hover:text-gray-200 transition focus:outline-none focus:ring-2 focus:ring-white rounded p-1",
                  "aria-label": "Close Calculator",
                  children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }) })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-blue-100 mt-2", children: [
              "Estimated pricing for ",
              activeTrip.title
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-xl p-5", children: [
              /* @__PURE__ */ jsx("h4", { className: "font-semibold text-gray-900 mb-3", children: "Trip Details" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-gray-600 block", children: "One Way Distance" }),
                  /* @__PURE__ */ jsxs("p", { className: "font-semibold text-gray-900", children: [
                    activeTrip.kmOneWay,
                    " km"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-gray-600 block", children: "Total Distance" }),
                  /* @__PURE__ */ jsxs("p", { className: "font-semibold text-gray-900", children: [
                    costs.totalKm,
                    " km"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-gray-600 block", children: "Duration" }),
                  /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900", children: activeTrip.duration })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-gray-600 block", children: "Driver Bata (Included)" }),
                  /* @__PURE__ */ jsxs("p", { className: "font-semibold text-gray-900", children: [
                    "₹",
                    costs.bata
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "border-2 border-blue-200 rounded-xl p-5 hover:border-blue-400 transition", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                  /* @__PURE__ */ jsx("h4", { className: "font-bold text-lg text-gray-900", children: "Toyota Etios" }),
                  /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-blue-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm text-gray-600 mb-4", children: [
                  /* @__PURE__ */ jsx("p", { children: "• Comfortable Sedan" }),
                  /* @__PURE__ */ jsx("p", { children: "• 4 Passengers + Driver" }),
                  /* @__PURE__ */ jsx("p", { children: "• Rate: ₹13/km" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 rounded-lg p-3", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm mb-1", children: "Estimated Cost" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-blue-600", children: [
                    "₹",
                    costs.etios.toLocaleString("en-IN")
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "border-2 border-green-200 rounded-xl p-5 hover:border-green-400 transition", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                  /* @__PURE__ */ jsx("h4", { className: "font-bold text-lg text-gray-900", children: "Toyota Innova" }),
                  /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm text-gray-600 mb-4", children: [
                  /* @__PURE__ */ jsx("p", { children: "• Premium SUV" }),
                  /* @__PURE__ */ jsx("p", { children: "• 6-7 Passengers + Driver" }),
                  /* @__PURE__ */ jsx("p", { children: "• Rate: ₹18/km" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-green-50 rounded-lg p-3", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-sm mb-1", children: "Estimated Cost" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-green-600", children: [
                    "₹",
                    costs.innova.toLocaleString("en-IN")
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-xl p-4", children: [
              /* @__PURE__ */ jsxs("h4", { className: "font-semibold text-yellow-900 mb-2 flex items-center", children: [
                /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }),
                "Important Notes"
              ] }),
              /* @__PURE__ */ jsxs("ul", { className: "text-sm text-yellow-800 space-y-1", children: [
                /* @__PURE__ */ jsx("li", { children: "• Prices are indicative and may vary based on season" }),
                /* @__PURE__ */ jsx("li", { children: "• Driver allowance (Bata) is included" }),
                /* @__PURE__ */ jsx("li", { children: "• Toll charges and parking fees are additional" }),
                /* @__PURE__ */ jsx("li", { children: "• Final pricing will be confirmed via WhatsApp" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleWhatsApp,
                  className: "flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                  children: [
                    /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 mr-2", fill: "currentColor", viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" }) }),
                    "Confirm via WhatsApp"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: closeModal,
                  className: "flex-1 bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
                  children: "Close"
                }
              )
            ] })
          ] })
        ]
      }
    )
  ] });
};

export { $$Hero as $, DriversCarousel as D, FleetRoll as F, PartnersCarousel as P, ReviewsCarousel as R, TariffCalculator as T, $$BookingPanel as a, $$Services as b, $$Tours as c, $$FAQ as d, $$SafetySection as e };
