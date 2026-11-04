const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const width = 1000;
const height = 1000;

// Read real logo and convert to base64
const logoPath = path.join(__dirname, '..', 'public', 'images', 'logo.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoDataUri = `data:image/png;base64,${logoBase64}`;

// Material Design 3 (M3) Official Palette from brand-palette.json
// Primary: #1E252D (Executive Midnight Charcoal)
// OnSurface: #111827 (Deep Midnight Onyx Slate)
// SurfaceContainerLow: #F3F4F6 (Soft Slate Container)
// OutlineVariant: #C9CDD3 (Subtle Slate Divider Stroke)
// TextMuted: #4B5563 (Muted Slate Secondary Text)
// Red Accent: #EC221F (Brand Monogram Red)

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Subtle drop shadow for cards -->
    <filter id="m3Shadow" x="-1%" y="-1%" width="102%" height="102%">
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000000" flood-opacity="0.04" />
    </filter>
  </defs>

  <!-- Clean Letterhead Paper Base (Pure White) -->
  <rect width="1000" height="1000" fill="#ffffff" />

  <!-- Top M3 Primary Bar -->
  <rect x="0" y="0" width="1000" height="4" fill="#1E252D" />

  <!-- ========================================== -->
  <!-- ANTI-THEFT BACKGROUND WATERMARK (PROTECTION) -->
  <!-- ========================================== -->
  <!-- Centered Huge Monogram / Logo Watermark -->
  <g transform="translate(500, 500) rotate(-28) translate(-500, -500)" opacity="0.055">
    <image href="${logoDataUri}" x="150" y="320" width="700" height="123" />
    <text x="500" y="520" text-anchor="middle" font-family="'Inter', 'Roboto', 'Segoe UI', sans-serif" font-weight="900" font-size="52" fill="#111827" letter-spacing="4">KALIDASS TRAVELS</text>
    <text x="500" y="575" text-anchor="middle" font-family="'Inter', 'Roboto', 'Segoe UI', sans-serif" font-weight="700" font-size="24" fill="#111827" letter-spacing="8">OFFICIAL TARIFF &#x2022; CHENNAI</text>
    <text x="500" y="615" text-anchor="middle" font-family="'Inter', 'Roboto', 'Segoe UI', sans-serif" font-weight="600" font-size="16" fill="#111827" letter-spacing="3">DO NOT REUSE &#x2022; ALL RIGHTS RESERVED</text>
  </g>

  <!-- ========================================== -->
  <!-- 1. OFFICIAL LETTERHEAD HEADER -->
  <!-- ========================================== -->
  <!-- Company Logo (Top Left) -->
  <image href="${logoDataUri}" x="40" y="20" width="220" height="39" />
  <text x="40" y="74" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" font-weight="600" fill="#4B5563" letter-spacing="0.5">COMMERCIAL CHAUFFEUR &amp; OUTSTATION MOBILITY SERVICES</text>

  <!-- Company Letterhead Details (Top Right) -->
  <text x="960" y="28" text-anchor="end" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="13" fill="#111827">KALIDASS TRAVELS</text>
  <text x="960" y="44" text-anchor="end" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#4B5563">Medavakkam, Chennai - 600 100, Tamil Nadu</text>
  <text x="960" y="60" text-anchor="end" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#4B5563">Booking: +91 89395 39211 | Web: kalidasstravels.in</text>
  <text x="960" y="76" text-anchor="end" font-family="'Inter', 'Roboto', sans-serif" font-size="11" font-weight="600" fill="#1E252D">GSTIN Registered Commercial Transport Operator</text>

  <!-- Letterhead Divider -->
  <line x1="40" y1="88" x2="960" y2="88" stroke="#C9CDD3" stroke-width="1" />

  <!-- Document Meta Row (Ref No & Date) -->
  <text x="40" y="104" font-family="'Inter', 'Roboto', sans-serif" font-size="11" font-weight="600" fill="#6B7280">REF: KT/TN/TARIFF-2026/27</text>
  <text x="960" y="104" text-anchor="end" font-family="'Inter', 'Roboto', sans-serif" font-size="11" font-weight="600" fill="#6B7280">EFFECTIVE: 2026 &#x2013; 2027</text>

  <!-- Document Subject Title Bar (Material M3 Tone) -->
  <rect x="40" y="114" width="920" height="32" rx="4" fill="#F3F4F6" stroke="#E5E7EB" stroke-width="1" />
  <text x="500" y="135" text-anchor="middle" font-family="'Inter', 'Roboto', sans-serif" font-weight="800" font-size="13.5" fill="#111827" letter-spacing="1">COMMERCIAL PASSENGER VEHICLE TARIFF SCHEDULE &amp; RATE CARD</text>

  <!-- ========================================== -->
  <!-- 2. TABLE: OUTSTATION FLEET TARIFF -->
  <!-- ========================================== -->
  <!-- Card Container -->
  <rect x="40" y="156" width="920" height="268" rx="6" fill="#ffffff" stroke="#C9CDD3" stroke-width="1" filter="url(#m3Shadow)" />

  <!-- Section Header Bar -->
  <rect x="40" y="156" width="920" height="32" rx="6" fill="#1E252D" />
  <rect x="40" y="180" width="920" height="8" fill="#1E252D" />
  <text x="56" y="177" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#ffffff" letter-spacing="0.5">1. OUTSTATION TARIFF (ROUND TRIP &amp; ONE-WAY DROPS)</text>
  <text x="944" y="177" text-anchor="end" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#FFDCBE" font-weight="600">Min. Billing: 250 km/day (Cars) | 300 km/day (Tempo/Coach)</text>

  <!-- Table Header Row -->
  <rect x="40" y="188" width="920" height="26" fill="#F3F4F6" stroke="#E5E7EB" stroke-width="0.5" />
  <text x="56" y="205" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="11" fill="#111827">VEHICLE MODEL</text>
  <text x="270" y="205" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="11" fill="#111827">SEATS</text>
  <text x="390" y="205" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="11" fill="#111827">ROUND TRIP</text>
  <text x="540" y="205" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="11" fill="#111827">ONE-WAY DROP</text>
  <text x="720" y="205" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="11" fill="#111827">DRIVER BATA</text>
  <text x="860" y="205" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="11" fill="#111827">MIN. / DAY</text>

  <!-- Row 1: Swift Dzire -->
  <line x1="40" y1="214" x2="960" y2="214" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="56" y="238" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="13" fill="#111827">Swift Dzire / Toyota Etios</text>
  <text x="270" y="238" font-family="'Inter', 'Roboto', sans-serif" font-size="12" fill="#4B5563">4+1 AC</text>
  <text x="390" y="238" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="13.5" fill="#111827">&#x20B9;14 / km</text>
  <text x="540" y="238" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="13" fill="#111827">&#x20B9;16 / km</text>
  <text x="720" y="238" font-family="'Inter', 'Roboto', sans-serif" font-size="12.5" fill="#4B5563">&#x20B9;500 / day</text>
  <text x="860" y="238" font-family="'Inter', 'Roboto', sans-serif" font-size="12" fill="#4B5563">250 km</text>

  <!-- Row 2: Maruti Ertiga -->
  <rect x="40" y="249" width="920" height="35" fill="#FAFAFA" />
  <line x1="40" y1="249" x2="960" y2="249" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="56" y="272" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="13" fill="#111827">Maruti Ertiga</text>
  <text x="270" y="272" font-family="'Inter', 'Roboto', sans-serif" font-size="12" fill="#4B5563">6+1 AC</text>
  <text x="390" y="272" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="13.5" fill="#111827">&#x20B9;17 / km</text>
  <text x="540" y="272" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="13" fill="#111827">&#x20B9;19 / km</text>
  <text x="720" y="272" font-family="'Inter', 'Roboto', sans-serif" font-size="12.5" fill="#4B5563">&#x20B9;500 / day</text>
  <text x="860" y="272" font-family="'Inter', 'Roboto', sans-serif" font-size="12" fill="#4B5563">250 km</text>

  <!-- Row 3: Toyota Innova -->
  <line x1="40" y1="284" x2="960" y2="284" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="56" y="307" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="13" fill="#111827">Toyota Innova</text>
  <text x="270" y="307" font-family="'Inter', 'Roboto', sans-serif" font-size="12" fill="#4B5563">7+1 AC</text>
  <text x="390" y="307" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="13.5" fill="#111827">&#x20B9;20 / km</text>
  <text x="540" y="307" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="13" fill="#111827">&#x20B9;22 / km</text>
  <text x="720" y="307" font-family="'Inter', 'Roboto', sans-serif" font-size="12.5" fill="#4B5563">&#x20B9;600 / day</text>
  <text x="860" y="307" font-family="'Inter', 'Roboto', sans-serif" font-size="12" fill="#4B5563">250 km</text>

  <!-- Row 4: Toyota Innova Crysta -->
  <rect x="40" y="319" width="920" height="35" fill="#FAFAFA" />
  <line x1="40" y1="319" x2="960" y2="319" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="56" y="342" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="13" fill="#111827">Toyota Innova Crysta</text>
  <text x="270" y="342" font-family="'Inter', 'Roboto', sans-serif" font-size="12" fill="#4B5563">7+1 AC</text>
  <text x="390" y="342" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="13.5" fill="#111827">&#x20B9;22 / km</text>
  <text x="540" y="342" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="13" fill="#111827">&#x20B9;25 / km</text>
  <text x="720" y="342" font-family="'Inter', 'Roboto', sans-serif" font-size="12.5" fill="#4B5563">&#x20B9;700 / day</text>
  <text x="860" y="342" font-family="'Inter', 'Roboto', sans-serif" font-size="12" fill="#4B5563">250 km</text>

  <!-- Row 5: Tempo Traveller -->
  <line x1="40" y1="354" x2="960" y2="354" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="56" y="377" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="13" fill="#111827">Tempo Traveller (12/14 Seater)</text>
  <text x="270" y="377" font-family="'Inter', 'Roboto', sans-serif" font-size="12" fill="#4B5563">12+1 / 14+1 AC</text>
  <text x="390" y="377" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="13.5" fill="#111827">&#x20B9;24 / km</text>
  <text x="540" y="377" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="13" fill="#111827">&#x20B9;26 / km</text>
  <text x="720" y="377" font-family="'Inter', 'Roboto', sans-serif" font-size="12.5" fill="#4B5563">&#x20B9;800 / day</text>
  <text x="860" y="377" font-family="'Inter', 'Roboto', sans-serif" font-size="12" fill="#4B5563">300 km</text>

  <!-- Row 6: Force Urbania -->
  <rect x="40" y="389" width="920" height="35" fill="#FAFAFA" />
  <line x1="40" y1="389" x2="960" y2="389" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="56" y="412" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="13" fill="#111827">Force Urbania (Executive Van)</text>
  <text x="270" y="412" font-family="'Inter', 'Roboto', sans-serif" font-size="12" fill="#4B5563">16+1 Luxury AC</text>
  <text x="390" y="412" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="13.5" fill="#111827">&#x20B9;38 / km</text>
  <text x="540" y="412" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="13" fill="#111827">&#x20B9;42 / km</text>
  <text x="720" y="412" font-family="'Inter', 'Roboto', sans-serif" font-size="12.5" fill="#4B5563">&#x20B9;1,100 / day</text>
  <text x="860" y="412" font-family="'Inter', 'Roboto', sans-serif" font-size="12" fill="#4B5563">300 km</text>

  <!-- ========================================== -->
  <!-- 3. TWO COLUMNS: LOCAL & PACKAGES -->
  <!-- ========================================== -->
  <!-- Column A: Local Packages (Left) -->
  <rect x="40" y="438" width="445" height="268" rx="6" fill="#ffffff" stroke="#C9CDD3" stroke-width="1" filter="url(#m3Shadow)" />
  <rect x="40" y="438" width="445" height="30" rx="6" fill="#1E252D" />
  <rect x="40" y="460" width="445" height="8" fill="#1E252D" />
  <text x="54" y="458" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12" fill="#ffffff">2. LOCAL CHENNAI HOURLY PACKAGES</text>

  <!-- Col A Subheader -->
  <rect x="40" y="468" width="445" height="24" fill="#F3F4F6" stroke="#E5E7EB" stroke-width="0.5" />
  <text x="54" y="484" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="10.5" fill="#111827">VEHICLE</text>
  <text x="175" y="484" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="10.5" fill="#111827">4H / 40KM</text>
  <text x="275" y="484" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="10.5" fill="#111827">8H / 80KM</text>
  <text x="375" y="484" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="10.5" fill="#111827">EXTRA KM / HR</text>

  <!-- Col A Rows -->
  <line x1="40" y1="492" x2="485" y2="492" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="54" y="519" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="12" fill="#111827">Swift Dzire</text>
  <text x="175" y="519" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;1,600</text>
  <text x="275" y="519" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;2,600</text>
  <text x="375" y="519" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#4B5563">&#x20B9;15 / &#x20B9;150</text>

  <rect x="40" y="534" width="445" height="42" fill="#FAFAFA" />
  <line x1="40" y1="534" x2="485" y2="534" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="54" y="561" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="12" fill="#111827">Maruti Ertiga</text>
  <text x="175" y="561" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;2,000</text>
  <text x="275" y="561" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;3,400</text>
  <text x="375" y="561" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#4B5563">&#x20B9;17 / &#x20B9;200</text>

  <line x1="40" y1="576" x2="485" y2="576" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="54" y="603" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="12" fill="#111827">Innova Crysta</text>
  <text x="175" y="603" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;3,400</text>
  <text x="275" y="603" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;5,400</text>
  <text x="375" y="603" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#4B5563">&#x20B9;22 / &#x20B9;350</text>

  <rect x="40" y="618" width="445" height="42" fill="#FAFAFA" />
  <line x1="40" y1="618" x2="485" y2="618" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="54" y="645" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="12" fill="#111827">Tempo Traveller</text>
  <text x="175" y="645" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;4,200</text>
  <text x="275" y="645" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;6,600</text>
  <text x="375" y="645" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#4B5563">&#x20B9;24 / &#x20B9;400</text>

  <line x1="40" y1="660" x2="485" y2="660" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="54" y="687" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="12" fill="#111827">Force Urbania</text>
  <text x="175" y="687" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;6,000</text>
  <text x="275" y="687" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;11,400</text>
  <text x="375" y="687" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#4B5563">&#x20B9;38 / &#x20B9;600</text>

  <!-- Column B: Pilgrimage & Special Packages (Right) -->
  <rect x="515" y="438" width="445" height="268" rx="6" fill="#ffffff" stroke="#C9CDD3" stroke-width="1" filter="url(#m3Shadow)" />
  <rect x="515" y="438" width="445" height="30" rx="6" fill="#1E252D" />
  <rect x="515" y="460" width="445" height="8" fill="#1E252D" />
  <text x="529" y="458" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12" fill="#ffffff">3. FIXED TOUR PACKAGES &amp; CHAUFFEUR SERVICES</text>

  <!-- Col B Subheader -->
  <rect x="515" y="468" width="445" height="24" fill="#F3F4F6" stroke="#E5E7EB" stroke-width="0.5" />
  <text x="529" y="484" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="10.5" fill="#111827">SERVICE / SECTOR</text>
  <text x="800" y="484" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="10.5" fill="#111827">STANDARD RATE</text>

  <!-- Col B Rows -->
  <line x1="515" y1="492" x2="960" y2="492" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="529" y="519" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="12" fill="#111827">Tirupati Balaji Darshan (Same Day)</text>
  <text x="800" y="519" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;6,000 (Sedan)</text>

  <rect x="515" y="534" width="445" height="42" fill="#FAFAFA" />
  <line x1="515" y1="534" x2="960" y2="534" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="529" y="561" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="12" fill="#111827">Thiruvannamalai Girivalam Tour</text>
  <text x="800" y="561" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;6,500 (Sedan)</text>

  <line x1="515" y1="576" x2="960" y2="576" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="529" y="603" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="12" fill="#111827">Pondicherry Heritage 1-Day Tour</text>
  <text x="800" y="603" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;4,500 (Sedan)</text>

  <rect x="515" y="618" width="445" height="42" fill="#FAFAFA" />
  <line x1="515" y1="618" x2="960" y2="618" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="529" y="645" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="12" fill="#111827">Chennai Airport Transfer (Pickup/Drop)</text>
  <text x="800" y="645" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">From &#x20B9;650 (Sedan)</text>

  <line x1="515" y1="660" x2="960" y2="660" stroke="#E5E7EB" stroke-width="0.75" />
  <text x="529" y="687" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="12" fill="#111827">Acting Driver Service (Own Car)</text>
  <text x="800" y="687" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12.5" fill="#111827">&#x20B9;750 (4h) / &#x20B9;1,200 (8h)</text>

  <!-- ========================================== -->
  <!-- 4. OFFICIAL COMMERCIAL TERMS (LETTERPAD) -->
  <!-- ========================================== -->
  <rect x="40" y="720" width="920" height="135" rx="6" fill="#F9FAFB" stroke="#C9CDD3" stroke-width="1" />
  <text x="56" y="742" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12" fill="#111827" letter-spacing="0.5">COMMERCIAL BILLING POLICIES &amp; STATUTORY TERMS:</text>

  <text x="56" y="764" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#111827">1. <tspan font-weight="600">Computation Basis:</tspan> All kilometres and hours are calculated strictly from our operating garage back to garage.</text>
  <text x="56" y="784" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#111827">2. <tspan font-weight="600">Toll &amp; Parking:</tspan> FASTag toll charges, parking slips, and inter-state permit charges payable at actuals with valid receipts.</text>
  <text x="56" y="804" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#111827">3. <tspan font-weight="600">Booking Confirmation:</tspan> A standard advance deposit of &#x20B9;500 is required to confirm vehicle dispatch, 100% adjusted in final bill.</text>
  <text x="56" y="824" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#111827">4. <tspan font-weight="600">Driver Allowance:</tspan> Driver bata covers boarding/lodging. Night driving allowance applies between 10:00 PM and 06:00 AM.</text>
  <text x="56" y="844" font-family="'Inter', 'Roboto', sans-serif" font-size="11.5" fill="#111827">5. <tspan font-weight="600">Tax Invoicing:</tspan> GST compliant corporate and retail tax invoices issued for all completed trips upon request.</text>

  <!-- ========================================== -->
  <!-- 5. SIGNATORY, SEAL & LETTERPAD FOOTER -->
  <!-- ========================================== -->
  <line x1="40" y1="870" x2="960" y2="870" stroke="#C9CDD3" stroke-width="1" />

  <!-- Left Footer: Contact & Web -->
  <text x="40" y="896" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="13" fill="#111827">KALIDASS TRAVELS</text>
  <text x="40" y="914" font-family="'Inter', 'Roboto', sans-serif" font-size="11" fill="#4B5563">Head Office: No. 1/164, BHEL Nagar, Medavakkam, Chennai - 600 100</text>
  <text x="40" y="930" font-family="'Inter', 'Roboto', sans-serif" font-size="11" fill="#4B5563">Central Dispatch: +91 89395 39211 | Direct Web: https://kalidasstravels.in</text>
  <text x="40" y="946" font-family="'Inter', 'Roboto', sans-serif" font-size="10.5" fill="#6B7280">&#x24B8; 2026 Kalidass Travels. Confidential Commercial Tariff Sheet. All Rights Reserved.</text>

  <!-- Center: Authentic Company Round Seal Stamp -->
  <g transform="translate(630, 924)">
    <circle cx="0" cy="0" r="42" fill="none" stroke="#1E252D" stroke-width="1.75" stroke-dasharray="4,2" />
    <circle cx="0" cy="0" r="38" fill="none" stroke="#1E252D" stroke-width="1" />
    <text x="0" y="-20" text-anchor="middle" font-family="'Inter', 'Roboto', sans-serif" font-weight="800" font-size="7.5" fill="#1E252D" letter-spacing="1.5">KALIDASS TRAVELS</text>
    <line x1="-28" y1="-12" x2="28" y2="-12" stroke="#1E252D" stroke-width="0.75" />
    <text x="0" y="-1" text-anchor="middle" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="8.5" fill="#1E252D">CHENNAI</text>
    <text x="0" y="10" text-anchor="middle" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="6.5" fill="#1E252D">OFFICIAL SEAL</text>
    <line x1="-28" y1="16" x2="28" y2="16" stroke="#1E252D" stroke-width="0.75" />
    <text x="0" y="27" text-anchor="middle" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="7" fill="#1E252D" letter-spacing="1">TAMIL NADU</text>
  </g>

  <!-- Right: Authorized Signatory Block -->
  <text x="960" y="896" text-anchor="end" font-family="'Inter', 'Roboto', sans-serif" font-weight="700" font-size="12" fill="#111827">For KALIDASS TRAVELS</text>
  <!-- Signature line -->
  <line x1="770" y1="945" x2="960" y2="945" stroke="#111827" stroke-width="1" />
  <text x="960" y="960" text-anchor="end" font-family="'Inter', 'Roboto', sans-serif" font-weight="600" font-size="11" fill="#4B5563">Authorized Signatory</text>
</svg>
`;

async function generate() {
  const publicDir = path.join(__dirname, '..', 'public', 'images');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPathPublic = path.join(publicDir, 'kalidass-travels-rate-card-1000x1000.png');
  const outputPathRoot = path.join(__dirname, '..', 'kalidass-travels-rate-card-1000x1000.png');
  const desktopPath = path.join('C:', 'Users', 'spoll', 'Desktop', 'kalidass-travels-rate-card-1000x1000.png');

  // Convert SVG to PNG at exact 1000x1000 pixels
  const buffer = Buffer.from(svg.trim());
  await sharp(buffer)
    .resize(1000, 1000)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPathPublic);

  // Copy to root and Desktop
  fs.copyFileSync(outputPathPublic, outputPathRoot);
  try {
    fs.copyFileSync(outputPathPublic, desktopPath);
    console.log('Copied to Desktop:', desktopPath);
  } catch (e) {
    console.warn('Could not copy to Desktop:', e.message);
  }

  console.log('Successfully generated:');
  console.log('1.', outputPathPublic);
  console.log('2.', outputPathRoot);
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
