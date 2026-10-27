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
  - Brand Logo Red (`#EC221F` / `text-logo-red`) is **strictly reserved** for the Kalidass "K" logo mark only.
  - **HARD PROHIBITION:** Do **NEVER** use red for price amounts, fare cards, CTA buttons, live status pulse indicators, or standard headings.
- **Rule 2.1.2 (Fare & Rate Presentation):**
  - All fares, estimates, prices, and rates must be rendered in crisp **Midnight Onyx Slate** (`#1A1C1E` / `text-m3-on-surface` or `#111827`).
- **Rule 2.1.3 (Primary Action Elements):**
  - Primary buttons and active selection pills must use Google Material 3 Sapphire Blue (`#0B57D0` / `bg-m3-primary`) with white text (`text-m3-on-primary`).
- **Rule 2.1.4 (Neutral Badges & Chips Governance):**
  - All vehicle category tags (`BEST VALUE SEDAN`), service category pills, and feature chips must use **Google M3 Assist Chips** (neutral container `bg-m3-surface-container-high`, dark slate text `text-m3-on-surface-variant`, and subtle outline `border-m3-outline-variant`).
  - Multi-color badge pollution (arbitrary amber, orange, purple, green chips) is strictly prohibited. Warm Golden Amber is reserved exclusively for numerical 5-star ratings.
- **Rule 2.1.5 (Single Accent Per Card):**
  - Fleet cards, tariff cards, and tour cards must have **only ONE accent color**: the Google Sapphire Blue CTA button (`#0B57D0`). Inclusions like "Fixed Per-KM Rates", passenger counts, and luggage specs must remain calm neutral slate (`text-m3-on-surface-variant`).
- **Rule 2.1.6 (No Multi-Color Buttons):**
  - Primary blue buttons must strictly use white text and white icons. Never place green (`text-m3-success`) arrows or icons inside a blue action button.

### 2.2 Typography & Icon Standards
- **Rule 2.2.1 (Google M3 15-Role Typescale):** Use only pre-configured Tailwind M3 typography classes (`text-m3-display-l`, `text-m3-headline-m`, `text-m3-body-l`, `text-m3-label-m`, etc.). Do not write arbitrary inline font sizes.
- **Rule 2.2.2 (Vector SVG Icon Standardization):** Always use **Lucide React** (`lucide-react`) vector SVG icons or native inline SVGs across all `.astro`, `.jsx`, and `.tsx` pages/components. NEVER use `<span class="material-symbols-outlined">...</span>` on new or modified pages; the local font is a 5.6 KB subset containing only ~12 glyphs for homepage LCP, causing glyphs outside the subset to render as clipped 1em raw text fragments (`d`, `t`, `h`). Always provide an accessible `aria-label` or `aria-hidden="true"` on interactive/decorative icon elements.

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
- **Rule 3.1.4 (Tolls & State Permits for Outstation Trips):**
  - Web quotations for open per-km outstation trips represent Base Fare + Driver Bata. Toll fees, parking fees, and interstate border entry permits (Andhra Pradesh, Karnataka, Pondicherry) are transparently billed at actuals.
- **Rule 3.1.5 (The 1-Day Toll Invariant):**
  - Highway FASTag tolls and statutory state entry permits are pre-included upfront for **1-Day fixed tour packages ONLY** (e.g. Tirupati 1-Day, Thiruvannamalai 1-Day, Kanchipuram 1-Day, Pondicherry 1-Day, Vellore 1-Day, Chidambaram 1-Day, Mahabalipuram 1-Day).
  - For ALL multi-day packages (>1 Day, e.g. 2-Day, 3-Day, Kumbakonam Navagraha, Rameswaram, Sabarimala) and open per-km outstation rentals, tolls, parking, and state entry permits are strictly payable at actuals by the passenger as per official FASTag receipts.
  - Zero multi-day package cards, stay dropdowns, FAQs, or SEO descriptions may claim tolls or permits are pre-included.

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

---

## 7. Modern Web Platform & Baseline Standards

- **Rule 7.1.1 (Baseline Support Target):** This project's browser compatibility target is **Baseline 2024 with progressive enhancement fallbacks**. Widely available features are used without polyfills; newly available or limited features must implement progressive enhancement or lightweight fallbacks.
- **Rule 7.1.2 (Modern Web Guidance Integration):** Always consult Chrome's Modern Web Guidance (`.agents/skills/modern-web-guidance`) before implementing UI overlays, forms, animations, or performance features:
  - **Modals & Dialogs:** Use native `<dialog>` with `closedby="any"` (backed by click boundary coordinate fallbacks for non-supporting browsers) and `@starting-style` + `transition-behavior: allow-discrete` for zero-JS top-layer entry/exit animations.
  - **Tooltips & Popovers:** Prefer native `popover` API and CSS Anchor Positioning over third-party popper libraries.
  - **Accordions & Disclosures:** Use native `<details name="...">` for exclusive accessible accordions without custom JavaScript toggle state.
  - **Forms & Inputs:** Use `:user-invalid` for post-interaction validation cues and `field-sizing: content` for adaptive multi-line textareas.
  - **Core Web Vitals:** Always declare `fetchpriority="high"`, explicit dimensions/`aspect-ratio`, and `decoding="async"` on above-the-fold hero images to guarantee 0.000 CLS and rapid LCP.

---

## 8. Service & Tour Page UX Standards

### 8.1 Tariff Cards & Specs Hierarchy
- **Rule 8.1.1 (Core Specs Below Vehicle Name):** Below the vehicle name, display **only** the passenger count and baggage count in prominent, increased font size (`text-xs sm:text-sm font-semibold`) using `Users` and `Luggage` icons (e.g., `[ 👥 4 Passengers ] [ 🧳 2 Bags ]`). Do not clutter this space with generic feature lists ("Chilled AC", "Dedicated Trunk").
- **Rule 8.1.2 (No Duplicate Pills):** Do not repeat seating capacity in the card's top badge row if it is already displayed prominently below the vehicle name.
- **Rule 8.1.3 (In-Card Multi-Day / Stay Dropdowns):** When a service supports multiple durations (e.g. 1 Day Return vs 2 Days Overnight), embed the duration selector directly inside the vehicle tariff card (`.tirupati-stay-select`). Selecting an option must immediately update the card's price, driver stay & food inclusions, and WhatsApp enquiry URL with zero latency. Never create detached, standalone calculator forms when tariff cards already exist.
- **Rule 8.1.4 (Single Authoritative Summary / Zero Duplicate Fact Strips):** Never stack generic hero summary strips (`Pickup Location`, `Trip Duration`, `Tolls & Permits`) on pages with dedicated `Route & Fare Summary` cards. Key logistical facts (Distance, Travel Time, Starting Fare, Tolls & Permits) must appear in exactly one authoritative location on the page. The 4-item hero summary grid is restricted to operational services (`!isTour`) like Acting Drivers and Corporate Mobility where dispatch SLAs and transmission types are needed.

### 8.2 Terminology & Copy Invariants
- **Rule 8.2.1 (Seating Terminology):** Always use universal seating capacity terminology (`"4 Passengers"`, `"6 Passengers"`, etc.). Never use `"Devotees"` or `"Pilgrims"` for vehicle capacity.
- **Rule 8.2.2 (Alternative Duration Phrasing):** Always use natural disjunctive phrasing (`"1 or 2 Days"`, not `"1 & 2 Days"`) in titles, meta tags, and CTAs when presenting trip duration alternatives.

### 8.3 Content Scannability & Tour Guides
- **Rule 8.3.1 (Static Multi-Card Grid over Hidden Tabs):** Travel guides, route timelines, and pilgrimage tips must be rendered as a static, responsive 4-card grid. Never hide crucial guidelines behind interactive tabs.
- **Rule 8.3.2 (Zero Paragraphs / Bite-Sized Micro-Cards):** Never use dense narrative prose or multi-line paragraphs in travel guides, route summaries, or feature cards. Mobile users scan and do not read paragraphs. All guide points, traditions, and service features must be structured as bite-sized micro-cards or chips with a bold title (2–3 words) and a concise descriptor (3–5 words).
- **Rule 8.3.3 (Unboxed Transit Stepper):** Never render duplicate horizontal waypoint pill chains above vertical timelines ("overkill"). Use a single, unboxed vertical transit stepper (Google Maps Transit style) with continuous lines and mini circular node numbers to conserve vertical screen space.

### 8.4 Popups & Floating Contact Action
- **Rule 8.4.1 (Popup Hides Floating Call Button):** The floating Call shortcut (`FloatingActions.astro`: `#floating-actions-container` circular 56dp FAB) must be hidden whenever any popup, modal, or bottom sheet is open — popups already contain their own enquiry CTA.
- **Rule 8.4.2 (Mechanism):** Native `<dialog>` via `showModal()` is hidden automatically (`html:has(dialog:modal)` in `Layout.astro`). Custom overlays must add `data-hide-contact-dock` to their root element. Never match on `[aria-modal]` (the nav drawer keeps it permanently).
- **Rule 8.4.3 (No Trapped Overlays):** Never render a `fixed` popup inside a parent that creates a stacking context (`relative z-*`, `transform`, `filter`). Use native `<dialog>` or a React portal to `document.body`. Regression test: `tests/contact_dock_overlay.spec.js`.

### 8.5 WhatsApp CTA Standardization
- **Rule 8.5.1 (Standardized Component):** All WhatsApp buttons across `.astro` and `.jsx` components must use the shared `<WhatsAppButton>` component (`src/components/WhatsAppButton.astro` or `src/components/react/WhatsAppButton.jsx`).
- **Rule 8.5.2 (Tonal Mint Theme):** In-card WhatsApp CTAs must use M3 Tonal Mint styling (`variant="filled"` or `variant="tonal"`, `bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300/80`). Raw bright `#25D366` green background blocks on in-card buttons are strictly prohibited.
- **Rule 8.5.3 (Single Source URL Builder):** WhatsApp URLs must always be generated via `buildWhatsAppUrl(message)` from `src/utils/whatsapp.ts`. Never hardcode `https://wa.me/918939539211` directly in templates.

### 8.6 Functional Desk Architecture & Zero Personal Names (RACI Governance)
- **Rule 8.6.1 (Zero Personal Names Invariant):** NEVER hardcode or display personal names (e.g. "Karthik", "Suresh", "One Person") in internal operations UI, buttons, documentation, schemas, or customer-facing messages.
- **Rule 8.6.2 (Institutional Functional Desks):** Operations must be compartmentalized into institutional desks with clear RACI accountability:
  1. **Dispatch Controller** (Accountable for booking intake, capacity validation, initial KYC collection).
  2. **Pilgrimage Ticketing Desk** (Responsible for quota procurement, slot lock-in, SLA: 120-minute turnaround).
  3. **Fleet Operations Supervisor** (Responsible for chauffeur vetting, duty slip issuance, vehicle dispatch).
  4. **Designated Chauffeur** (Responsible for transit punctuality, on-road safety, cash collection).
  5. **Settlement & Audit Desk** (Accountable for trip closeout, toll reconciliation, margin verification).
- **Rule 8.6.3 (Action Buttons & Copy):** 
  - UI action buttons must display `[📋 Ticketing Desk]` (never personal names).
  - Customer messages must refer to `"Our Pilgrimage Ticketing Desk"` under statutory guidelines.
  - Procurement dossiers must state the formal desk title and enforce the 120-minute SLA requirement.

---

## 9. Paid Advertising & Acquisition Standards

### 9.1 Call-First Strategy for MAA Airport to Outstation Corridors
- **Rule 9.1.1 (Search Phone Call Over Landing Page Clicks for Outstation Transfers):** For high-ticket Chennai Airport (MAA) to Outstation transfers (Vellore CMC/VIT, Pondicherry/Auroville, Tirupati Balaji, Kumbakonam — ₹2,500 to ₹8,000+), do not run standard search text ads driving to landing page URLs. Visitors bounce after burning budget (₹1,000 burned with zero success across web search clicks).
- **Rule 9.1.2 (Direct Call Ads Mandate):** Paid Google Ads for MAA to Outstation transit must utilize **Call-Only Campaigns** routing directly to `+91 89395 39211`. Outstation travelers landing with families, heavy luggage, or medical patients convert through direct telephone coordination with the Dispatch Controller.


