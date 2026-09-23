import type { APIRoute } from "astro";
import { html } from "satori-html";
import satori from "satori";
import sharp from "sharp";
import { readFileSync, existsSync } from "fs";
import path from "path";
import serviceDetails from "../../data/serviceDetails.json";

// ─── Category Hub Overrides ──────────────────────────────────────────────────
const categoryHubs: Record<string, {
  slug: string;
  title: string;
  category: string;
  route: string;
  startingPrice: string;
  priceSub: string;
  includes: string[];
  heroImage: string;
}> = {
  "corporate": {
    slug: "corporate",
    title: "Corporate Cab & Employee Transport Services in Chennai",
    category: "Corporate Mobility",
    route: "Chennai • Pan-City",
    startingPrice: "₹42,000",
    priceSub: "Monthly Retainer",
    includes: [
      "24/7 Routed Employee Shift Commute with GPS",
      "Monthly Executive Car Retainer + Chauffeur",
      "100% Compliant Corporate GST Invoicing"
    ],
    heroImage: "/images/services/corporate.webp"
  },
  "chennai-airport-taxi": {
    slug: "chennai-airport-taxi",
    title: "Chennai Airport Taxi & VIP Airport Transfers (MAA)",
    category: "Airport Transfers",
    route: "MAA → Doorstep Chennai",
    startingPrice: "₹650",
    priceSub: "Flat Airport Fare",
    includes: [
      "5–10 Min Rapid Dispatch from MAA Terminal",
      "Real-Time Flight Delay Tracking (Zero Penalty)",
      "Meet & Greet with Personalized Name Placard"
    ],
    heroImage: "/images/services/airport-transfer.webp"
  },
  "acting-drivers": {
    slug: "acting-drivers",
    title: "Verified Acting Drivers in Chennai for Your Personal Car",
    category: "Acting Drivers",
    route: "Chennai • Doorstep Pickup",
    startingPrice: "₹600",
    priceSub: "4h City Duty",
    includes: [
      "Manual, Automatic & Luxury EV Transmission Expertise",
      "Police-Verified & Background Screened Chauffeurs",
      "Zero Surge Pricing During Rain or Peak Traffic"
    ],
    heroImage: "/images/services/acting-drivers.webp"
  },
  "outstation-cabs": {
    slug: "outstation-cabs",
    title: "Outstation Cabs from Chennai – Flat Rates & Round Trips",
    category: "Outstation Cabs",
    route: "Chennai → Tamil Nadu & Beyond",
    startingPrice: "₹14/km",
    priceSub: "Transparent Billing",
    includes: [
      "Doorstep Pickup Anywhere Across Chennai & Suburbs",
      "AC Sedan, Ertiga, Innova Crysta & Tempo Traveller",
      "Experienced Highway Chauffeurs & 24/7 Support"
    ],
    heroImage: "/images/temple/mahabalipuram-ecr-temples.webp"
  },
  "temple-tours": {
    slug: "temple-tours",
    title: "Tamil Nadu & South India Temple Tour Packages from Chennai",
    category: "Temple Tours",
    route: "Chennai → South India Temples",
    startingPrice: "₹3,500",
    priceSub: "Round-Trip Flat",
    includes: [
      "Tirupati, Navagraha, Thiruvannamalai, Rameswaram & Madurai",
      "All Interstate Permits, Tolls & Driver Bata Included",
      "Doorstep Home Pickup & Temple Darshan Timings Guidance"
    ],
    heroImage: "/images/services/temple-tours.webp"
  },
  "weekend-packages": {
    slug: "weekend-packages",
    title: "Weekend Getaway Tour Packages from Chennai",
    category: "Weekend Tours",
    route: "Chennai → Weekend Escapes",
    startingPrice: "₹4,500",
    priceSub: "Round-Trip Flat",
    includes: [
      "Pondicherry, Mahabalipuram, Vellore, Yelagiri & Yercaud",
      "Private Sanitized AC Cab with Dedicated Chauffeur",
      "Custom Scenic Itinerary & Doorstep Pickup"
    ],
    heroImage: "/images/temple/pondicherry.webp"
  },
  "popular-destinations": {
    slug: "popular-destinations",
    title: "Popular Outstation Travel Destinations from Chennai",
    category: "Outstation Travel",
    route: "Chennai → Top Destinations",
    startingPrice: "₹14/km",
    priceSub: "Flat Transparent Rates",
    includes: [
      "Top Routes Across Tamil Nadu, AP, Kerala & Karnataka",
      "Sanitized AC Sedans, SUVs & Executive Innova Crysta",
      "Zero Surge Guarantee, Upfront Fares & 24/7 Support"
    ],
    heroImage: "/images/temple/mahabalipuram-ecr-temples.webp"
  },
  "services": {
    slug: "services",
    title: "Premium Travel & Chauffeur Services in Chennai",
    category: "Kalidass Travels",
    route: "Chennai • South India",
    startingPrice: "₹650",
    priceSub: "Starting Fares",
    includes: [
      "Airport Transfers, Outstation Cabs & Temple Tours",
      "Police-Verified Professional Chauffeurs for Your Car",
      "4.9 ★ Rated • 1,500+ Happy Devotees & Travelers"
    ],
    heroImage: "/images/services/airport-transfer.webp"
  }
};

// ─── Static Paths ────────────────────────────────────────────────────────────
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

// ─── Image Map ───────────────────────────────────────────────────────────────
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

// ─── Category Accent Themes ───────────────────────────────────────────────────
function getAccentTheme(category: string): { primary: string; glow: string; chipBg: string; chipBorder: string; chipText: string; priceBorder: string; priceBg: string } {
  const cat = category.toLowerCase();
  if (cat.includes("temple") || cat.includes("pilgrimage") || cat.includes("weekend") || cat.includes("outstation travel")) {
    // Saffron gold — devotional
    return {
      primary: "#F59E0B",
      glow: "rgba(245,158,11,0.18)",
      chipBg: "rgba(245,158,11,0.15)",
      chipBorder: "rgba(245,158,11,0.45)",
      chipText: "#FDE68A",
      priceBorder: "rgba(245,158,11,0.4)",
      priceBg: "rgba(245,158,11,0.12)",
    };
  }
  if (cat.includes("airport")) {
    // Emerald — on-time
    return {
      primary: "#10B981",
      glow: "rgba(16,185,129,0.18)",
      chipBg: "rgba(16,185,129,0.15)",
      chipBorder: "rgba(16,185,129,0.45)",
      chipText: "#A7F3D0",
      priceBorder: "rgba(16,185,129,0.4)",
      priceBg: "rgba(16,185,129,0.12)",
    };
  }
  if (cat.includes("corporate")) {
    // Violet — executive
    return {
      primary: "#8B5CF6",
      glow: "rgba(139,92,246,0.18)",
      chipBg: "rgba(139,92,246,0.15)",
      chipBorder: "rgba(139,92,246,0.45)",
      chipText: "#DDD6FE",
      priceBorder: "rgba(139,92,246,0.4)",
      priceBg: "rgba(139,92,246,0.12)",
    };
  }
  if (cat.includes("acting driver")) {
    // Royal blue — professional
    return {
      primary: "#3B82F6",
      glow: "rgba(59,130,246,0.18)",
      chipBg: "rgba(59,130,246,0.15)",
      chipBorder: "rgba(59,130,246,0.45)",
      chipText: "#BFDBFE",
      priceBorder: "rgba(59,130,246,0.4)",
      priceBg: "rgba(59,130,246,0.12)",
    };
  }
  // Kalidass red — default / outstation
  return {
    primary: "#EC221F",
    glow: "rgba(236,34,31,0.18)",
    chipBg: "rgba(236,34,31,0.14)",
    chipBorder: "rgba(236,34,31,0.4)",
    chipText: "#FCA5A5",
    priceBorder: "rgba(236,34,31,0.35)",
    priceBg: "rgba(236,34,31,0.12)",
  };
}

// ─── Price Extraction ─────────────────────────────────────────────────────────
const priorityHeaderRegexes = [
  /flat/i, /fare/i, /cost/i, /package/i, /charge/i, /sedan/i, /hatchback/i,
  /swift/i, /etios/i, /price/i, /rate/i
];

function extractStartingPrice(svc: any): string | null {
  if (!svc.tariff?.rows || svc.tariff.rows.length === 0) return null;
  const headers = svc.tariff.headers || [];
  const rows = svc.tariff.rows;

  let targetColIdx = -1;
  for (const regex of priorityHeaderRegexes) {
    const idx = headers.findIndex((h: string) => regex.test(h) && !/rate\/km/i.test(h) && !/night/i.test(h));
    if (idx !== -1) { targetColIdx = idx; break; }
  }

  let minPrice = Infinity;
  for (const row of rows) {
    let cellsToCheck: any[] = targetColIdx !== -1 && row[targetColIdx] !== undefined
      ? [row[targetColIdx]]
      : [...row].reverse();

    for (const cell of cellsToCheck) {
      const cellStr = String(cell);
      if (!cellStr.includes("₹")) continue;
      const matches = [...cellStr.matchAll(/₹\s*([0-9,]+)/g)];
      if (matches.length > 0) {
        const num = parseInt(matches[0][1].replace(/,/g, ""), 10);
        if (!isNaN(num) && num > 0) {
          if (num < 100 && (/trip|tour|package|drop|wedding/i.test(svc.slug) || /temple/i.test(svc.category))) continue;
          if (num < minPrice) minPrice = num;
        }
      }
    }
  }
  return minPrice !== Infinity ? String(minPrice) : null;
}

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
const checkSvg = (color: string) => `
  <svg viewBox="0 0 20 20" width="16" height="16" fill="${color}" style="margin-right:8px;flex-shrink:0;">
    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
  </svg>
`;

const starSvg = `
  <svg viewBox="0 0 20 20" width="16" height="16" fill="#FBBF24" style="margin-right:5px;">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
`;

const routeSvg = (color: string) => `
  <svg viewBox="0 0 20 20" width="14" height="14" fill="${color}" style="margin-right:7px;flex-shrink:0;">
    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
  </svg>
`;

// ─── API Route ────────────────────────────────────────────────────────────────
export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;
  if (!slug) return new Response("Not found", { status: 404 });

  const service = serviceDetails.find((s) => s.slug === slug);
  const hub = categoryHubs[slug];

  if (!service && !hub) return new Response("Not found", { status: 404 });

  // ── Resolve card content ──────────────────────────────────────────────────
  let title = "";
  let category = "";
  let route = "";
  let startingPrice = "";
  let priceSub = "";
  let includes: string[] = [];
  let heroImage = "";

  if (service) {
    title = service.title;
    category = service.category;

    // Route line from real data
    if ((service as any).origin && (service as any).destination) {
      route = `${(service as any).origin} → ${(service as any).destination}`;
    } else if ((service as any).origin) {
      route = `${(service as any).origin} • Doorstep Pickup`;
    } else {
      route = "Chennai • Doorstep Pickup";
    }

    heroImage = tourImages[service.slug] || categoryImages[service.category] || "/images/services/temple-tours.webp";

    // Real includes from service data — up to 3 lines
    const rawIncludes: string[] = (service as any).includes || [];
    includes = rawIncludes.slice(0, 3).map((inc: string) => {
      // Trim to max ~52 chars so it fits the card
      return inc.length > 52 ? inc.slice(0, 50) + "…" : inc;
    });

    // Fill to 3 items if fewer
    while (includes.length < 3) {
      if (category.includes("Temple") || category.includes("Pilgrimage")) {
        includes.push(["All Tolls, AP Permit & Driver Bata Included", "AC Sedan, Ertiga & Innova Crysta", "Police-Verified Executive Chauffeurs"][includes.length] || "");
      } else if (category.includes("Acting")) {
        includes.push(["Hourly (4h/8h) & Outstation Duties", "Manual, Automatic & EV Transmission", "Police-Verified Screened Chauffeurs"][includes.length] || "");
      } else {
        includes.push(["Sanitized AC Fleet with Pro Chauffeur", "Transparent Fixed Rates • Zero Surge", "24/7 Support & Breakdown Backup"][includes.length] || "");
      }
    }

    // Price
    const extracted = extractStartingPrice(service);
    if (extracted) {
      startingPrice = `₹${parseInt(extracted).toLocaleString("en-IN")}`;
    } else if (service.slug.startsWith("acting-driver")) {
      startingPrice = "₹600";
    } else if (service.slug.includes("airport")) {
      startingPrice = "₹1,200";
    } else {
      startingPrice = "₹14/km";
    }

    if (category === "Temple Tours" || category === "Popular Destinations") {
      priceSub = "Round-Trip Flat Fare";
    } else if (category.includes("Acting")) {
      priceSub = "Starting Fare";
    } else if (category.includes("Corporate")) {
      priceSub = "Starting Fare";
    } else if (category.includes("Airport")) {
      priceSub = "Flat Airport Fare";
    } else {
      priceSub = "Transparent Rate";
    }

  } else if (hub) {
    title = hub.title;
    category = hub.category;
    route = hub.route;
    startingPrice = hub.startingPrice;
    priceSub = hub.priceSub;
    includes = hub.includes;
    heroImage = hub.heroImage;
  }

  const accent = getAccentTheme(category);

  // ── Load hero image (full-bleed) ──────────────────────────────────────────
  let imageBuffer = "";
  try {
    const imagePath = path.resolve(`./public${heroImage}`);
    if (existsSync(imagePath)) {
      const fileBuffer = readFileSync(imagePath);
      const jpegBuffer = await sharp(fileBuffer)
        .resize({ width: 1200, height: 630, fit: "cover", position: "center" })
        .jpeg({ quality: 90 })
        .toBuffer();
      imageBuffer = `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`;
    }
  } catch (e) {
    console.error(`Failed to load hero image: ${heroImage}`, e);
  }

  // ── Load fonts ────────────────────────────────────────────────────────────
  const fontBoldPath = path.resolve("./public/fonts/PlusJakartaSans-Bold.ttf");
  const fontBoldData = readFileSync(fontBoldPath);
  const fontSemiBoldPath = path.resolve("./public/fonts/PlusJakartaSans-SemiBold.ttf");
  const fontSemiBoldData = readFileSync(fontSemiBoldPath);

  // ── Load logo ─────────────────────────────────────────────────────────────
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

  // ── Card HTML — Full-Bleed Photo Layout ───────────────────────────────────
  const htmlString = `
    <div style="
      display: flex;
      width: 1200px;
      height: 630px;
      position: relative;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans';
      background-color: #0C111D;
    ">
      <!-- Full-bleed background photo -->
      ${imageBuffer ? `<img src="${imageBuffer}" style="position:absolute;top:0;left:0;width:1200px;height:630px;object-fit:cover;" />` : ""}

      <!-- Top fade: ensure header elements are readable -->
      <div style="display:flex;position:absolute;top:0;left:0;width:1200px;height:280px;background:linear-gradient(to bottom, rgba(5,8,18,0.92) 0%, rgba(5,8,18,0.55) 55%, transparent 100%);"></div>

      <!-- Bottom fade: main content area -->
      <div style="display:flex;position:absolute;bottom:0;left:0;width:1200px;height:460px;background:linear-gradient(to top, rgba(5,8,18,0.98) 0%, rgba(5,8,18,0.92) 40%, rgba(5,8,18,0.65) 70%, transparent 100%);"></div>

      <!-- Subtle left vignette for photo-heavy images -->
      <div style="display:flex;position:absolute;top:0;left:0;width:200px;height:630px;background:linear-gradient(to right, rgba(5,8,18,0.5) 0%, transparent 100%);"></div>

      <!-- ── CONTENT LAYER ── -->
      <div style="display:flex;flex-direction:column;justify-content:space-between;position:absolute;top:0;left:0;width:1200px;height:630px;padding:38px 52px 36px 52px;">

        <!-- TOP ROW: Logo + Trust Badge -->
        <div style="display:flex;flex-direction:row;align-items:center;justify-content:space-between;">
          <!-- Logo pill -->
          <div style="display:flex;align-items:center;background-color:rgba(255,255,255,0.95);padding:8px 20px;border-radius:9999px;box-shadow:0 2px 12px rgba(0,0,0,0.4);">
            ${logoBase64
              ? `<img src="${logoBase64}" style="height:30px;object-fit:contain;" />`
              : `<span style="color:#000;font-size:18px;font-weight:800;">Kalidass Travels</span>`
            }
          </div>

          <!-- Rating badge -->
          <div style="display:flex;flex-direction:row;align-items:center;background-color:rgba(10,14,26,0.75);border:1px solid rgba(255,255,255,0.2);padding:8px 18px;border-radius:9999px;backdrop-filter:blur(4px);">
            ${starSvg}
            <span style="color:#FBBF24;font-size:16px;font-weight:800;margin-right:8px;">4.9</span>
            <span style="color:#CBD5E1;font-size:14px;font-weight:600;">1,500+ Verified Trips</span>
          </div>
        </div>

        <!-- BOTTOM BLOCK: All main content -->
        <div style="display:flex;flex-direction:column;">

          <!-- Route line -->
          <div style="display:flex;flex-direction:row;align-items:center;margin-bottom:12px;">
            ${routeSvg(accent.primary)}
            <span style="color:${accent.primary};font-size:14px;font-weight:700;letter-spacing:0.3px;">${route}</span>
          </div>

          <!-- Category chip -->
          <div style="display:flex;flex-direction:row;align-items:center;margin-bottom:16px;">
            <div style="display:flex;flex-direction:row;align-items:center;background-color:${accent.chipBg};border:1px solid ${accent.chipBorder};padding:5px 14px;border-radius:9999px;">
              <div style="display:flex;width:8px;height:8px;border-radius:4px;background-color:${accent.primary};margin-right:8px;"></div>
              <span style="color:${accent.chipText};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;">
                ${category.toUpperCase()}
              </span>
            </div>
          </div>

          <!-- Service title -->
          <div style="display:flex;font-size:${title.length > 65 ? "34px" : "40px"};font-weight:800;color:#FFFFFF;line-height:1.18;letter-spacing:-0.5px;margin-bottom:22px;max-width:950px;text-shadow:0 2px 8px rgba(0,0,0,0.6);">
            ${title}
          </div>

          <!-- Includes bullets row -->
          <div style="display:flex;flex-direction:row;flex-wrap:wrap;margin-bottom:24px;gap:10px;">
            ${includes.map((inc) => `
              <div style="display:flex;flex-direction:row;align-items:center;background-color:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);padding:8px 14px;border-radius:10px;backdrop-filter:blur(2px);">
                ${checkSvg(accent.primary)}
                <span style="color:#E2E8F0;font-size:14px;font-weight:600;">${inc}</span>
              </div>
            `).join("")}
          </div>

          <!-- Price + Domain row -->
          <div style="display:flex;flex-direction:row;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.12);padding-top:18px;">

            <!-- Price block -->
            <div style="display:flex;flex-direction:row;align-items:center;">
              <div style="display:flex;flex-direction:column;background-color:${accent.priceBg};border:1.5px solid ${accent.priceBorder};padding:10px 20px;border-radius:14px;margin-right:16px;">
                <span style="color:#94A3B8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">All-Inclusive Fare</span>
                <div style="display:flex;flex-direction:row;align-items:baseline;">
                  <span style="color:${accent.primary};font-size:34px;font-weight:800;line-height:1;margin-right:8px;">${startingPrice}</span>
                  <span style="color:#CBD5E1;font-size:13px;font-weight:600;">${priceSub}</span>
                </div>
              </div>

              <!-- On-time guarantee chip -->
              <div style="display:flex;flex-direction:column;justify-content:center;background-color:rgba(16,185,129,0.12);border:1.5px solid rgba(16,185,129,0.3);padding:10px 18px;border-radius:14px;">
                <div style="display:flex;flex-direction:row;align-items:center;margin-bottom:3px;">
                  <div style="display:flex;width:8px;height:8px;border-radius:4px;background-color:#10B981;margin-right:7px;"></div>
                  <span style="color:#A7F3D0;font-size:13px;font-weight:800;">Guaranteed On-Time</span>
                </div>
                <span style="color:#6EE7B7;font-size:12px;font-weight:600;">Zero Surge • 24/7 Support</span>
              </div>
            </div>

            <!-- Domain + phone -->
            <div style="display:flex;flex-direction:column;align-items:flex-end;">
              <span style="color:#F8FAFC;font-size:18px;font-weight:800;letter-spacing:-0.2px;">kalidasstravels.in</span>
              <span style="color:#94A3B8;font-size:14px;font-weight:600;margin-top:3px;">+91 90923 03060</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Category accent bottom bar -->
      <div style="display:flex;position:absolute;bottom:0;left:0;width:1200px;height:5px;background:linear-gradient(90deg, ${accent.primary} 0%, ${accent.primary}99 50%, rgba(255,255,255,0.05) 100%);"></div>
    </div>
  `;

  const markup = html(htmlString);

  const svg = await satori(markup as any, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Plus Jakarta Sans", data: fontBoldData, style: "normal", weight: 800 },
      { name: "Plus Jakarta Sans", data: fontSemiBoldData, style: "normal", weight: 600 },
    ],
  });

  const jpeg = await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();

  return new Response(jpeg as any, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
