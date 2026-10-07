# Master Roadmap, Sprint Backlog & Tasks
## Project: Kalidass Travels
**Document Version:** 1.0.0  
**Tracking Method:** Iterative Agile Sprints  
**Repository:** `kalidass-attempt-main`  

---

## 1. Roadmap Overview & Milestones

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Foundation & Core Engine (COMPLETED)                          │
│ Astro 4 Migration • M3 System • Quotation Engine • Google Maps API      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ Phase 2: Local SEO & Lead Conversion Automation (CURRENT SPRINT)       │
│ Programmatic Landing Pages • WhatsApp Webhook • GMB Review Sync        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ Phase 3: Driver & Payment Automation (UPCOMING)                         │
│ Razorpay UPI Advance Token • Driver Dispatch PWA • Digital Trip Sheet   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ Phase 4: Enterprise Scale & Multi-City Expansion (FUTURE HORIZON)       │
│ Corporate B2B Portal • Dynamic Pricing Engine • Tamil Nadu Fleet Hubs   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase Breakdown & Sprint Backlog

### Phase 1: Core Foundation & Modernization (Completed ✅)
- [x] **TASK-101:** Migrate legacy website to **Astro 4.x** with Static Site Generation (SSG).
- [x] **TASK-102:** Implement Google **Material Design 3 (M3)** design system and Tailwind token bridge.
- [x] **TASK-103:** Develop interactive **Quotation Engine (`QuotationEngine.jsx`)** supporting One-Way, Round-Trip, and Local Packages.
- [x] **TASK-104:** Integrate Google Places Autocomplete and interactive map pin picker (`LocationPicker.jsx`).
- [x] **TASK-105:** Create offline South India distance fallback table (40+ routes) for fail-safe fare estimation.
- [x] **TASK-106:** Integrate serverless Google Apps Script webhook (`google_apps_script.js`) logging to Google Sheets and Calendar.
- [x] **TASK-107:** Configure Playwright end-to-end testing suite (`playwright.config.js`).
- [x] **TASK-108:** Optimize Core Web Vitals achieving 95+ Desktop Lighthouse score.

---

### Phase 2: Local SEO & Lead Conversion Automation (Active Sprint 🚀)
- [x] **TASK-201: Programmatic Local Hub Pages (Completed ✅)**
  - Generated hyper-targeted landing pages for high-intent Chennai corridors and suburban hubs:
    - `/services/chennai-to-pondicherry-taxi/` (ECR/NH-32 one-way drop from ₹3,500, RT from ₹4,500)
    - `/services/chennai-to-tirupati-one-day-package/` (Same-day Balaji darshan cab from ₹6,000 flat all-inclusive)
    - `/services/medavakkam-taxi-service/` (24/7 Medavakkam HQ cabs, ₹650 airport drops, ₹14/km outstation)
    - `/services/velachery-airport-taxi/` (Fixed ₹650 airport cabs, 10–15 min pickup, zero surge)
    - `/services/omr-corporate-cabs/` (OMR IT corridor employee transport, monthly retainers, 100% GST invoices)
  - 100% Schema validation (`TaxiService`, `TouristTrip`, `FAQPage`, `BreadcrumbList`, `Offer` with `validFrom`), 0 build warnings.
  - Added to HTML sitemap (`/sitemap/`), XML sitemap (`/sitemap-0.xml`), REST API (`/api/routes.json`), and `llms.txt`.
- [ ] **TASK-202: Dynamic Google Business Profile Review Widget**
  - Implement a cached server-side fetch of verified Google reviews (4.9★ rating) with automated schema markup.
- [ ] **TASK-203: WhatsApp Business Cloud API Direct Auto-Responder**
  - Automate the incoming lead pipeline so when users click "Book via WhatsApp", a webhook immediately acknowledges the trip, sends driver details, and alerts the dispatcher.
- [ ] **TASK-204: Complete Tamil (`/ta/`) Localization**
  - Finalize remaining Tamil translation strings in `siteContent.json` and service landing pages for regional customer engagement.
- [x] **TASK-205: Comprehensive Sitemap & LLM/AEO Optimization (Completed ✅)**
  - Developed full HTML Sitemap page (`/sitemap/`) categorizing all 20 service routes, 18 verified chauffeurs, core portals, and AI discovery endpoints.
  - Configured XML Sitemap serializer in `astro.config.mjs` with `lastmod`, `changefreq`, and `priority` attributes.
  - Synchronized `llms.txt`, `/.well-known/llms.txt`, and `llms-full.txt` with 100% accurate 2026 tariffs.
  - Added Speakable specification and injected Unified JSON-LD Knowledge Graph into `<head>` for AI overviews and Answer Engine crawlers.
  - Fixed unclosed/raw HTML in FAQPage JSON-LD schema preventing minify build errors.
  - Updated OpenAPI 3.1 specification, AI crawler policy (`ai.txt`), and `robots.txt`.

---

### Phase 3: Driver & Payment Automation (Upcoming 📅)
- [ ] **TASK-301: Razorpay / Cashfree UPI Token Advance Gateway**
  - Add optional ₹300–₹500 advance deposit token for outstation and airport bookings to eliminate customer cancellations and no-shows.
- [ ] **TASK-302: Driver Progressive Web App (PWA)**
  - Zero-install web dashboard for drivers:
    - Receive trip assignments via WhatsApp link.
    - Start trip: Capture starting odometer photo.
    - End trip: Capture ending odometer photo, enter toll amounts.
    - Auto-compute final payable balance.
- [ ] **TASK-303: Digital PDF Invoice & Trip Sheet Generator**
  - Automated PDF receipt generation for corporate passengers with GST number, breakdown of tolls, base fare, and driver allowance.

---

### Phase 4: Enterprise Scale & Regional Expansion (Future Horizon 🔮)
- [ ] **TASK-401: Corporate B2B Management Portal**
  - Self-service portal for corporate clients (IT firms, factories) to schedule recurring employee shuttles, download monthly consolidated GST invoices, and track live routes.
- [ ] **TASK-402: Regional Fleet Hub Expansion**
  - Launch dedicated fleet staging points in Coimbatore, Madurai, Trichy, and Salem with local partner networks.
- [ ] **TASK-403: Dynamic Seasonal Tariff Engine**
  - Configurable pricing multipliers for festival peaks (Pongal, Deepavali, Sabarimala season) and summer holiday road trips.

---

## 3. Technical Debt & Refactoring Backlog

| ID | Module | Issue / Technical Debt | Proposed Resolution | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **DEBT-01** | `QuotationEngine.jsx` | File size exceeds 1,600 lines; contains form state, fare math, vehicle cards, and UI markup in a single file. | Split into modular subcomponents: `<RouteInputs>`, `<VehicleSelector>`, `<FareBreakdownModal>`, and `useFareCalculator` hook. | Medium |
| **DEBT-02** | `update_data.py` | Standalone Python script used for batch content updates outside the standard Astro content collections. | Removed one-off script; content maintained in canonical JSON files. | Low (Removed) |
| **DEBT-03** | Google Maps Loader | Multiple components re-request Maps API loader independently. | Centralize via singleton `loadGoogleMaps` promise cache to avoid redundant network overhead. | High (Completed in `googleMapsLoader.ts`) |
