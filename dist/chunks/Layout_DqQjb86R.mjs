import { d as createAstro, c as createComponent, a as renderTemplate, f as renderSlot, b as addAttribute, r as renderComponent, g as renderHead, u as unescapeHTML } from './astro/server_B-UY_wom.mjs';
import 'kleur/colors';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
/* empty css                              */

const hero = {
	images: [
		"/images/hero/airavatesvara.webp",
		"/images/hero/coimbatore.webp",
		"/images/hero/madurai.jpg"
	]};
const ui_labels = {
	book_your_ride: "Book your Ride",
	book_your_ride_ta: "உங்கள் பயணத்தை முன்பதிவு செய்யுங்கள்",
	our_premium_fleet: "Our Premium Fleet",
	our_premium_fleet_ta: "எங்கள் பிரீமியம் வாகனங்கள்",
	our_professional_drivers: "Our Professional Drivers",
	our_professional_drivers_ta: "எங்கள் தொழில்முறை ஓட்டுநர்கள்"};
const services = [
	{
		title: "Acting Drivers",
		description: "Your car, Our Professional Pilot",
		icon: "user-tie",
		image: "/images/services/acting-drivers.jpg",
		link: "/services/category/acting-drivers",
		title_ta: "ஆக்டிங் டிரைவர்கள்",
		description_ta: "உங்கள் கார், எங்கள் தொழில்முறை பைலட்"
	},
	{
		title: "Corporate",
		description: "The complete corporate mobility suite",
		icon: "building",
		image: "/images/services/corporate.jpg",
		link: "/services/category/corporate",
		title_ta: "கார்ப்பரேட்",
		description_ta: "முழுமையான கார்ப்பரேட் மொபிலிட்டி சூட்"
	},
	{
		title: "Temple Tours",
		description: "Round trips for Tirupati, Navagraha, and heritage temple circuits with local expertise.",
		icon: "gopuram",
		image: "/images/services/temple-tours.jpg",
		link: "/services/category/temple-tours",
		title_ta: "கோவில் சுற்றுலா",
		description_ta: "Round trips for திருப்பதி, நவகிரக, and heritage temple circuits with local expertise."
	},
	{
		title: "Popular Destinations",
		description: "Explore heritage sites, beaches, and city tours.",
		icon: "map-pin",
		image: "/images/temple/Mahabalipuram-ECR-Temples.jpg",
		link: "/services/category/popular-destinations",
		title_ta: "பிரபலமான இடங்கள்",
		description_ta: "Explore heritage sites, beaches, and city tours."
	}
];
const fleet = [
	{
		name: "Swift Dzire",
		image: "/images/fleet/swift-dzire.webp",
		caps: "4 Passenger + Driver",
		bags: "2 Bags",
		rate: "₹11/km",
		details: [
			"Best for City rides and Small family",
			"AC and Entertainment",
			"Daily/Outstation",
			"Sanitized Every Trip"
		],
		name_ta: "Swift Dzire",
		caps_ta: "4 பயணிகள் + ஓட்டுநர்",
		bags_ta: "2 மூட்டைகள்",
		rate_ta: "₹11/km",
		alt: "Maruti Swift Dzire 4-seater AC taxi for family trips and outstation travel from Chennai"
	},
	{
		name: "Toyota Etios",
		image: "/images/fleet/toyoto-etios.webp",
		caps: "4 Passenger + Driver",
		bags: "2 Bags",
		rate: "₹12/km",
		details: [
			"Executive Sedan for Client Visits & Site Meetings",
			"Best for Small family and city rides",
			"AC and Entertainment",
			"Corporate Travels",
			"Sanitized Every Trip"
		],
		name_ta: "Toyota Etios",
		caps_ta: "4 பயணிகள் + ஓட்டுநர்",
		bags_ta: "2 மூட்டைகள்",
		rate_ta: "₹12/km",
		alt: "Toyota Etios executive sedan taxi for corporate client visits and comfortable outstation travel"
	},
	{
		name: "Innova",
		image: "/images/fleet/suv.webp",
		caps: "7 Passenger + Driver",
		bags: "4 Bags",
		rate: "₹15/km",
		details: [
			"Executive Sedan for Client Visits & Site Meetings",
			"Best for Large family and Outstation",
			"AC and Entertainment",
			"Spacious",
			"Sanitized Every Trip",
			"Max weight capacity: 350kg"
		],
		name_ta: "இன்னோவா",
		caps_ta: "7 பயணிகள் + ஓட்டுநர்",
		bags_ta: "4 மூட்டைகள்",
		rate_ta: "₹15/km",
		alt: "Toyota Innova 7-seater SUV taxi for large families and long-distance pilgrimages"
	},
	{
		name: "Mahindra Bolero",
		image: "/images/fleet/mahindra-bolero.webp",
		caps: "7 Passenger + Driver",
		bags: "3 Bags",
		rate: "₹15/km",
		details: [
			"Best for Large family and Outstation",
			"AC and Entertainment",
			"Best for Mountain ride and long trip",
			"Sanitized Every Trip",
			"Rugged"
		],
		name_ta: "Mahindra Bolero",
		caps_ta: "7 பயணிகள் + ஓட்டுநர்",
		bags_ta: "3 மூட்டைகள்",
		rate_ta: "₹15/km",
		alt: "Mahindra Bolero rugged SUV rental for hill station trips and rough terrain travel"
	},
	{
		name: "Tata Sumo",
		image: "/images/fleet/Tata-Sumo.webp",
		caps: "7 Passenger + Driver",
		bags: "3 Bags",
		rate: "₹16/km",
		details: [
			"Best for Large family and outstation",
			"AC and Entertainment",
			"Spacious",
			"Best for Mountain ride and long trip",
			"Sanitized Every Trip"
		],
		name_ta: "Tata Sumo",
		caps_ta: "7 பயணிகள் + ஓட்டுநர்",
		bags_ta: "3 மூட்டைகள்",
		rate_ta: "₹16/km",
		alt: "Tata Sumo spacious 7-seater taxi for group travel and economical outstation trips"
	},
	{
		name: "Tempo Traveller",
		image: "/images/fleet/tempo.webp",
		caps: "12 Passenger + Driver",
		bags: "8 Bags",
		rate: "₹21/km",
		details: [
			"Perfect for Corporate Team Outings & Offsites",
			"Best for Group trips and hill stations",
			"Push back seats",
			"Sanitized coach"
		],
		name_ta: "டெம்போ டிராவலர்",
		caps_ta: "12 பயணிகள் + ஓட்டுநர்",
		bags_ta: "8 மூட்டைகள்",
		rate_ta: "₹21/km",
		alt: "12-seater Tempo Traveller van rental for corporate team outings and family pilgrimage groups"
	}
];
const drivers = [
	{
		name: "Perumal Manikumar",
		experience: "12 Years Experience",
		trips: "450+",
		rating: "4.9",
		reviews: "412",
		specialty: "Luxury & VVIP Handling",
		languages: "Tamil, English, Hindi",
		tag: "Owner",
		image: "/images/drivers/mani-perumal.webp",
		name_ta: "Perumal Manikumar",
		experience_ta: "12 Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Owner",
		alt: "Perumal Manikumar - Owner and VVIP luxury car driver in Chennai",
		crossing_border: true
	},
	{
		name: "Perumal Karthik Kumar",
		experience: "10 Years Experience",
		trips: "380+",
		rating: "4.9",
		reviews: "320",
		specialty: "Corporate Fleet Manager",
		languages: "Tamil, English, Hindi",
		tag: "Managing Partner",
		image: "/images/drivers/Perumal Karthik Kumar.webp",
		name_ta: "Perumal Karthik Kumar",
		experience_ta: "10 Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Managing Partner",
		alt: "Perumal Karthik Kumar - Corporate fleet manager and managing partner"
	},
	{
		name: "Hariharan",
		experience: "2 Year Experience",
		trips: "120+",
		rating: "4.7",
		reviews: "45",
		specialty: "City & Airport Drops",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/Hari.webp",
		name_ta: "Hariharan",
		experience_ta: "2 Year Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Hariharan - Expert driver for city and airport taxi drops in Chennai"
	},
	{
		name: "Raj",
		experience: "5 Years Experience",
		trips: "110+",
		rating: "4.6",
		reviews: "38",
		specialty: "Local Chennai Routes",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/Raj.webp",
		name_ta: "Raj",
		experience_ta: "5 Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Raj - Experienced driver for local Chennai taxi routes"
	},
	{
		name: "Munish",
		experience: "6+ Years Experience",
		trips: "180+",
		rating: "4.8",
		reviews: "110",
		specialty: "Safe Night Driving",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/munish.webp",
		name_ta: "Munish",
		experience_ta: "6+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Munish - Specialist driver for safe night driving and outstation trips"
	},
	{
		name: "Vishnu",
		experience: "8+ Years Experience",
		trips: "320+",
		rating: "4.8",
		reviews: "250",
		specialty: "Highway & Long Drive",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/Vishnu.webp",
		name_ta: "Vishnu",
		experience_ta: "8+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Vishnu - Long distance highway driving specialist driver"
	},
	{
		name: "Thangaraj",
		experience: "25+ Years Experience",
		trips: "1100+",
		rating: "4.9",
		reviews: "600+",
		specialty: "Hill Station Expert (Ooty/Kodai)",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/thangaraj.webp",
		name_ta: "Thangaraj",
		experience_ta: "25+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Thangaraj - Senior river with 25+ years experience in hill station driving"
	},
	{
		name: "Senthamil",
		experience: "20+ Years Experience",
		trips: "850+",
		rating: "4.9",
		reviews: "520",
		specialty: "Temple Tours (Navagraha)",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/senthamil.webp",
		name_ta: "Senthamil",
		experience_ta: "20+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Senthamil - Expert driver for Navagraha temple tours from Chennai"
	},
	{
		name: "Prakash",
		experience: "15+ Years Experience",
		trips: "620+",
		rating: "4.8",
		reviews: "380",
		specialty: "Kerala/Karnataka Routes",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/Prakash.webp",
		name_ta: "Prakash",
		experience_ta: "15+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Prakash - Experienced driver for interstate trips to Kerala and Karnataka"
	},
	{
		name: "Elumalai",
		experience: "21+ Years Experience",
		trips: "950+",
		rating: "4.9",
		reviews: "550",
		specialty: "Heavy Vehicle / Bus Expert",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/Elumalai.webp",
		name_ta: "Elumalai",
		experience_ta: "21+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Elumalai - Expert heavy vehicle and bus driver for group tours"
	},
	{
		name: "Venkateshan",
		experience: "15+ Years Experience",
		trips: "580+",
		rating: "4.7",
		reviews: "310",
		specialty: "Family Pilgrimage Trips",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/venkatesh.webp",
		name_ta: "Venkateshan",
		experience_ta: "15+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Venkateshan - Reliable driver for family pilgrimage trips"
	},
	{
		name: "Mani",
		experience: "10+ Years Experience",
		trips: "340+",
		rating: "4.8",
		reviews: "210",
		specialty: "Corporate Events",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/Mani.webp",
		name_ta: "Mani",
		experience_ta: "10+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Mani - Professional driver for corporate events and employee transport"
	},
	{
		name: "Neelakandan",
		experience: "18+ Years Experience",
		trips: "720+",
		rating: "4.9",
		reviews: "480",
		specialty: "Sabarimala Specialist",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/neelakandan.webp",
		name_ta: "Neelakandan",
		experience_ta: "18+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Neelakandan - Sabarimala pilgrimage specialist driver",
		crossing_border: true
	},
	{
		name: "Karthick",
		experience: "13+ Years Experience",
		trips: "490+",
		rating: "4.8",
		reviews: "340",
		specialty: "Valet & Luxury Cars",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/karthick.webp",
		name_ta: "Karthick",
		experience_ta: "13+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Karthick - Luxury car chauffeur and valet specialist"
	},
	{
		name: "Natraj",
		experience: "25+ Years Experience",
		trips: "1200+",
		rating: "5.0",
		reviews: "700+",
		specialty: "All Terrain Master",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/Natraj.webp",
		name_ta: "Natraj",
		experience_ta: "25+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Natraj - Master driver for all terrains with 25+ years experience"
	},
	{
		name: "Vijay",
		experience: "7+ Years Experience",
		trips: "280+",
		rating: "4.7",
		reviews: "180",
		specialty: "Pondicherry Weekend Trips",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/vijay.webp",
		name_ta: "Vijay",
		experience_ta: "7+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Vijay - Friendly driver for Pondicherry weekend taxi trips"
	},
	{
		name: "Murugan",
		experience: "20+ Years Experience",
		trips: "810+",
		rating: "4.9",
		reviews: "500",
		specialty: "Tirupati Darshan Guide",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/Murugan.webp",
		name_ta: "Murugan",
		experience_ta: "20+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Murugan - Expert guide and driver for Tirupati Darshan taxi packages"
	},
	{
		name: "Vadivel",
		experience: "12+ Years Experience",
		trips: "450+",
		rating: "4.8",
		reviews: "290",
		specialty: "Customer Favorite",
		languages: "Tamil, English, Hindi",
		tag: "Driver",
		image: "/images/drivers/Vadivel.webp",
		name_ta: "Vadivel",
		experience_ta: "12+ Years Experience",
		languages_ta: "Tamil, English, Hindi",
		tag_ta: "Driver",
		alt: "Vadivel - Customer favorite driver for family and corporate trips"
	}
];
const reviews = [
	{
		name: "Rajesh K",
		quote: "Excellent service for our Tirupati trip. Driver Vadivel was very polite.",
		name_ta: "Rajesh K",
		quote_ta: "Excellent service for our திருப்பதி trip. Driver Vadivel was very polite."
	},
	{
		name: "Anita Roy",
		quote: "Clean Innova Crysta and punctual pickup. Transparent pricing.",
		name_ta: "Anita Roy",
		quote_ta: "Clean இன்னோவா கிறிஸ்டா and punctual pickup. Transparent pricing."
	},
	{
		name: "Suresh M",
		quote: "Very safe driving for my parents' trip to Kumbakonam.",
		name_ta: "Suresh M",
		quote_ta: "Very safe driving for my parents' trip to Kumbakonam."
	}
];
const siteContent = {
	hero: hero,
	ui_labels: ui_labels,
	services: services,
	fleet: fleet,
	drivers: drivers,
	reviews: reviews};

const LANGUAGE_EVENT = 'language-change';

function useLanguage(initialLang = 'en') {
    const [lang, setLang] = useState(initialLang);

    useEffect(() => {
        // Initialize from localStorage or body class
        const savedLang = localStorage.getItem('preferred-lang');
        if (savedLang) {
            setLang(savedLang);
        } else if (document.body.classList.contains('lang-ta')) {
            setLang('ta');
        }

        const handleLangChange = (e) => {
            setLang(e.detail);
        };

        window.addEventListener(LANGUAGE_EVENT, handleLangChange);
        return () => window.removeEventListener(LANGUAGE_EVENT, handleLangChange);
    }, []);

    return lang;
}

function setLanguage(lang) {
    const isTamil = lang === 'ta';

    if (isTamil) {
        document.body.classList.add('lang-ta');
    } else {
        document.body.classList.remove('lang-ta');
    }

    localStorage.setItem('preferred-lang', lang);

    // Dispatch custom event for React components
    window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: lang }));
}

const LanguageToggle = ({ isMobile, currentLang, targetUrl }) => {
  const isSSR = !!targetUrl;
  const lang = isSSR ? currentLang : useLanguage();
  const toggleLanguage = () => {
    if (isSSR) return;
    const newLang = lang === "en" ? "ta" : "en";
    setLanguage(newLang);
  };
  if (isMobile) {
    if (isSSR) {
      return /* @__PURE__ */ jsxs(
        "a",
        {
          href: targetUrl,
          className: "flex items-center gap-2 px-4 py-2.5 min-h-[48px] rounded-full border border-red-100 bg-red-50 text-red-700 active:bg-red-100 transition-colors shadow-sm no-underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
          "aria-label": `Switch to ${lang === "en" ? "Tamil" : "English"}`,
          children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold", children: lang === "en" ? "தமிழ்" : "ENG" }),
            /* @__PURE__ */ jsx("i", { className: "fa-solid fa-language text-red-500 text-base", "aria-hidden": "true" })
          ]
        }
      );
    }
    return /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: toggleLanguage,
        className: "flex items-center gap-2 px-4 py-2.5 min-h-[48px] rounded-full border border-red-100 bg-red-50 text-red-700 active:bg-red-100 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
        "aria-label": `Switch to ${lang === "en" ? "Tamil" : "English"}`,
        children: [
          /* @__PURE__ */ jsx("span", { className: `text-sm font-bold ${lang === "ta" ? "" : "hidden"}`, children: "தமிழ்" }),
          /* @__PURE__ */ jsx("span", { className: `text-sm font-bold ${lang === "en" ? "" : "hidden"}`, children: "ENG" }),
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-language text-red-500 text-base", "aria-hidden": "true" })
        ]
      }
    );
  }
  if (isSSR) {
    return /* @__PURE__ */ jsxs(
      "a",
      {
        href: targetUrl,
        className: "flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-red-600 transition-colors group no-underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
        "aria-label": `Switch to ${lang === "en" ? "Tamil" : "English"}`,
        children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-gray-700 group-hover:text-red-600", children: lang === "en" ? "தமிழ்" : "ENG" }),
          /* @__PURE__ */ jsx("i", { className: "fa-solid fa-language text-gray-400 group-hover:text-red-600", "aria-hidden": "true" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: toggleLanguage,
      className: "flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-red-600 transition-colors group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
      "aria-label": `Switch to ${lang === "en" ? "Tamil" : "English"}`,
      children: [
        /* @__PURE__ */ jsx("span", { className: `text-sm font-bold text-gray-700 group-hover:text-red-600 ${lang === "ta" ? "" : "hidden"}`, children: "தமிழ்" }),
        /* @__PURE__ */ jsx("span", { className: `text-sm font-bold text-gray-700 group-hover:text-red-600 ${lang === "en" ? "" : "hidden"}`, children: "ENG" }),
        /* @__PURE__ */ jsx("i", { className: "fa-solid fa-language text-gray-400 group-hover:text-red-600", "aria-hidden": "true" })
      ]
    }
  );
};

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://kalidasstravels.in");
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const {
    title = "Kalidass Travels - Premium Travel Experience",
    description = "Premium travel and cab services across South India. Professional drivers, comfortable vehicles, affordable rates.",
    image = "/images/logo.png",
    ogImage,
    type = "website",
    url = Astro2.url.href,
    schema,
    lang = "en"
  } = Astro2.props;
  const currentPath = Astro2.url.pathname.replace(/\/$/, "");
  const isTamil = lang === "ta";
  const services = siteContent.services.map((s) => ({
    ...s,
    link: isTamil ? `/ta${s.link}` : s.link
  }));
  const targetPath = isTamil ? currentPath.replace(/^\/ta/, "") || "/" : `/ta${currentPath === "/" ? "" : currentPath}`;
  const site = "https://kalidasstravels.in";
  const enPath = isTamil ? currentPath.replace(/^\/ta/, "") || "/" : currentPath === "" ? "/" : currentPath;
  const taPath = isTamil ? currentPath === "" ? "/ta" : currentPath : `/ta${currentPath === "/" ? "" : currentPath}`;
  const enHref = `${site}${enPath === "/" ? "" : enPath}`;
  const taHref = `${site}${taPath}`;
  const siteUrl = "https://kalidasstravels.in";
  const fullImage = ogImage ? ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}` : image.startsWith("http") ? image : `${siteUrl}${image}`;
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "TaxiService",
    name: "Kalidass Travels",
    image: ["https://kalidasstravels.in/images/logo.png"],
    description,
    telephone: "+919092303060",
    email: "bookings@kalidasstravels.in",
    url: "https://kalidasstravels.in",
    address: {
      "@type": "PostalAddress",
      streetAddress: "No. 4/220, E88, Ponniamman Kovil Street, Annamalai Nagar, Medavakkam",
      addressLocality: "Chennai",
      postalCode: "600100",
      addressRegion: "Tamil Nadu",
      addressCountry: "IN"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "12.926442514836141",
      longitude: "80.18460027205512"
    },
    areaServed: [
      {
        "@type": "City",
        name: "Chennai"
      },
      {
        "@type": "AdministrativeArea",
        name: "Tamil Nadu"
      }
    ],
    priceRange: "\u20B9\u20B9",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      opens: "00:00",
      closes: "23:59"
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Travel Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Airport Drop & Pickup"
          }
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Corporate Employee Transport"
          }
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Outstation Taxi"
          }
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Temple Tour Packages"
          }
        }
      ]
    }
  };
  return renderTemplate(_a || (_a = __template(["<html", ' class="scroll-smooth"> <head><!-- SEO: Hreflang Tags --><link rel="alternate" hreflang="en-IN"', '><link rel="alternate" hreflang="ta-IN"', '><link rel="alternate" hreflang="x-default"', '><!-- Google tag (gtag.js) --><script async type="text/partytown" src="https://www.googletagmanager.com/gtag/js?id=G-STG8DWJ76K"><\/script><script type="text/partytown">\n      window.dataLayer = window.dataLayer || [];\n      function gtag() {\n        dataLayer.push(arguments);\n      }\n      gtag("js", new Date());\n\n      gtag("config", "G-STG8DWJ76K");\n    <\/script><script>\n      function initGoogleMaps() {\n        window.dispatchEvent(new CustomEvent("google-maps-loaded"));\n      }\n    <\/script><script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBPpRgTPIkv20IMdaBqqdlz0S0FEGU5400&libraries=places&callback=initGoogleMaps&loading=async" async><\/script><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="theme-color" content="#4f46e5"><link rel="icon" type="image/png" href="/images/favicon.png"><meta name="description"', '><link rel="canonical"', '><!-- PWA manifest removed --><!-- Fonts: Noto Sans (English), Hind Madurai (Tamil Body), Mukta Malar (Tamil Headings) --><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;500;600;700;800&family=Hind+Madurai:wght@300;400;500;600;700&family=Mukta+Malar:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet"><title>', '</title><!-- Open Graph / Facebook / WhatsApp --><meta property="og:type"', '><meta property="og:url"', '><meta property="og:title"', '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:image:type" content="image/jpeg">', "", '<meta property="og:site_name" content="Kalidass Travels"><!-- Twitter --><meta property="twitter:card" content="summary_large_image"><meta property="twitter:url"', '><meta property="twitter:title"', '><meta property="twitter:description"', '><meta property="twitter:image"', '><!-- Schema.org JSON-LD --><script type="application/ld+json">', '<\/script><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>\n      /* Color Theme Swatches in Hex */\n      .color-theme_logo-1-hex {\n        color: #f22222;\n      }\n      .color-theme_logo-2-hex {\n        color: #f24141;\n      }\n      .color-theme_logo-3-hex {\n        color: #f27777;\n      }\n      .color-theme_logo-4-hex {\n        color: #f2f2f2;\n      }\n      .color-theme_logo-5-hex {\n        color: #0d0d0d;\n      }\n\n      /* Color Theme Swatches in RGBA */\n      .color-theme_logo-1-rgba {\n        color: rgba(242, 34, 34, 1);\n      }\n      .color-theme_logo-2-rgba {\n        color: rgba(242, 65, 65, 1);\n      }\n      .color-theme_logo-3-rgba {\n        color: rgba(242, 119, 119, 1);\n      }\n      .color-theme_logo-4-rgba {\n        color: rgba(242, 242, 242, 1);\n      }\n      .color-theme_logo-5-rgba {\n        color: rgba(13, 13, 13, 1);\n      }\n\n      /* Color Theme Swatches in HSLA */\n      .color-theme_logo-1-hsla {\n        color: hsla(0, 88, 54, 1);\n      }\n      .color-theme_logo-2-hsla {\n        color: hsla(0, 87, 60, 1);\n      }\n      .color-theme_logo-3-hsla {\n        color: hsla(0, 82, 70, 1);\n      }\n      .color-theme_logo-4-hsla {\n        color: hsla(0, 0, 94, 1);\n      }\n      .color-theme_logo-5-hsla {\n        color: hsla(0, 0, 5, 1);\n      }\n\n      :root {\n        --theme-red: #f22222;\n        --theme-red-bright: #f24141;\n        --theme-rose: #f27777;\n        --theme-cream: #f2f2f2;\n        --theme-dark: #0d0d0d;\n      }\n\n      body {\n        background-color: var(--theme-cream);\n        color: var(--theme-dark);\n      }\n\n      nav {\n        background: transparent;\n        border-bottom: 1px solid rgba(13, 13, 13, 0.1);\n      }\n\n      nav a.header-link {\n        color: var(--theme-dark);\n        font-weight: 500;\n        transition: color 0.2s ease;\n      }\n\n      nav a.header-link:hover {\n        color: var(--theme-red);\n      }\n\n      .primary-cta {\n        background: linear-gradient(\n          135deg,\n          var(--theme-red),\n          var(--theme-red-bright)\n        );\n        color: #fff;\n        font-weight: 600;\n        border-radius: 999px;\n        padding: 0.75rem 1.5rem;\n        box-shadow: 0 10px 25px rgba(242, 34, 34, 0.35);\n      }\n\n      .primary-cta:hover {\n        transform: translateY(-1px);\n        box-shadow: 0 12px 28px rgba(242, 65, 65, 0.45);\n      }\n\n      footer {\n        background: var(--theme-dark);\n        color: var(--theme-cream);\n      }\n\n      footer a:hover {\n        color: var(--theme-red);\n      }\n\n      #mobile-menu {\n        background: rgba(242, 242, 242, 0.9);\n      }\n    </style>', "</head> <body", '> <!-- Skip to Content Link --> <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-red-600 px-4 py-2 rounded-md shadow-lg z-[100] font-bold border border-red-200">\nSkip to content\n</a> <!-- Seasonal Offer Ticker (Dismissible) --> <div id="seasonal-offer" class="bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm py-2 px-4 relative z-50 hidden"> <div class="max-w-7xl mx-auto flex justify-between items-center"> <div class="flex-1 text-center font-medium"> <span class="animate-pulse mr-2" aria-hidden="true">\u{1F549}\uFE0F</span> <span class="hidden md:inline">Sabarimala Season 2025-26 Started!\n</span>\nBook your Mandala Pooja Trip now.\n<a href="/services/sabarimala-trip" class="underline ml-2 font-bold hover:text-yellow-200">View Package <span aria-hidden="true">&rarr;</span></a> </div> <button id="close-offer" class="ml-4 text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded" aria-label="Close offer"> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> </button> </div> </div> <script>\n      // Show offer only if not dismissed previously AND not on corporate page\n      const isCorporatePage = window.location.pathname.includes(\n        "/services/category/corporate",\n      );\n      if (!sessionStorage.getItem("offerDismissed") && !isCorporatePage) {\n        const offer = document.getElementById("seasonal-offer");\n        if (offer) offer.classList.remove("hidden");\n      }\n      document.getElementById("close-offer")?.addEventListener("click", () => {\n        document.getElementById("seasonal-offer").style.display = "none";\n        sessionStorage.setItem("offerDismissed", "true");\n      });\n    <\/script> <!-- Navbar --> <nav class="sticky top-0 z-40 shadow-md bg-white" aria-label="Main Navigation"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="flex justify-between items-center h-16"> <!-- Logo --> <div class="flex-shrink-0 flex items-center gap-3"> <a href="/" aria-label="Kalidass Travels home"> <img src="/images/logo.png" alt="Kalidass Travels logo" class="h-12 w-auto object-contain"> </a> </div> <!-- Desktop Menu --> <div class="hidden md:flex items-center space-x-8"> <a', ' class="header-link"> <span class="lang-en">Home</span> <span class="lang-ta">\u0BAE\u0BC1\u0B95\u0BAA\u0BCD\u0BAA\u0BC1</span> </a> <a', ' class="header-link"> <span class="lang-en">Fleet</span> <span class="lang-ta">\u0BB5\u0BBE\u0B95\u0BA9\u0B99\u0BCD\u0B95\u0BB3\u0BCD</span> </a> <a', ' class="header-link"> <span class="lang-en">Drivers</span> <span class="lang-ta">\u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BCD\u0B95\u0BB3\u0BCD</span> </a> <!-- Services Dropdown --> <div class="relative group"> <button class="header-link flex items-center gap-1 focus:outline-none py-4" aria-expanded="false" aria-haspopup="true"> <span class="lang-en">Services</span> <span class="lang-ta">\u0B9A\u0BC7\u0BB5\u0BC8\u0B95\u0BB3\u0BCD</span> <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg> </button> <div class="absolute left-0 top-full w-64 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 transform group-hover:translate-y-0 group-focus-within:translate-y-0 translate-y-2 border border-gray-100 overflow-hidden" role="menu"> <div class="py-2"> ', " </div> </div> </div> <a", ' class="header-link"> <span class="lang-en">Calculator</span> <span class="lang-ta">\u0B95\u0BBE\u0BB2\u0BCD\u0B95\u0BC1\u0BB2\u0BC7\u0B9F\u0BCD\u0B9F\u0BB0\u0BCD</span> </a>  <div class="ml-4"> ', ' </div> </div> <!-- Mobile Controls - In same row --> <div class="flex items-center gap-3 md:hidden"> <!-- Language Toggle (Mobile) --> ', ' <!-- Mobile Menu Button --> <button id="mobile-menu-btn" class="text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-2 min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors active:bg-gray-100" aria-label="Open mobile menu" aria-expanded="false" aria-controls="mobile-menu-drawer"> <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path> </svg> </button> </div> </div> </div> </nav> <div id="mobile-menu-overlay" class="fixed inset-0 bg-black/50 z-50 hidden transition-opacity opacity-0" aria-hidden="true"></div> <!-- Mobile Menu Drawer --> <div id="mobile-menu-drawer" class="fixed top-0 right-0 w-[85%] max-w-sm h-full bg-white z-50 transform translate-x-full transition-transform duration-300 shadow-2xl flex flex-col overflow-y-auto" role="dialog" aria-label="Mobile Navigation" aria-modal="true"> <!-- Header --> <div class="flex justify-end p-4"> <button id="close-menu-btn" class="text-gray-500 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-3 min-h-[48px] min-w-[48px] flex items-center justify-center" aria-label="Close mobile menu"> <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path> </svg> </button> </div> <!-- Navigation Links --> <div class="px-8 py-4 space-y-4 flex-grow"> <a', ' class="block text-base font-medium text-gray-800 hover:text-red-600 border-b border-gray-100 pb-2 transition-colors"> <span class="lang-en">Home</span> <span class="lang-ta">\u0BAE\u0BC1\u0B95\u0BAA\u0BCD\u0BAA\u0BC1</span> </a> <a', ' class="block text-base font-medium text-gray-800 hover:text-red-600 border-b border-gray-100 pb-2 transition-colors"> <span class="lang-en">Fleet</span> <span class="lang-ta">\u0BB5\u0BBE\u0B95\u0BA9\u0B99\u0BCD\u0B95\u0BB3\u0BCD</span> </a> <a', ' class="block text-base font-medium text-gray-800 hover:text-red-600 border-b border-gray-100 pb-2 transition-colors"> <span class="lang-en">Drivers</span> <span class="lang-ta">\u0B93\u0B9F\u0BCD\u0B9F\u0BC1\u0BA8\u0BB0\u0BCD\u0B95\u0BB3\u0BCD</span> </a> <a', ' class="block text-base font-medium text-gray-800 hover:text-red-600 border-b border-gray-100 pb-2 transition-colors"> <span class="lang-en">Calculator</span> <span class="lang-ta">\u0B95\u0BBE\u0BB2\u0BCD\u0B95\u0BC1\u0BB2\u0BC7\u0B9F\u0BCD\u0B9F\u0BB0\u0BCD</span> </a> <!-- Services Accordion --> <div class="border-b border-gray-100 pb-2"> <button id="services-menu-toggle" class="flex items-center justify-between w-full text-base font-medium text-gray-800 hover:text-red-600 transition-colors focus:outline-none focus:text-red-600" aria-expanded="false" aria-controls="services-submenu"> <span class="lang-en">Services</span> <span class="lang-ta">\u0B9A\u0BC7\u0BB5\u0BC8\u0B95\u0BB3\u0BCD</span> <svg id="services-chevron" class="w-4 h-4 transform transition-transform duration-200 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path> </svg> </button> <div id="services-submenu" class="mt-2 ml-4 space-y-2 border-l-2 border-gray-100 pl-4"> <a', ' class="block text-sm text-gray-600 hover:text-red-600"> <span class="lang-en">Acting Drivers</span> <span class="lang-ta">\u0B86\u0B95\u0BCD\u0B9F\u0BBF\u0B99\u0BCD \u0B9F\u0BBF\u0BB0\u0BC8\u0BB5\u0BB0\u0BCD\u0B95\u0BB3\u0BCD</span> </a> <a', ' class="block text-sm text-gray-600 hover:text-red-600"> <span class="lang-en">Corporate Travel</span> <span class="lang-ta">\u0B95\u0BBE\u0BB0\u0BCD\u0BAA\u0BCD\u0BAA\u0BB0\u0BC7\u0B9F\u0BCD \u0BAA\u0BAF\u0BA3\u0BAE\u0BCD</span> </a> <a', ' class="block text-sm text-gray-600 hover:text-red-600"> <span class="lang-en">Temple Tours</span> <span class="lang-ta">\u0B95\u0BCB\u0BB5\u0BBF\u0BB2\u0BCD \u0B9A\u0BC1\u0BB1\u0BCD\u0BB1\u0BC1\u0BB2\u0BBE</span> </a> <a', ' class="block text-sm text-gray-600 hover:text-red-600"> <span class="lang-en">Popular Destinations</span> <span class="lang-ta">\u0BAA\u0BBF\u0BB0\u0BAA\u0BB2\u0BAE\u0BBE\u0BA9 \u0B87\u0B9F\u0B99\u0BCD\u0B95\u0BB3\u0BCD</span> </a> </div> </div> <!-- Proprietor Card --> <div class="pt-6 pb-4 text-center"> <div class="relative mx-auto w-32 h-40 mb-3 rounded-2xl overflow-hidden shadow-lg border-4 border-white"> <img src="/images/drivers/mani-perumal.webp" alt="Proprietor Perumal Manikumar" class="w-full h-full object-cover"> </div> <h3 class="text-xl font-bold text-gray-900 mb-1">Perumal Manikumar</h3> <p class="text-xs tracking-[0.2em] text-gray-500 uppercase font-semibold">\nPROPRIETOR\n</p> </div> </div> </div> <!-- Main Content --> <main id="main-content"> ', ' </main> <!-- Footer --> <footer class="bg-black text-white py-12"> <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div class="flex flex-col items-center text-center"> <!-- Logo --> <div class="mb-6 bg-white p-2 rounded"> <img src="/images/logo.png" alt="Kalidass Travels" class="h-12 w-auto"> </div> <!-- GSTIN --> <p class="text-sm md:text-base mb-1 font-medium text-gray-400">\nGSTIN : 33COVPM0531D1Z4\n</p> <!-- Address --> <p class="text-sm md:text-base mb-2 text-gray-400">\nNo. 4/220, E88, Ponniamman Kovil Street, Annamalai Nagar, Medavakkam,\n          Chennai -600 100.\n</p> <!-- Google Maps Link --> <a href="https://maps.google.com/?q=Kalidass+Travels+Medavakkam+Chennai" target="_blank" class="text-blue-400 hover:text-blue-300 text-sm mb-8 font-medium">\nView on Google Maps\n</a> <!-- Divider --> <div class="w-full border-t border-gray-800 mb-8"></div> <!-- Copyright --> <p class="text-sm text-gray-400">\n&copy; ', ' Kalidass Travels | All rights reserved.\n</p> <p class="text-sm text-gray-400 mt-1">\nBuilt by <a href="https://wa.me/919952749408?text=Hi%20Saravn,%20I%20saw%20your%20work%20on%20Kalidass%20Travels%20website." target="_blank" class="font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent hover:opacity-80 transition-opacity">Saravn</a> </p> </div> </div> <!-- Floating Action Buttons --> <!-- Call Button --> <a href="tel:+919092303060" class="fixed bottom-6 right-6 z-50 group" aria-label="Call Kalidass Travels"> <div class="relative bg-[#4285F4] hover:bg-[#3367D6] text-white p-3 rounded-full shadow-[0_10px_30px_rgba(66,133,244,0.5)] transition-all transform hover:scale-110 flex items-center justify-center w-14 h-14 border-2 border-white"> <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"> <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.49-5.15-3.8-6.62-6.63l1.97-1.57c.23-.29.33-.66.24-1.01-.36-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3.28 3 3.93 3 4.74c0 9.27 7.55 16.82 16.82 16.82.81 0 1.46-.65 1.46-1.19v-3.72c0-.54-.45-.99-.99-.99z"></path> </svg> </div> </a> </footer> <!-- Mobile Menu Toggle Script -->  <!-- Analytics & Monitoring -->  </body><!-- Mobile Menu Overlay --></html>'])), addAttribute(lang, "lang"), addAttribute(enHref, "href"), addAttribute(taHref, "href"), addAttribute(enHref, "href"), addAttribute(description, "content"), addAttribute(url, "href"), title, addAttribute(type, "content"), addAttribute(url, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(fullImage, "content"), ogImage && renderTemplate`<meta property="og:image:width" content="1200">`, ogImage && renderTemplate`<meta property="og:image:height" content="630">`, addAttribute(url, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(fullImage, "content"), unescapeHTML(JSON.stringify(schema || localBusinessSchema)), renderHead(), addAttribute(`font-sans antialiased ${isTamil ? "lang-ta" : ""}`, "class"), addAttribute(isTamil ? "/ta" : "/", "href"), addAttribute(isTamil ? "/ta#fleet" : "/#fleet", "href"), addAttribute(isTamil ? "/ta/drivers" : "/drivers", "href"), services.map((service) => renderTemplate`<a${addAttribute(service.link, "href")} class="block px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 border-b border-gray-50 last:border-0" role="menuitem"> <span class="lang-en font-medium">${service.title}</span> <span class="lang-ta font-medium"> ${service.title_ta} </span> </a>`), addAttribute(isTamil ? "/ta/calculator" : "/calculator", "href"), renderComponent($$result, "LanguageToggle", LanguageToggle, { "isMobile": false, "client:load": true, "currentLang": lang, "targetUrl": targetPath, "client:component-hydration": "load", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/react/LanguageToggle.jsx", "client:component-export": "default" }), renderComponent($$result, "LanguageToggle", LanguageToggle, { "isMobile": true, "client:load": true, "currentLang": lang, "targetUrl": targetPath, "client:component-hydration": "load", "client:component-path": "D:/websites/kalidass-attempt-main/src/components/react/LanguageToggle.jsx", "client:component-export": "default" }), addAttribute(isTamil ? "/ta" : "/", "href"), addAttribute(isTamil ? "/ta#fleet" : "/#fleet", "href"), addAttribute(isTamil ? "/ta/drivers" : "/drivers", "href"), addAttribute(isTamil ? "/ta/calculator" : "/calculator", "href"), addAttribute(isTamil ? "/ta/services/category/acting-drivers" : "/services/category/acting-drivers", "href"), addAttribute(isTamil ? "/ta/services/category/corporate" : "/services/category/corporate", "href"), addAttribute(isTamil ? "/ta/services/category/temple-tours" : "/services/category/temple-tours", "href"), addAttribute(isTamil ? "/ta/services/category/popular-destinations" : "/services/category/popular-destinations", "href"), renderSlot($$result, $$slots["default"]), (/* @__PURE__ */ new Date()).getFullYear());
}, "D:/websites/kalidass-attempt-main/src/layouts/Layout.astro", void 0);

export { $$Layout as $, siteContent as s, useLanguage as u };
