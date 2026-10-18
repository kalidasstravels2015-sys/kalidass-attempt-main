# Technical Architecture, Schema & Google M3 Audit Report
**Project:** Kalidass Travels (`kalidasstravels.in`)  
**Role:** Principal Solutions Architect, SEO/AEO Lead & Google M3 Specialist

---

## 1. Critical Schema & Tariff Logic Conflicts

### 1.1 Pricing Discrepancies Identified in `Layout.astro`
Comparing the `hasOfferCatalog` in `Layout.astro` against the **Verified Official Rate Card**, there are **6 severe pricing and inclusion contradictions**:

| Offer Name in Schema | Schema Price | Official Rate Card | Status & Conflict Analysis |
| :--- | :--- | :--- | :--- |
| **Chennai Airport Taxi Transfers** | `₹650` | `₹450 – ₹850` | **Conflict:** Entry price is `₹450` (not `₹650`). Should use `450` or `AggregateOffer` (`lowPrice: 450`, `highPrice: 850`). |
| **South India Temple Tour Packages** | `₹3200` | `₹3,800` (Kanchipuram) | **Conflict:** Lowest verified temple tour package is Kanchipuram 1-Day Sedan at `₹3,800`. `₹3,200` does not exist. |
| **Kumbakonam 9 Navagraha Tour** | `₹8600` | `₹14,500` (2-Day Sedan) | **Severe Conflict:** Schema underquotes by `₹5,900` (`₹8,600` vs `₹14,500`). |
| **Chennai to Rameswaram & Dhanushkodi**| `₹15500` | `₹18,500` (2-Day Sedan) | **Severe Conflict:** Schema underquotes by `₹3,000` (`₹15,500` vs `₹18,500`). |
| **Chennai to Sabarimala Pilgrim Yatra**| `₹15900` | `₹24,000` (3-Day Sedan) | **Severe Conflict:** Schema underquotes by `₹8,100` (`₹15,900` vs `₹24,000`). |
| **Acting Driver Services in Chennai** | `₹600` | `₹500` (4hr City) | **Conflict:** Official starting tariff for a 4-hour city slot is `₹500`, not `₹600`. |

> **⚠️ Bonus Contradiction (FAQ vs. Offer Descriptions):**  
> In `Layout.astro`, the Tirupati, Navagraha, and Chidambaram offer descriptions state *"with tolls, fuel, and driver bata included."* However, `FAQ.astro` (Question 3) explicitly states: *"Fastag highway toll fees, airport/temple parking charges, and interstate state entry permits... are paid directly as per actuals."* This must be unified immediately (clarifying whether custom All-Inclusive packages include tolls vs. per-km outstation tariffs).

### 1.2 Algorithmic & Manual Action Risks
1. **Google Structured Data Manual Action ("Spammy Structured Markup"):** Google's Search Quality team and automated crawlers cross-reference the visible DOM text against JSON-LD `price` values. Displaying `₹14,500` on the visible Navagraha booking engine while feeding `₹8,600` in the JSON-LD triggers a deceptive pricing flag, stripping all Rich Snippets sitewide.
2. **AI Overview (AEO) Hallucination & Trust Decay:** LLMs (Gemini, SearchGPT, Perplexity) ingest JSON-LD with high confidence. Feeding conflicting numbers causes the AI to either drop Kalidass Travels from citations due to low entity confidence or quote `₹8,600` to users—leading to customer disputes on WhatsApp.

### 1.3 Corrected `hasOfferCatalog` Implementation (`Layout.astro`)

```javascript
hasOfferCatalog: {
  "@type": "OfferCatalog",
  name: "Travel & Taxi Services",
  itemListElement: [
    {
      "@type": "Offer",
      name: "Chennai Airport Taxi Transfers",
      description: "Rapid 5-10 min MAA airport taxi dispatch with live flight delay tracking, zero surge pricing, and driver details sent via WhatsApp.",
      price: "450",
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "AggregateOffer",
        lowPrice: "450",
        highPrice: "850",
        priceCurrency: "INR"
      },
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: "https://kalidasstravels.in/services/chennai-airport-taxi/",
      seller: { "@id": "https://kalidasstravels.in/#localbusiness" },
      itemOffered: {
        "@type": "TaxiService",
        name: "Chennai Airport Taxi Transfers",
        url: "https://kalidasstravels.in/services/chennai-airport-taxi/",
      },
    },
    {
      "@type": "Offer",
      name: "Outstation Cabs from Chennai",
      description: "Round trip and one-way outstation cabs from ₹14/km across Tamil Nadu, Pondicherry, and Karnataka. ₹500 advance fully deducted from final bill.",
      price: "14",
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "14",
        priceCurrency: "INR",
        unitText: "KM",
      },
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: "https://kalidasstravels.in/services/outstation-cabs/",
      seller: { "@id": "https://kalidasstravels.in/#localbusiness" },
      itemOffered: {
        "@type": "TaxiService",
        name: "Outstation Cabs from Chennai",
        url: "https://kalidasstravels.in/services/outstation-cabs/",
      },
    },
    {
      "@type": "Offer",
      name: "South India Temple Tour Cab Packages",
      serviceType: "Temple Pilgrimage Taxi Packages",
      description: "Dedicated darshan cab packages to Kanchipuram, Tirupati, Navagraha, Thiruvannamalai, Rameswaram, and Sabarimala starting from ₹3,800.",
      price: "3800",
      priceCurrency: "INR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: "https://kalidasstravels.in/services/tours/temple-tours/",
      seller: { "@id": "https://kalidasstravels.in/#localbusiness" },
      itemOffered: {
        "@type": "TaxiService",
        name: "South India Temple Tour Cab Packages",
        url: "https://kalidasstravels.in/services/tours/temple-tours/",
      },
    },
    {
      "@type": "Offer",
      name: "Chennai to Kanchipuram 1-Day Temple Tour Cab Package",
      price: "3800",
      priceCurrency: "INR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: "https://kalidasstravels.in/services/kanchipuram-temple-trip/",
      description: "1-Day Kanchipuram Divya Desam & Kamakshi Amman temple darshan package in AC Sedan (₹3,800), Ertiga (₹4,800), or Innova (₹5,800).",
      seller: { "@id": "https://kalidasstravels.in/#localbusiness" },
      itemOffered: {
        "@type": "TaxiService",
        name: "Chennai to Kanchipuram Temple Cab Package",
        serviceType: "Pilgrimage Taxi Package",
      },
    },
    {
      "@type": "Offer",
      name: "Chennai to Tirupati Balaji Darshan Cab Package",
      price: "6000",
      priceCurrency: "INR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: "https://kalidasstravels.in/services/tirupati-package/",
      description: "Doorstep 1-Day Chennai to Tirupati car package in AC Sedan (₹6,000), Ertiga (₹7,500), or Innova (₹8,500) with driver bata included.",
      seller: { "@id": "https://kalidasstravels.in/#localbusiness" },
      itemOffered: {
        "@type": "TaxiService",
        name: "Chennai to Tirupati Balaji Darshan Cab Package",
        serviceType: "Pilgrimage Taxi Package",
      },
    },
    {
      "@type": "Offer",
      name: "Chennai to Thiruvannamalai Girivalam Cab Package",
      price: "6500",
      priceCurrency: "INR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: "https://kalidasstravels.in/services/thiruvannamalai-girivalam-trip/",
      description: "1-Day Arunachaleswarar temple darshan and 14 km Pournami Girivalam package in AC Sedan (₹6,500), Ertiga (₹7,900), or Innova (₹9,300).",
      seller: { "@id": "https://kalidasstravels.in/#localbusiness" },
      itemOffered: {
        "@type": "TaxiService",
        name: "Chennai to Thiruvannamalai Girivalam Cab Package",
        serviceType: "Pilgrimage Taxi Package",
      },
    },
    {
      "@type": "Offer",
      name: "Chennai to Chidambaram Natarajar & Pichavaram Cab Package",
      price: "7400",
      priceCurrency: "INR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: "https://kalidasstravels.in/services/chidambaram-temple-trip/",
      description: "1-Day coastal pilgrimage to Thillai Natarajar Temple and Pichavaram Mangrove forest in AC Sedan (₹7,400), Ertiga (₹9,200), or Innova (₹11,000).",
      seller: { "@id": "https://kalidasstravels.in/#localbusiness" },
      itemOffered: {
        "@type": "TaxiService",
        name: "Chennai to Chidambaram Natarajar & Pichavaram Cab Package",
        serviceType: "Pilgrimage Taxi Package",
      },
    },
    {
      "@type": "Offer",
      name: "Kumbakonam 9 Navagraha Temples Tour Cab Package",
      price: "14500",
      priceCurrency: "INR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: "https://kalidasstravels.in/services/navagraha-tour/",
      description: "2 Days / 1 Night complete 9 planetary temples tour around Kumbakonam in AC Sedan (₹14,500), Ertiga (₹18,500), or Innova (₹22,500).",
      seller: { "@id": "https://kalidasstravels.in/#localbusiness" },
      itemOffered: {
        "@type": "TaxiService",
        name: "Kumbakonam 9 Navagraha Temples Tour Cab Package",
        serviceType: "Pilgrimage Taxi Package",
      },
    },
    {
      "@type": "Offer",
      name: "Chennai to Rameswaram & Dhanushkodi Cab Package",
      price: "18500",
      priceCurrency: "INR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: "https://kalidasstravels.in/services/rameswaram-2-days/",
      description: "2 Days / 1 Night pilgrimage covering Ramanathaswamy Temple, Pamban Bridge, and Dhanushkodi in AC Sedan (₹18,500), Ertiga (₹23,500), or Innova (₹27,500).",
      seller: { "@id": "https://kalidasstravels.in/#localbusiness" },
      itemOffered: {
        "@type": "TaxiService",
        name: "Chennai to Rameswaram & Dhanushkodi Cab Package",
        serviceType: "Pilgrimage Taxi Package",
      },
    },
    {
      "@type": "Offer",
      name: "Chennai to Sabarimala Pilgrim Yatra Cab Package",
      price: "24000",
      priceCurrency: "INR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: "https://kalidasstravels.in/services/sabarimala-trip/",
      description: "3 Days / 2 Nights Sabarimala yatra to Pamba/Nilakkal in AC Sedan (₹24,000), Ertiga (₹30,000), or Innova (₹36,000) with experienced ghat driver.",
      seller: { "@id": "https://kalidasstravels.in/#localbusiness" },
      itemOffered: {
        "@type": "TaxiService",
        name: "Chennai to Sabarimala Pilgrim Yatra Cab Package",
        serviceType: "Pilgrimage Taxi Package",
      },
    },
    {
      "@type": "Offer",
      name: "Acting Driver Services in Chennai",
      description: "Police background-verified chauffeurs for your personal car. City 4hr (₹500), 8hr (₹800), and Outstation round trip (₹1,400/day).",
      price: "500",
      priceCurrency: "INR",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: "https://kalidasstravels.in/services/acting-drivers/",
      seller: { "@id": "https://kalidasstravels.in/#localbusiness" },
      itemOffered: {
        "@type": "Service",
        name: "Acting Driver Services in Chennai",
        url: "https://kalidasstravels.in/services/acting-drivers/",
      },
    },
  ],
}
```

---

## 2. JSON-LD `@graph` Architecture & Broken Node Resolution

### 2.1 Diagnosis of Broken Entity Nodes
1. **Hardcoded `FAQ.astro` URI Collisions:** `FAQ.astro` hardcodes `@id: "https://kalidasstravels.in/#faq"` and `isPartOf: { "@id": "https://kalidasstravels.in/#webpage" }`. If `FAQ.astro` is rendered on an interior route (e.g., `/services/outstation-cabs/`), it falsely tells Google the FAQ belongs to the homepage `#webpage` node rather than the current page's `${canonicalURL}#webpage`.
2. **Fragmented `<script type="application/ld+json">` Islands:** `Breadcrumbs.astro` and `FAQ.astro` inject isolated `<script>` tags outside `Layout.astro`'s unified `@graph`. While Google can parse multiple blocks if `@id` URIs match, URL trailing-slash normalization differences between `canonicalURL` in `Layout.astro` and `formatItemUrl(Astro.url.pathname)` in `Breadcrumbs.astro` risk creating orphaned graph nodes.
3. **Synthetic Review Date Fingerprint (`Layout.astro`):**
   ```javascript
   "datePublished": `2024-0${(idx % 9) + 1}-01`
   ```
   Generating fake dates on the 1st of sequential months (`2024-01-01`, `2024-02-01`, `2024-03-01`) is an obvious programmatic footprint. Furthermore, Google's **Self-Serving Review Policy** (updated Sept 2019) states that `LocalBusiness` and `Organization` schemas **cannot** display review stars in SERPs for first-party reviews embedded directly on their own site, and fabricated timestamps violate structured data authenticity guidelines.

### 2.2 The Architectural Fix

#### Fix A: Genuine Review Timestamps (`Layout.astro`)
Store the actual ISO date in `siteContent.reviews` (`r.datePublished`), and only emit `datePublished` when a real date exists:
```javascript
const localBusinessReviews = (siteContent.reviews || []).slice(0, 5).map((r: any) => ({
  "@type": "Review",
  "author": {
    "@type": "Person",
    "name": r.name,
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": String(r.rating || 5),
    "bestRating": "5",
    "worstRating": "1",
  },
  "reviewBody": r.quote,
  ...(r.date ? { "datePublished": r.date } : {}), // Only output verified real dates (YYYY-MM-DD)
}));
```

#### Fix B: Dynamic Canonical Binding in `FAQ.astro`
Update `FAQ.astro` so it dynamically binds to the active page's `@id` rather than hardcoding the homepage root:
```astro
---
// Inside FAQ.astro frontmatter
const canonicalPageUrl = new URL(Astro.url.pathname, "https://kalidasstravels.in").href.replace(/\/?$/, "/");

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${canonicalPageUrl}#faq`,
  "isPartOf": {
    "@id": `${canonicalPageUrl}#webpage`
  },
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.a,
    },
  })),
};
---
<script type="application/ld+json" set:html={JSON.stringify(faqSchema)} />
```

#### Fix C: Unified `@graph` Prop Passing (Recommended Best Practice)
In `Layout.astro`, accept `breadcrumbs` and `faqs` directly as props so `Layout.astro` builds a single, conflict-free `@graph`:
```javascript
// In Layout.astro frontmatter
const { title, description, schema, breadcrumbs = [], faqs = [] } = Astro.props;

const breadcrumbSchema = breadcrumbs.length > 0 ? {
  "@type": "BreadcrumbList",
  "@id": `${canonicalURL}#breadcrumb`,
  "isPartOf": { "@id": `${canonicalURL}#webpage` },
  "itemListElement": breadcrumbs.map((item: any, idx: number) => ({
    "@type": "ListItem",
    "position": idx + 1,
    "name": item.name,
    "item": new URL(item.item, "https://kalidasstravels.in").href,
  })),
} : null;

const faqPageSchema = faqs.length > 0 ? {
  "@type": "FAQPage",
  "@id": `${canonicalURL}#faq`,
  "isPartOf": { "@id": `${canonicalURL}#webpage` },
  "mainEntity": faqs.map((f: any) => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": { "@type": "Answer", "text": f.a },
  })),
} : null;

const graphItems: any[] = [
  organizationSchema,
  localBusinessSchema,
  websiteSchema,
  webPageSchema,
  siteNavigationSchema,
  ...(breadcrumbSchema ? [breadcrumbSchema] : []),
  ...(faqPageSchema ? [faqPageSchema] : []),
];
```

---

## 3. SERP, Featured Snippet & AEO (Answer Engine Optimization)

To dominate **Google Featured Snippets (Position Zero)** and **AI Overviews (Gemini / Perplexity / ChatGPT Search)** for high-intent queries like *"Chennai to Tirupati cab package cost"* or *"Kumbakonam Navagraha taxi fare from Chennai"*, implement the following **3-Layer AEO Architecture** on every `[slug].astro` page:

### 3.1 The 45–50 Word Direct Answer Block (`data-speakable="true"`)
LLMs and Featured Snippet extractors prioritize an immediate, self-contained **45–50 word summary paragraph** placed directly underneath the `<h1>` or primary `<h2>`, followed immediately by a semantic HTML `<table>`.

```astro
<!-- Place immediately below Hero / H1 in [slug].astro -->
<section aria-labelledby="quick-tariff-summary" class="max-w-4xl mx-auto my-6 px-4">
  <h2 id="quick-tariff-summary" class="text-m3-title-l font-semibold text-m3-on-surface mb-2">
    How much does a Chennai to Tirupati cab package cost?
  </h2>
  
  <!-- EXACT 48-WORD AEO DIRECT ANSWER TARGET -->
  <p data-speakable="true" class="lead text-m3-body-l text-m3-on-surface-variant mb-4">
    A 1-day Chennai to Tirupati cab package costs <strong>₹6,000 for an AC Sedan</strong> (4-seater), 
    <strong>₹7,500 for an Ertiga</strong> (6-seater), <strong>₹8,500 for an Innova</strong>, 
    <strong>₹10,000 for an Innova Crysta</strong>, and <strong>₹12,500 for a Tempo Traveller</strong>. 
    Packages include doorstep pickup, fuel, and driver batta with a ₹500 booking advance.
  </p>

  <!-- SEMANTIC HTML TABLE FOR GOOGLE TABLE SNIPPETS -->
  <div class="overflow-x-auto rounded-2xl border border-m3-outline-variant bg-m3-surface-container-low">
    <table class="w-full text-left border-collapse text-m3-body-m text-m3-on-surface">
      <thead>
        <tr class="bg-m3-surface-container-highest text-m3-label-l border-b border-m3-outline-variant">
          <th class="py-3 px-4">Vehicle Type</th>
          <th class="py-3 px-4">Seating</th>
          <th class="py-3 px-4">1-Day Package</th>
          <th class="py-3 px-4">2-Day Package</th>
          <th class="py-3 px-4">3-Day Package</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-m3-outline-variant/50">
        <tr>
          <td class="py-3 px-4 font-medium">AC Sedan (Dzire / Etios)</td>
          <td class="py-3 px-4">4 + 1</td>
          <td class="py-3 px-4 font-semibold">₹6,000</td>
          <td class="py-3 px-4">₹9,500</td>
          <td class="py-3 px-4">₹13,200</td>
        </tr>
        <tr>
          <td class="py-3 px-4 font-medium">Maruti Ertiga SUV</td>
          <td class="py-3 px-4">6 + 1</td>
          <td class="py-3 px-4 font-semibold">₹7,500</td>
          <td class="py-3 px-4">₹11,500</td>
          <td class="py-3 px-4">₹15,800</td>
        </tr>
        <tr>
          <td class="py-3 px-4 font-medium">Toyota Innova</td>
          <td class="py-3 px-4">7 + 1</td>
          <td class="py-3 px-4 font-semibold">₹8,500</td>
          <td class="py-3 px-4">₹12,500</td>
          <td class="py-3 px-4">₹17,500</td>
        </tr>
        <tr>
          <td class="py-3 px-4 font-medium">Toyota Innova Crysta</td>
          <td class="py-3 px-4">7 + 1</td>
          <td class="py-3 px-4 font-semibold">₹10,000</td>
          <td class="py-3 px-4">₹16,000</td>
          <td class="py-3 px-4">₹22,500</td>
        </tr>
        <tr>
          <td class="py-3 px-4 font-medium">Tempo Traveller</td>
          <td class="py-3 px-4">12 + 1</td>
          <td class="py-3 px-4 font-semibold">₹12,500</td>
          <td class="py-3 px-4">₹19,500</td>
          <td class="py-3 px-4">₹27,000</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
```

---

## 4. Google Material Design 3 (M3) UI/UX Compliance

### 4.1 Codebase Audit Against M3 Guidelines
1. **Typography Token Bypass in `FAQ.astro` & `Breadcrumbs.astro`:**
   - In `FAQ.astro`, the heading uses `text-2xl sm:text-3xl md:text-4xl font-extrabold` instead of the mapped M3 typescale tokens (`text-m3-headline-s sm:text-m3-headline-m md:text-m3-headline-l`).
   - The subtitle uses `text-xs sm:text-sm md:text-base` instead of `text-m3-body-m sm:text-m3-body-l`.
2. **Iconography Violation in `[slug].astro`:**
   - `[slug].astro` imports **18 icons from `lucide-react`**. Your M3 System Reference explicitly mandates **Google Material Symbols Outlined**. Mixing Lucide stroke weights with Material Symbols breaks visual harmony and inflates the JS bundle if passed to client islands.
3. **Color & Brand Rule 2 Enforcement:**
   - **Primary Seed:** `#1E252D` (Executive Midnight Charcoal).
   - **Typography & Rates:** `#111827` (Crisp Midnight Slate Charcoal — **never red**).
   - **Signature Logo "K" Red (`#EC221F`):** Strictly protected by **Rule 2** (reserved exclusively for the brand mark / K emblem, never used for price tags, body text, or generic danger states).
4. **Surface Tonal Elevation vs. Drop Shadows:**
   - M3 replaces heavy Material 2 drop shadows with **5 Surface Container Tonal Roles**:
     - `bg-m3-surface-container-lowest` (`#FFFFFF`)
     - `bg-m3-surface-container-low` (`#F7F8FA`)
     - `bg-m3-surface-container` (`#F1F3F6`)
     - `bg-m3-surface-container-high` (`#EBEEF2`)
     - `bg-m3-surface-container-highest` (`#E3E7ED`)
   - Interactive elements require **M3 State Layers** (hover `8%` opacity, focus/press `12%` opacity of the `on-surface` or `on-primary` token).

### 4.2 Why Native Astro + Tailwind M3 Beats `@material/web` Web Components
Using native Astro HTML + Tailwind CSS tokens instead of importing Google's `@material/web` Lit-based Web Components (`<md-filled-button>`, `<md-filter-chip>`) is critical for SEO and Core Web Vitals:
1. **Zero Client JS Overhead (INP & TBT):** `@material/web` ships a Lit runtime and registers custom elements on the main thread, delaying **Interaction to Next Paint (INP)** and increasing **Total Blocking Time (TBT)** on budget Android devices across India.
2. **No Shadow DOM Crawl or Styling Barriers (LCP & CLS):** Web Components encapsulate markup inside Shadow DOM roots, requiring client-side JS hydration before styles resolve—causing Flash of Unstyled Content (FOUC) and **Cumulative Layout Shift (CLS)** penalties. Native Astro + Tailwind renders 100% static, zero-JS HTML at the edge.

### 4.3 Production-Ready Google M3 Astro/Tailwind Templates

#### 1. Authentic M3 Button (`src/components/ui/M3Button.astro`)
Enforces the `40px` (`h-10`) height, `rounded-full` pill geometry, `24px` (`px-6`) horizontal padding (`16px` leading when an icon is present), `text-m3-label-l` typography, and `8%`/`12%` state layer overlays.

```astro
---
interface Props {
  variant?: "filled" | "tonal" | "outlined" | "text";
  href?: string;
  type?: "button" | "submit" | "reset";
  icon?: string; // Material Symbol name, e.g., "directions_car"
  class?: string;
  [key: string]: any;
}

const {
  variant = "filled",
  href,
  type = "button",
  icon,
  class: className = "",
  ...rest
} = Astro.props;

const Tag = href ? "a" : "button";

const baseClasses =
  "relative inline-flex items-center justify-center h-10 rounded-full text-m3-label-l font-medium transition-all duration-200 select-none overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1E252D] disabled:opacity-38 disabled:pointer-events-none";

const paddingClasses = icon ? "pl-4 pr-6 gap-2" : "px-6";

const variantClasses = {
  filled:
    "bg-[#1E252D] text-white shadow-none hover:shadow-sm after:absolute after:inset-0 after:bg-white/0 hover:after:bg-white/[0.08] active:after:bg-white/[0.12]",
  tonal:
    "bg-[#E3E7ED] text-[#111827] hover:shadow-xs after:absolute after:inset-0 after:bg-[#111827]/0 hover:after:bg-[#111827]/[0.08] active:after:bg-[#111827]/[0.12]",
  outlined:
    "border border-[#74777F] text-[#1E252D] bg-transparent after:absolute after:inset-0 after:bg-[#1E252D]/0 hover:after:bg-[#1E252D]/[0.08] active:after:bg-[#1E252D]/[0.12]",
  text:
    "text-[#1E252D] bg-transparent px-3 after:absolute after:inset-0 after:bg-[#1E252D]/0 hover:after:bg-[#1E252D]/[0.08] active:after:bg-[#1E252D]/[0.12]",
}[variant];
---

<Tag
  href={href}
  type={!href ? type : undefined}
  class:list={[baseClasses, paddingClasses, variantClasses, className]}
  {...rest}
>
  {icon && (
    <span class="material-symbols-outlined text-[18px] leading-none" aria-hidden="true">
      {icon}
    </span>
  )}
  <span class="relative z-10"><slot /></span>
</Tag>
```

#### 2. Authentic M3 Filter Chip (`src/components/ui/M3FilterChip.astro`)
Enforces the `32px` (`h-8`) M3 container height, `8px` (`rounded-lg`) corner radius, dynamic checkmark morph, and tonal selection state.

```astro
---
interface Props {
  label: string;
  selected?: boolean;
  value?: string;
  name?: string;
}

const { label, selected = false, value = label, name } = Astro.props;
---

<button
  type="button"
  role="checkbox"
  aria-checked={selected ? "true" : "false"}
  data-chip-value={value}
  name={name}
  class:list={[
    "group relative inline-flex items-center h-8 rounded-lg text-m3-label-l font-medium transition-all duration-150 select-none overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E252D]",
    selected
      ? "bg-[#D5E3F7] text-[#0D1D2A] pl-2 pr-4 gap-1.5 border border-transparent"
      : "bg-transparent text-[#44474E] px-4 border border-[#74777F] hover:bg-[#1E252D]/[0.08] active:bg-[#1E252D]/[0.12]",
  ]}
>
  {selected && (
    <span
      class="material-symbols-outlined text-[18px] leading-none text-[#0D1D2A]"
      aria-hidden="true"
    >
      check
    </span>
  )}
  <span>{label}</span>
</button>
```

#### 3. Authentic M3 Surface Container Card (`src/components/ui/M3SurfaceCard.astro`)
Enforces M3's `rounded-xl` (`12px`) to `rounded-2xl` (`16px`) shape scale, tonal surface hierarchy (Level 0–5), and Crisp Midnight Slate Charcoal (`#111827`) pricing rules.

```astro
---
interface Props {
  title: string;
  subtitle?: string;
  price?: string;
  priceUnit?: string;
  elevation?: "lowest" | "low" | "