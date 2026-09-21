# Engineering, UX & Operational Rules
## Project: Kalidass Travels
**Document Version:** 1.0.0  
**Status:** Mandatory Coding & Operational Standards  
**Scope:** All Developers, Designers, Content Editors, and Operations Dispatchers  

---

## 1. Architectural & Coding Rules

### 1.1 Astro vs. React Island Policy
- **Rule 1.1.1 (Static-First):** Always build components as native `.astro` files by default. Static content, cards, headers, footers, and SEO metadata must NEVER be written in React.
- **Rule 1.1.2 (Strict Island Isolation):** Use React (`.jsx` / `.tsx`) ONLY when interactive client-side state is strictly necessary (e.g., `QuotationEngine.jsx`, dynamic carousels, modal controllers, location pin picker).
- **Rule 1.1.3 (Hydration Directives):**
  - Never use `client:load` unless the element is above-the-fold and demands instant interactivity on page load.
  - Use `client:idle` for priority interactive widgets below the hero (e.g., `<QuotationEngine client:idle />`).
  - Use `client:visible` for carousels and lower-fold interactive sections (e.g., `<PartnersCarousel client:visible />`, `<DriversCarousel client:visible />`).

### 1.2 Asset & Bundle Management
- **Rule 1.2.1 (WebP Only):** All raster images stored in `public/images/` must be formatted as `.webp`. Uncompressed PNG or JPEG files are forbidden in production builds.
- **Rule 1.2.2 (Image Dimensions):** Always declare explicit `width` and `height` attributes (or `aspect-ratio` CSS classes) on every `<img>` tag to guarantee **0.000 Cumulative Layout Shift (CLS)**.
- **Rule 1.2.3 (Third-Party Script Isolation):** All external marketing tags or heavy analytics scripts must be executed inside Partytown web workers (`type="text/partytown"`) to keep the browser main thread free.

---

## 2. Google Material Design 3 (M3) Styling Rules

### 2.1 Color Palette Governance
- **Rule 2.1.1 (Brand Red Boundary):**
  - Brand Logo Red (`#EC221F` / `text-logo-red`) is **strictly reserved** for the Kalidass "K" logo mark and small live status pulse pips (e.g., green/red availability dots).
  - **HARD PROHIBITION:** Do **NEVER** use red for price amounts, fare cards, CTA buttons, or standard headings.
- **Rule 2.1.2 (Fare & Rate Presentation):**
  - All fares, estimates, prices, and rates must be rendered in crisp **Midnight Onyx Slate** (`#1A1C1E` / `text-m3-on-surface` or `#111827`).
- **Rule 2.1.3 (Primary Action Elements):**
  - Primary buttons and active selection pills must use Executive Midnight Charcoal (`#1E252D` / `bg-m3-primary`) with white text (`text-m3-on-primary`).
- **Rule 2.1.4 (Secondary & Tertiary Accents):**
  - Use Slate Steel (`#475467`) for secondary badges and outline borders.
  - Use Warm Golden Amber (`#6D5E0F` / `#F8E287`) exclusively for star ratings, review badges, and pilgrimage travel highlights.

### 2.2 Typography & Icon Standards
- **Rule 2.2.1 (Google M3 15-Role Typescale):** Use only pre-configured Tailwind M3 typography classes (`text-m3-display-l`, `text-m3-headline-m`, `text-m3-body-l`, `text-m3-label-m`, etc.). Do not write arbitrary inline font sizes.
- **Rule 2.2.2 (Icon Uniformity):** Use **Google Material Symbols Outlined** or **Lucide React** icons. Always provide an accessible `aria-label` or `aria-hidden="true"` on every icon element.

---

## 3. Pricing, Tariff & Business Logic Rules

### 3.1 Outstation Billing Rules
- **Rule 3.1.1 (Minimum Distance Thresholds):**
  - Sedan / Hatchback / SUV (Dzire, Etios, Ertiga, Innova): Minimum billing of **250 km/day** for round trips.
  - Innova Crysta & Tempo Traveller: Minimum billing of **300 km/day** for round trips.
  - Outstation One-Way Drop: Minimum billing of **130 km** for cars; **250 km** for Tempo Traveller.
- **Rule 3.1.2 (Driver Bata Standard):**
  - Swift Dzire / Toyota Etios: ₹300 per calendar day.
  - Maruti Ertiga: ₹400 per calendar day.
  - Toyota Innova: ₹500 per calendar day.
  - Toyota Innova Crysta: ₹600 per calendar day.
  - Tempo Traveller: ₹800 per calendar day.
  - Round trips spanning beyond midnight incur an additional day's Bata.
- **Rule 3.1.3 (Night Allowance):**
  - Night driving charge (+₹150 to +₹200) applies automatically for journeys operating between **10:00 PM and 5:00 AM**.
- **Rule 3.1.4 (Tolls & State Permits):**
  - Web quotations represent Base Fare + Driver Bata. Toll fees, parking fees, and interstate border entry permits (Andhra Pradesh, Karnataka, Pondicherry) are transparently billed at actuals.

---

## 4. Quality Assurance & Performance Gates

### 4.1 Continuous Integration & Lighthouse Thresholds
- **Rule 4.1.1 (Lighthouse Performance Score):**
  - Desktop Performance: $\ge 95/100$.
  - Mobile Performance: $\ge 90/100$.
  - SEO Score: $100/100$ on all indexable routes.
  - Accessibility Score: $\ge 96/100$.
- **Rule 4.1.2 (Zero Console Errors):** Production builds must emit zero unhandled JavaScript exceptions, network 404s, or syntax warnings in the browser DevTools console.
- **Rule 4.1.3 (Playwright Automated Testing):** All critical conversion paths (Form submit, WhatsApp deep-link generation, Tariff calculator) must pass the Playwright test suite (`npm run test:e2e`) before merging code.

---

## 5. SEO & Content Integrity Rules

- **Rule 5.1.1 (Single H1 Tag):** Every page must contain exactly one `<h1>` tag clearly defining the primary page intent and local geography (e.g., *"Best Taxi, Outstation Cabs & Temple Tours in Chennai"*).
- **Rule 5.1.2 (Trailing Slash Consistency):** All URLs must enforce a trailing slash (`trailingSlash: 'always'`) in accordance with `astro.config.mjs` to prevent duplicate indexing penalties.
- **Rule 5.1.3 (Structured Data Validation):** Every new service page must provide valid Schema.org JSON-LD structured data (`TaxiService`, `LocalBusiness`, or `FAQPage`) validated via Google Rich Results Test.
- **Rule 5.1.4 (Canonical URLs):** Every page must define a strict canonical URL pointing to `https://kalidasstravels.in/...`.

---

## 6. Privacy & Data Handling Rules

- **Rule 6.1.1 (Zero PII Exposure):** Passenger phone numbers and pickup addresses must never be logged to public analytics endpoints, console logs, or client-side storage.
- **Rule 6.1.2 (DPDP Act Compliance):** User details collected via the booking panel are strictly utilized for trip fulfillment and emergency customer communication. No resale or third-party marketing sharing is permitted.
