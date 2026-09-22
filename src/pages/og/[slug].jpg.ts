import type { APIRoute } from "astro";
import { html } from "satori-html";
import satori from "satori";
import sharp from "sharp";
import { readFileSync, existsSync } from "fs";
import path from "path";
import serviceDetails from "../../data/serviceDetails.json";

// Service Category Hub pages metadata for dynamic OG card generation
const categoryHubs: Record<string, {
  slug: string;
  title: string;
  category: string;
  duration: string;
  startingPrice: string;
  priceSub: string;
  benefits: string[];
  heroImage: string;
}> = {
  "corporate": {
    slug: "corporate",
    title: "Corporate Cab & Employee Transport Services in Chennai",
    category: "Corporate Mobility",
    duration: "24/7 Shift SLA",
    startingPrice: "₹42,000",
    priceSub: "(Monthly Retainer)",
    benefits: [
      "Monthly Executive Car Retainers with Dedicated Chauffeur",
      "24/7 Routed Employee Shift Commute (ETS) with GPS Tracking",
      "100% Compliant Billing & Corporate GST Invoicing"
    ],
    heroImage: "/images/services/corporate.webp"
  },
  "chennai-airport-taxi": {
    slug: "chennai-airport-taxi",
    title: "Chennai Airport Taxi & VIP Airport Transfers (MAA)",
    category: "Airport Transfers",
    duration: "5–10 Min Dispatch",
    startingPrice: "₹650",
    priceSub: "(Flat Airport Fare)",
    benefits: [
      "5–10 Min Rapid Dispatch from MAA Airport Perimeter",
      "Real-Time Flight Delay Tracking (Zero Waiting Fee)",
      "Meet & Greet Service with Passenger Name Placard"
    ],
    heroImage: "/images/services/airport-transfer.webp"
  },
  "acting-drivers": {
    slug: "acting-drivers",
    title: "Verified Acting Drivers in Chennai for Your Personal Car",
    category: "Acting Drivers",
    duration: "30–60 Min Doorstep",
    startingPrice: "₹600",
    priceSub: "(4h City Duty)",
    benefits: [
      "Manual, Automatic & Luxury EV Transmission Expertise",
      "Police-Verified & Background Screened Chauffeurs",
      "Zero Surge Pricing During Rain or Peak Traffic Hours"
    ],
    heroImage: "/images/services/acting-drivers.webp"
  },
  "outstation-cabs": {
    slug: "outstation-cabs",
    title: "Outstation Cabs from Chennai – Flat Rates & Round Trips",
    category: "Outstation Cabs",
    duration: "Round Trip & One Way",
    startingPrice: "₹14/km",
    priceSub: "(Transparent Billing)",
    benefits: [
      "Doorstep Pickup Anywhere Across Chennai & Suburbs",
      "Clean AC Sedan, Ertiga, Innova Crysta & Tempo Traveller",
      "Experienced Highway Chauffeurs & 24/7 Breakdown Backup"
    ],
    heroImage: "/images/temple/mahabalipuram-ecr-temples.webp"
  },
  "temple-tours": {
    slug: "temple-tours",
    title: "Tamil Nadu & South India Temple Tour Packages from Chennai",
    category: "Temple Tours",
    duration: "1 Day to 5 Days",
    startingPrice: "₹3,500",
    priceSub: "(Round-Trip Flat)",
    benefits: [
      "Tirupati, Navagraha, Thiruvannamalai, Rameswaram & Madurai",
      "All Interstate Road Permits, Tolls & Driver Bata Included",
      "Doorstep Home Pickup & Temple Darshan Timings Guidance"
    ],
    heroImage: "/images/services/temple-tours.webp"
  },
  "weekend-packages": {
    slug: "weekend-packages",
    title: "Weekend Getaway Tour Packages from Chennai",
    category: "Weekend Tours",
    duration: "1 Day / 2 Days",
    startingPrice: "₹4,500",
    priceSub: "(Round-Trip Flat)",
    benefits: [
      "Pondicherry, Mahabalipuram, Vellore, Yelagiri & Yercaud",
      "Private Sanitized AC Cabs with Dedicated Chauffeur",
      "Custom Scenic Sightseeing Itinerary & Doorstep Pickup"
    ],
    heroImage: "/images/temple/pondicherry.webp"
  },
  "popular-destinations": {
    slug: "popular-destinations",
    title: "Popular Outstation Travel Destinations from Chennai",
    category: "Outstation Travel",
    duration: "Doorstep Pickup",
    startingPrice: "₹14/km",
    priceSub: "(Flat Transparent Rates)",
    benefits: [
      "Top Highway Routes Across Tamil Nadu, AP, Kerala & Karnataka",
      "Sanitized AC Sedans, SUVs & Executive Innova Crysta",
      "Zero Surge Guarantee, Upfront Fares & 24/7 Support"
    ],
    heroImage: "/images/temple/mahabalipuram-ecr-temples.webp"
  },
  "services": {
    slug: "services",
    title: "Premium Travel & Chauffeur Services in Chennai",
    category: "Kalidass Travels",
    duration: "24/7 Availability",
    startingPrice: "₹650",
    priceSub: "(Starting Fares)",
    benefits: [
      "Airport Transfers, Outstation Cabs & South India Temple Tours",
      "Police-Verified Professional Chauffeurs for Your Car",
      "4.9 ★ Rated • 1,500+ Happy Devotees & Travelers"
    ],
    heroImage: "/images/services/airport-transfer.webp"
  }
};

export function getStaticPaths() {
  const servicePaths = serviceDetails.map((service) => ({
    params: { slug: service.slug },
  }));

  const hubPaths = Object.keys(categoryHubs).map((slug) => ({
    params: { slug },
  }));

  return [...servicePaths, ...hubPaths];
}

export const prerender = true;

// Priority header regexes to extract starting price
const priorityHeaderRegexes = [
  /flat/i, /fare/i, /cost/i, /package/i, /charge/i, /sedan/i, /hatchback/i, /swift/i, /etios/i, /price/i, /rate/i
];

function extractStartingPrice(svc: any): string | null {
  if (!svc.tariff?.rows || svc.tariff.rows.length === 0) return null;
  const headers = svc.tariff.headers || [];
  const rows = svc.tariff.rows;

  let targetColIdx = -1;
  for (const regex of priorityHeaderRegexes) {
    const idx = headers.findIndex((h: string) => regex.test(h) && !/rate\/km/i.test(h) && !/night/i.test(h));
    if (idx !== -1) {
      targetColIdx = idx;
      break;
    }
  }

  let minPrice = Infinity;
  for (const row of rows) {
    let cellsToCheck: any[] = [];
    if (targetColIdx !== -1 && row[targetColIdx] !== undefined) {
      cellsToCheck = [row[targetColIdx]];
    } else {
      cellsToCheck = [...row].reverse();
    }

    for (const cell of cellsToCheck) {
      const cellStr = String(cell);
      if (!cellStr.includes('₹')) continue;
      const matches = [...cellStr.matchAll(/₹\s*([0-9,]+)/g)];
      if (matches.length > 0) {
        const num = parseInt(matches[0][1].replace(/,/g, ''), 10);
        if (!isNaN(num) && num > 0) {
          if (num < 100 && (/trip|tour|package|drop|wedding/i.test(svc.slug) || /temple/i.test(svc.category))) {
            continue;
          }
          if (num < minPrice) minPrice = num;
        }
      }
    }
  }

  return minPrice !== Infinity ? String(minPrice) : null;
}

// Inline SVGs for crisp pixel-perfect rendering across all environments
const checkIcon = `
  <svg viewBox="0 0 20 20" width="15" height="15" fill="#34D399" style="margin-right: 6px;">
    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
  </svg>
`;

const starIcon = `
  <svg viewBox="0 0 20 20" width="16" height="16" fill="#FBBF24" style="margin-right: 5px;">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
`;

const clockIcon = `
  <svg viewBox="0 0 20 20" width="14" height="14" fill="#FBBF24" style="margin-right: 6px;">
    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
  </svg>
`;

const phoneIcon = `
  <svg viewBox="0 0 20 20" width="14" height="14" fill="#CBD5E1" style="margin-right: 6px;">
    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 4V3z" />
  </svg>
`;

export const GET: APIRoute = async ({ params, request }) => {
  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const service = serviceDetails.find((s) => s.slug === slug);
  const hub = categoryHubs[slug];

  if (!service && !hub) {
    return new Response("Not found", { status: 404 });
  }

  // Image Mapping
  const tourImages: Record<string, string> = {
    "tirupati-package": "/images/temple/tirupati-balaji.webp",
    "thiruvannamalai-girivalam-trip": "/images/temple/thiruvannamalai-girivalam.webp",
    "rameswaram-2-days": "/images/temple/rameswaram.webp",
    "navagraha-tour": "/images/temple/navagraha.webp",
    "kanchipuram-temple-trip": "/images/temple/kanchipuram-temple.webp",
    "chidambaram-temple-trip": "/images/temple/chidambaram-natarajar-temple.webp",
    "sabarimala-trip": "/images/temple/sabarimala-temple.webp",
    "pondicherry-one-day-trip": "/images/temple/pondicherry.webp",
    "vellore-golden-temple": "/images/temple/vellore-golden.webp",
    "mahabalipuram-ecr-temple-route": "/images/temple/mahabalipuram-ecr-temples.webp",
    "one-day-chennai-city-tour": "/images/temple/chennai-city.webp",
    "driver-car-for-weddings": "/images/services/corporate.webp",
    "chennai-airport-taxi-transfers": "/images/services/airport-transfer.webp",
  };

  const categoryImages: Record<string, string> = {
    "Acting Drivers": "/images/services/acting-drivers.webp",
    "Acting Driver Services": "/images/services/acting-drivers.webp",
    "Outstation Cabs": "/images/temple/mahabalipuram-ecr-temples.webp",
    "Popular Destinations": "/images/temple/mahabalipuram-ecr-temples.webp",
    "Temple Tours": "/images/services/temple-tours.webp",
    "Corporate Mobility": "/images/services/corporate.webp",
    "Corporate Travel": "/images/services/corporate.webp",
    "Airport Transfers": "/images/services/airport-transfer.webp",
    "Premium Fleet Rental": "/images/services/corporate.webp"
  };

  // Determine card content
  let title = "";
  let category = "";
  let duration = "";
  let startingPrice = "";
  let priceSub = "";
  let benefits: string[] = [];
  let heroImage = "";

  if (service) {
    title = service.title;
    category = service.category;
    duration = service.duration ? service.duration.split('(')[0].trim() : "Doorstep Service";
    heroImage = tourImages[service.slug] || categoryImages[service.category] || "/images/temple/tirupati-balaji.webp";

    const extracted = extractStartingPrice(service);
    if (extracted) {
      startingPrice = `₹${parseInt(extracted).toLocaleString('en-IN')}`;
    } else if (service.slug.startsWith("acting-driver")) {
      startingPrice = "₹600";
    } else if (service.slug.includes("airport")) {
      startingPrice = "₹1,200";
    } else {
      startingPrice = "₹14/km";
    }

    if (category === "Temple Tours") {
      priceSub = "(Round-Trip Flat)";
      benefits = [
        "All Tolls, AP Permit & Tax Included",
        "AC Sedan, Ertiga & Innova Crysta",
        "Police-Verified Executive Chauffeurs"
      ];
    } else if (category.includes("Acting Driver")) {
      priceSub = "(Starting Fare)";
      benefits = [
        "Hourly (4h/8h) & Outstation Duties",
        "Manual, Automatic & EV Transmission",
        "Police-Verified Screened Chauffeurs"
      ];
    } else if (category.includes("Corporate")) {
      priceSub = "(Starting Fare)";
      benefits = [
        "24/7 Shift Commute & Monthly Retainers",
        "100% Compliant & Corporate GST Invoicing",
        "Uniformed Chauffeurs with 60-Min SLA"
      ];
    } else if (category.includes("Airport")) {
      priceSub = "(Flat Airport Fare)";
      benefits = [
        "5–10 Min Rapid Dispatch from MAA",
        "Real-Time Flight Tracking (Zero Waiting Fee)",
        "Meet & Greet Service with Name Placard"
      ];
    } else {
      priceSub = "(Flat Transparent Rates)";
      benefits = [
        "Doorstep Chennai Pickup & Drop",
        "Sanitized AC Fleet with Pro Chauffeur",
        "Transparent Fixed Rates • Zero Surge"
      ];
    }
  } else if (hub) {
    title = hub.title;
    category = hub.category;
    duration = hub.duration;
    startingPrice = hub.startingPrice;
    priceSub = hub.priceSub;
    benefits = hub.benefits;
    heroImage = hub.heroImage;
  }

  // Load and convert hero image using sharp
  let imageBuffer = "";
  try {
    const imagePath = path.resolve(`./public${heroImage}`);
    if (existsSync(imagePath)) {
      const fileBuffer = readFileSync(imagePath);
      const jpegBuffer = await sharp(fileBuffer)
        .resize({ width: 800, height: 700, fit: "cover" })
        .jpeg({ quality: 88 })
        .toBuffer();
      imageBuffer = `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`;
    }
  } catch (e) {
    console.error(`Failed to load hero image: ${heroImage}`, e);
  }

  // Load brand fonts (Plus Jakarta Sans)
  const fontBoldPath = path.resolve("./public/fonts/PlusJakartaSans-Bold.ttf");
  const fontBoldData = readFileSync(fontBoldPath);
  const fontSemiBoldPath = path.resolve("./public/fonts/PlusJakartaSans-SemiBold.ttf");
  const fontSemiBoldData = readFileSync(fontSemiBoldPath);

  // Load and convert logo to PNG data URI
  let logoBase64 = "";
  try {
    const logoPngPath = path.resolve("./public/images/logo.png");
    const logoWebpPath = path.resolve("./public/images/logo.webp");
    const chosenLogo = existsSync(logoPngPath) ? logoPngPath : logoWebpPath;
    const logoBuffer = readFileSync(chosenLogo);
    const logoPng = await sharp(logoBuffer).png().toBuffer();
    logoBase64 = `data:image/png;base64,${logoPng.toString("base64")}`;
  } catch (e) {
    console.error("Failed to load logo", e);
  }

  const htmlString = `
    <div style="display: flex; flex-direction: row; width: 1200px; height: 630px; background-color: #0F172A; position: relative; overflow: hidden; font-family: 'Plus Jakarta Sans';">
      <!-- Left Content Panel (710px) -->
      <div style="display: flex; flex-direction: column; justify-content: space-between; width: 710px; height: 630px; padding: 44px 44px 38px 48px; background: linear-gradient(135deg, #111827 0%, #0F172A 65%, #0B0F17 100%);">
        <!-- Top Details Block -->
        <div style="display: flex; flex-direction: column;">
          <!-- Brand & Rating Header Bar -->
          <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; margin-bottom: 22px;">
            <!-- Brand Logo Pill -->
            <div style="display: flex; align-items: center; background-color: #FFFFFF; padding: 7px 18px; border-radius: 9999px;">
              ${logoBase64 ? `<img src="${logoBase64}" style="height: 32px; object-fit: contain;" />` : `<span style="color: #000; font-size: 20px; font-weight: 800;">Kalidass Travels</span>`}
            </div>

            <!-- Trust Badge -->
            <div style="display: flex; flex-direction: row; align-items: center; background-color: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); padding: 7px 16px; border-radius: 9999px;">
              ${starIcon}
              <span style="color: #FBBF24; font-size: 15px; font-weight: 700; margin-right: 6px;">4.9</span>
              <span style="color: #CBD5E1; font-size: 13px; font-weight: 600;">1,500+ Verified Trips</span>
            </div>
          </div>

          <!-- Category Chip -->
          <div style="display: flex; flex-direction: row; align-items: center; margin-bottom: 14px;">
            <div style="display: flex; flex-direction: row; align-items: center; background-color: rgba(236,34,31,0.14); border: 1px solid rgba(236,34,31,0.4); padding: 5px 12px; border-radius: 9999px;">
              <div style="display: flex; width: 8px; height: 8px; border-radius: 4px; background-color: #EC221F; margin-right: 8px;"></div>
              <span style="color: #FCA5A5; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                ${category.toUpperCase()} • DOORSTEP CHENNAI
              </span>
            </div>
          </div>

          <!-- Service Title -->
          <div style="display: flex; font-size: 40px; font-weight: 800; color: #FFFFFF; margin-bottom: 16px; line-height: 1.18; letter-spacing: -0.5px; max-width: 620px;">
            ${title}
          </div>

          <!-- Feature Chips Row -->
          <div style="display: flex; flex-direction: row; flex-wrap: wrap; margin-bottom: 8px;">
            ${benefits.map((b, idx) => `
              <div style="display: flex; flex-direction: row; align-items: center; background-color: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 7px 12px; border-radius: 8px; margin-right: 8px; margin-bottom: 8px;">
                ${checkIcon}
                <span style="color: #E2E8F0; font-size: 13px; font-weight: 600;">${b}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Bottom Pricing & Guarantee Block -->
        <div style="display: flex; flex-direction: column;">
          <!-- Price & Booking Row -->
          <div style="display: flex; flex-direction: row; align-items: center; margin-bottom: 18px;">
            <!-- Price Block -->
            <div style="display: flex; flex-direction: column; background-color: rgba(236,34,31,0.12); border: 1.5px solid rgba(236,34,31,0.35); padding: 10px 18px; border-radius: 14px; margin-right: 14px;">
              <span style="color: #94A3B8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">All-Inclusive Flat Fare</span>
              <div style="display: flex; flex-direction: row; align-items: baseline;">
                <span style="color: #FBBF24; font-size: 32px; font-weight: 800; line-height: 1; margin-right: 6px;">${startingPrice}</span>
                <span style="color: #E2E8F0; font-size: 13px; font-weight: 600;">${priceSub}</span>
              </div>
            </div>

            <!-- Booking Guarantee Block -->
            <div style="display: flex; flex-direction: column; justify-content: center; background-color: rgba(16,185,129,0.12); border: 1.5px solid rgba(16,185,129,0.3); padding: 10px 18px; border-radius: 14px;">
              <div style="display: flex; flex-direction: row; align-items: center;">
                <div style="display: flex; width: 8px; height: 8px; border-radius: 4px; background-color: #10B981; margin-right: 6px;"></div>
                <span style="color: #A7F3D0; font-size: 13px; font-weight: 800;">Guaranteed On-Time</span>
              </div>
              <span style="color: #6EE7B7; font-size: 12px; font-weight: 600; margin-top: 3px;">Zero Surge Pricing • 24/7 Support</span>
            </div>
          </div>

          <!-- Bottom Footer Details -->
          <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
            <div style="display: flex; align-items: center;">
              <span style="color: #94A3B8; font-size: 14px; font-weight: 700;">kalidasstravels.in</span>
            </div>
            <div style="display: flex; flex-direction: row; align-items: center; background-color: rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 8px;">
              ${phoneIcon}
              <span style="color: #F8FAFC; font-size: 14px; font-weight: 700;">+91 90923 03060</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Visual Panel (490px) -->
      <div style="display: flex; width: 490px; height: 630px; position: relative; overflow: hidden;">
        ${imageBuffer ? `<img src="${imageBuffer}" style="width: 100%; height: 100%; object-fit: cover;" />` : ""}
        <!-- Smooth Dark Gradient Overlay for Seamless Transition -->
        <div style="display: flex; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to right, #0F172A 0%, rgba(15,23,42,0.4) 30%, transparent 65%);"></div>
        <div style="display: flex; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(15,23,42,0.6) 0%, transparent 40%);"></div>

        <!-- Duration / SLA Floating Badge -->
        <div style="display: flex; flex-direction: row; align-items: center; position: absolute; bottom: 28px; right: 24px; background-color: rgba(15,23,42,0.9); border: 1.5px solid rgba(255,255,255,0.25); padding: 8px 16px; border-radius: 9999px;">
          ${clockIcon}
          <span style="color: #FFFFFF; font-size: 13px; font-weight: 700;">${duration}</span>
        </div>
      </div>

      <!-- Sleek Multi-Tone Accent Bottom Line -->
      <div style="display: flex; position: absolute; bottom: 0; left: 0; width: 1200px; height: 5px; background: linear-gradient(90deg, #EC221F 0%, #F59E0B 40%, #10B981 80%, #1E252D 100%);"></div>
    </div>
  `;

  const markup = html(htmlString);

  const svg = await satori(markup as any, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Plus Jakarta Sans",
        data: fontBoldData,
        style: "normal",
        weight: 800,
      },
      {
        name: "Plus Jakarta Sans",
        data: fontSemiBoldData,
        style: "normal",
        weight: 600,
      },
    ],
  });

  const jpeg = await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toBuffer();

  return new Response(jpeg as any, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
