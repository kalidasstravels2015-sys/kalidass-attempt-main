const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const width = 1000;
const height = 1000;

// Read real logo and convert to base64
const logoPath = path.join(__dirname, '..', 'public', 'images', 'logo.png');
let logoDataUri = '';
if (fs.existsSync(logoPath)) {
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  logoDataUri = `data:image/png;base64,${logoBase64}`;
}

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="60%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="festiveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b45309" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="cardShadow" x="-2%" y="-2%" width="104%" height="106%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.08" />
    </filter>
  </defs>

  <!-- Clean Background -->
  <rect width="1000" height="1000" fill="#f8fafc" />

  <!-- Top Festive Ribbon -->
  <rect x="0" y="0" width="1000" height="10" fill="url(#festiveGrad)" />

  <!-- ================= HEADER SECTION ================= -->
  <g transform="translate(60, 40)">
    ${logoDataUri ? `<image href="${logoDataUri}" x="0" y="5" width="220" height="48" preserveAspectRatio="xMinYMid meet" />` : ''}
    <text x="880" y="28" text-anchor="end" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="16" fill="#0f172a">KALIDASS TRAVELS</text>
    <text x="880" y="48" text-anchor="end" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="13" fill="#64748b">Est. 2015 &#x2022; Medavakkam, Chennai</text>
  </g>

  <!-- Divider -->
  <line x1="60" y1="105" x2="940" y2="105" stroke="#e2e8f0" stroke-width="1.5" />

  <!-- ================= HERO FESTIVE BANNER ================= -->
  <g transform="translate(60, 125)">
    <rect width="880" height="150" rx="16" fill="url(#headerGrad)" />
    
    <!-- Badge -->
    <rect x="30" y="24" width="220" height="26" rx="13" fill="#f59e0b" />
    <text x="140" y="41" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="800" font-size="12" fill="#000000" letter-spacing="1">DIWALI SPECIAL 2026</text>
    
    <text x="30" y="85" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="28" fill="#ffffff">
      Going Home in Your Own Car?
    </text>
    <text x="30" y="115" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="16" fill="#94a3b8">
      Skip the stressful 10-hour highway traffic. Relax with family while our verified pilot drives.
    </text>
    
    <rect x="670" y="35" width="180" height="80" rx="12" fill="#334155" />
    <text x="760" y="65" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="600" font-size="12" fill="#cbd5e1">STARTING FROM</text>
    <text x="760" y="98" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="28" fill="#38bdf8">&#x20B9;1,400<tspan font-size="14" font-weight="500" fill="#94a3b8">/day</tspan></text>
  </g>

  <!-- ================= TARIFF CARDS (3 COLUMNS) ================= -->
  <g transform="translate(60, 305)">
    <text x="0" y="0" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="800" font-size="18" fill="#0f172a" letter-spacing="0.5">
      TRANSPARENT OUTSTATION RATES (YOUR CAR)
    </text>
    <text x="0" y="22" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="400" font-size="13" fill="#64748b">
      Fixed per-day driver bata &#x2022; Up to 14 duty hours per calendar day
    </text>
  </g>

  <!-- Card 1: Hatchback & Sedan -->
  <g transform="translate(60, 345)" filter="url(#cardShadow)">
    <rect width="275" height="235" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
    <rect x="0" y="0" width="275" height="6" rx="3" fill="#0284c7" />
    <text x="24" y="38" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="16" fill="#0f172a">Hatchback &amp; Sedan</text>
    <text x="24" y="58" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="12" fill="#64748b">Dzire, Etios, Honda City, Verna</text>
    
    <line x1="24" y1="75" x2="251" y2="75" stroke="#f1f5f9" stroke-width="1.5" />
    
    <text x="24" y="115" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="34" fill="#0f172a">&#x20B9;1,400</text>
    <text x="155" y="115" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="13" fill="#64748b">/ day</text>
    
    <circle cx="32" cy="150" r="4" fill="#0284c7" />
    <text x="44" y="154" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="12" fill="#334155">Manual &amp; Automatic cars</text>
    
    <circle cx="32" cy="176" r="4" fill="#0284c7" />
    <text x="44" y="180" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="12" fill="#334155">Doorstep pickup in Chennai</text>
    
    <rect x="24" y="195" width="227" height="26" rx="6" fill="#f0f9ff" />
    <text x="137" y="212" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="11" fill="#0369a1">4 Days Total: &#x20B9;5,600</text>
  </g>

  <!-- Card 2: Compact SUV & MPV -->
  <g transform="translate(362, 345)" filter="url(#cardShadow)">
    <rect width="275" height="235" rx="14" fill="#ffffff" stroke="#f59e0b" stroke-width="2" />
    <rect x="0" y="0" width="275" height="6" rx="3" fill="#f59e0b" />
    
    <rect x="175" y="16" width="85" height="20" rx="10" fill="#fef3c7" />
    <text x="217" y="30" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="800" font-size="9" fill="#92400e">MOST POPULAR</text>

    <text x="24" y="38" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="16" fill="#0f172a">Compact SUV / MPV</text>
    <text x="24" y="58" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="12" fill="#64748b">Creta, Ertiga, Seltos, Carens</text>
    
    <line x1="24" y1="75" x2="251" y2="75" stroke="#f1f5f9" stroke-width="1.5" />
    
    <text x="24" y="115" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="34" fill="#0f172a">&#x20B9;1,500</text>
    <text x="155" y="115" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="13" fill="#64748b">/ day</text>
    
    <circle cx="32" cy="150" r="4" fill="#f59e0b" />
    <text x="44" y="154" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="12" fill="#334155">Highway toll &amp; night expert</text>
    
    <circle cx="32" cy="176" r="4" fill="#f59e0b" />
    <text x="44" y="180" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="12" fill="#334155">Smooth family drive</text>
    
    <rect x="24" y="195" width="227" height="26" rx="6" fill="#fffbeb" />
    <text x="137" y="212" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="11" fill="#b45309">4 Days Total: &#x20B9;6,000</text>
  </g>

  <!-- Card 3: Premium SUV / MPV -->
  <g transform="translate(665, 345)" filter="url(#cardShadow)">
    <rect width="275" height="235" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
    <rect x="0" y="0" width="275" height="6" rx="3" fill="#6366f1" />
    <text x="24" y="38" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="16" fill="#0f172a">Premium SUV / MPV</text>
    <text x="24" y="58" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="12" fill="#64748b">Innova Crysta, Fortuner, XUV</text>
    
    <line x1="24" y1="75" x2="251" y2="75" stroke="#f1f5f9" stroke-width="1.5" />
    
    <text x="24" y="115" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="34" fill="#0f172a">&#x20B9;1,600</text>
    <text x="155" y="115" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="13" fill="#64748b">/ day</text>
    
    <circle cx="32" cy="150" r="4" fill="#6366f1" />
    <text x="44" y="154" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="12" fill="#334155">Experienced with heavy SUVs</text>
    
    <circle cx="32" cy="176" r="4" fill="#6366f1" />
    <text x="44" y="180" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="500" font-size="12" fill="#334155">Senior citizen safe handling</text>
    
    <rect x="24" y="195" width="227" height="26" rx="6" fill="#eef2ff" />
    <text x="137" y="212" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="11" fill="#4338ca">4 Days Total: &#x20B9;6,400</text>
  </g>

  <!-- ================= TRUST & WHY BOOK SECTION ================= -->
  <g transform="translate(60, 615)">
    <rect width="880" height="155" rx="14" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" />
    
    <!-- Feature 1 -->
    <g transform="translate(30, 25)">
      <rect width="40" height="40" rx="8" fill="#dbeafe" />
      <text x="20" y="26" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="18" fill="#1d4ed8">&#x2713;</text>
      <text x="52" y="22" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="14" fill="#0f172a">Verified Highway Drivers</text>
      <text x="52" y="42" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="400" font-size="12" fill="#64748b">Police verified, 8+ yrs highway exp</text>
    </g>

    <!-- Feature 2 -->
    <g transform="translate(460, 25)">
      <rect width="40" height="40" rx="8" fill="#fef3c7" />
      <text x="20" y="26" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="18" fill="#b45309">&#x2713;</text>
      <text x="52" y="22" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="14" fill="#0f172a">Manual &amp; Automatic Expert</text>
      <text x="52" y="42" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="400" font-size="12" fill="#64748b">Trained on CVT, DCT, AMT &amp; EVs</text>
    </g>

    <!-- Feature 3 -->
    <g transform="translate(30, 90)">
      <rect width="40" height="40" rx="8" fill="#dcfce7" />
      <text x="20" y="26" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="18" fill="#15803d">&#x2713;</text>
      <text x="52" y="22" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="14" fill="#0f172a">No Peak-Hour Surge</text>
      <text x="52" y="42" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="400" font-size="12" fill="#64748b">Fixed daily rate. No hidden charges</text>
    </g>

    <!-- Feature 4 -->
    <g transform="translate(460, 90)">
      <rect width="40" height="40" rx="8" fill="#ede9fe" />
      <text x="20" y="26" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="900" font-size="18" fill="#6d28d9">&#x2713;</text>
      <text x="52" y="22" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="700" font-size="14" fill="#0f172a">Lock With Just &#x20B9;500</text>
      <text x="52" y="42" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="400" font-size="12" fill="#64748b">Pay balance directly at trip end</text>
    </g>
  </g>

  <!-- ================= BOTTOM ACTION / CONTACT BAR ================= -->
  <g transform="translate(60, 800)">
    <rect width="880" height="150" rx="16" fill="#0f172a" />
    
    <text x="40" y="50" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="800" font-size="22" fill="#ffffff">
      Lock Your Diwali Highway Driver Now
    </text>
    <text x="40" y="76" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="400" font-size="14" fill="#94a3b8">
      Limited slots for Nov 6 (Fri) to Nov 9 (Mon). Reporting anywhere in Chennai.
    </text>
    
    <!-- Phone / WhatsApp Button -->
    <g transform="translate(40, 95)">
      <rect width="450" height="40" rx="8" fill="#22c55e" />
      <text x="225" y="26" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="800" font-size="16" fill="#ffffff">
        &#x260E; CALL / WHATSAPP: +91 89395 39211
      </text>
    </g>
    
    <text x="840" y="120" text-anchor="end" font-family="'Inter', 'Segoe UI', sans-serif" font-weight="600" font-size="13" fill="#cbd5e1">
      Food: &#x20B9;300/day &#x2022; Stay: &#x20B9;300/night
    </text>
  </g>
</svg>
`;

async function run() {
  const outputPath = path.join(__dirname, '..', 'public', 'images', 'kalidass-diwali-acting-driver-1000x1000.png');
  const rootOutputPath = path.join(__dirname, '..', 'kalidass-diwali-acting-driver-1000x1000.png');
  
  await sharp(Buffer.from(svg))
    .png({ quality: 100 })
    .toFile(outputPath);

  fs.copyFileSync(outputPath, rootOutputPath);
  console.log('Successfully generated:', outputPath);
}

run().catch(console.error);
