# Engineering, UX & Operational Rules — Kalidass Travels

> **Full Document:** Please refer to the comprehensive [docs/03_RULES.md](./docs/03_RULES.md) for complete engineering, design, tariff calculation, and operational standards.

### Critical Rules at a Glance
1. **Astro-First:** Write static components in native `.astro`. Use React (`.jsx`) only when dynamic client state is strictly necessary.
2. **Strict Color Standard:** Brand Red (`#EC221F`) is strictly reserved for the "K" logo mark only. **NEVER use red for live status pulse indicators, rates, or prices**. Tariffs must always be Midnight Onyx Slate (`#1A1C1E` / `#111827`).
3. **Outstation Minimum Billing:** 250 km/day for Sedans & standard SUVs; 300 km/day for Innova Crysta & Tempo Traveller. Driver Bata applies per calendar day.
4. **Quality Gates:** Desktop Lighthouse $\ge 95$, Mobile Lighthouse $\ge 90$, 0.000 CLS, and zero console errors.
5. **Modern Web Standards & Baseline Policy:** Target is **Baseline 2024 with progressive enhancement fallbacks**. Follow Chrome Modern Web Guidance (`.agents/skills/modern-web-guidance`) for native HTML/CSS platform primitives (native `<dialog>`, `popover`, `:user-invalid`, and top-layer animations) over heavy JS libraries.
6. **Service & Tariff Card UX Standards:**
   - Display **only** passenger count and baggage count prominently below vehicle names (`text-xs sm:text-sm font-semibold`), with no clutter or duplicate top pills.
   - Use in-card stay duration dropdowns for multi-day trips with instant reactive updates (never detached calculator forms).
   - Display key trip facts (Tolls, Time, Distance) exactly once; never stack generic summary pill strips on tour packages.
   - Zero narrative paragraphs: format guides and key highlights as structured bite-sized micro-cards.
   - Use unboxed vertical transit steppers without duplicate horizontal pill bars.
   - Capacity label must strictly be `"Passengers"` (never `"Devotees"`).
   - Duration alternatives must use `"1 or 2 Days"` (never `"1 & 2 Days"`).
   - Travel guides and route schedules must use static 4-card grids (never hidden tabs).
7. **Popups Hide the Floating Contact Button:** Any open popup/modal/bottom-sheet must hide the global round Call FAB. Use native `<dialog>.showModal()` (auto) or add `data-hide-contact-dock` to custom overlay roots. See [docs/03_RULES.md §8.4](./docs/03_RULES.md).
8. **Standardized WhatsApp Buttons:** Never use raw `#25D366` green background blocks or hardcoded `wa.me` strings on in-card CTAs. Always use `<WhatsAppButton>` (`variant="filled"` or `"tonal"`) and `buildWhatsAppUrl()` from `src/utils/whatsapp.ts`. See [docs/03_RULES.md §8.5](./docs/03_RULES.md).
9. **Functional Desk Architecture & Zero Personal Names (RACI Governance):**
   - **Zero Personal Names Invariant:** NEVER hardcode or display personal names (e.g. "Karthik", "Suresh", "One Person") in internal operations UI, buttons, documentation, schemas, or customer-facing messages.
   - **Mandatory Functional Desks:** All operational workflows and UI controls must strictly reference formal institutional desks:
     1. `Dispatch Controller` (Front-Office Lead Intake & Guest Coordination)
     2. `Ticketing Desk` / `Pilgrimage Quota Desk` (Back-Office Procurement, SLA: 120-minute turnaround)
     3. `Fleet Supervisor` (Vehicle Assignment & Capacity Guardrails)
     4. `Designated Chauffeur` / `Fleet Partner` (Ground Transit & Terminal Cash Collection)
     5. `Billing & Settlement Desk` (Financial Reconciliation & Agency Margin Audit)
   - **UI & Button Standards:**
     - Button must read: `[📋 Ticketing Desk]` (never `[📋 Karthik]`).
     - Customer message: `"Our Pilgrimage Ticketing Desk is processing your slot"` (never `"Karthik is processing"`).
     - Dossier header: `PILGRIM KYC DOSSIER — TICKETING DESK` (with explicit 120-min SLA).

10. **Paid Ad Conversion Standard (Search Phone Call for MAA to Outstation Transfers):** For high-ticket Chennai Airport (MAA) to Outstation transfers (Vellore CMC/VIT, Pondicherry, Tirupati — ₹2,500 to ₹8,000+), never run standard web-click search ads (₹1,000 burned with zero success). Focus Google Ads budget exclusively on **Search Phone Call (Call-Only)** campaigns to route long-distance passengers straight into direct phone conversations with the Dispatch Controller (`+91 89395 39211`).

11. **Tempo Traveller Operations & Tariff Standards:**
   - **Minimum Billing Slab:** Strictly 300 km per calendar day (Midnight to Midnight, 00:00 – 23:59). Multi-day outstation packages accumulate linearly (e.g. 2 Days = 600 km, 3 Days = 900 km, 4 Days = 1,200 km).
   - **Target Operating Margin:** Quotes must maintain a 25.0% – 30.0% gross operating margin after Direct COGS (Fuel @ ₹93.50/L, Driver Bata @ ₹800–₹900/day, FASTag LCV Class 4 tolls, and Parivahan e-permit taxes).
   - **Package Km Cap & Multi-Drop Protection Standard (The Anti-Tada Rule):**
     - All package quotes must explicitly declare included kilometers and include **1 primary pickup and 1 primary drop point**.
     - En-route drops along the direct highway/return corridor (e.g., GST Road, Poonamallee High Road) are 100% complimentary.
     - Cross-city detours to separate residential neighborhoods exceeding the package cap are billed at ₹24/km (12S) or ₹26/km (17S) based on physical dashboard odometer photos taken at trip start and final drop.
   - **Calendar Day Cutoff & 45-Min Grace Period:** Calendar day ends at 23:59. Genuine highway traffic delays receive a 45-minute grace period (up to 00:45 AM). Trips extending past 00:45 AM due to customer itinerary additions/multi-home drops incur Day 2 driver bata (₹600).
   - **Mandatory Ghat / Hill Surcharge & AC Protocol:** Flat ₹1,500 hill surcharge per trip on ghat routes (Ooty, Kodaikanal, Yercaud, Yelagiri) for 36-hairpin wear. Air conditioning is paused during steep uphill climbs on ghat roads for engine power and overheating prevention; runs continuously on all highways.
   - **Pre-Cleared Parivahan E-Permits & Zero Cash Demands:** Chauffeurs and dispatchers must pre-pay and print Andhra Pradesh, Kerala, or Karnataka state tourist vehicle permits online via Parivahan before rollout. Zero checkpost delays and zero cash demands from passengers on the road. Only monument/temple parking slips are paid at actuals by the passenger.
   - **Doorstep vs. Garage Origin Radius:** Zero garage fees for pickups within Medavakkam, Velachery, Tambaram, Pallavaram, and Chennai Airport (MAA). Flat ₹500 vehicle positioning charge for pickups north of Koyambedu / Anna Nagar.
   - **Chauffeur Vetting Protocol:** Minimum 5+ years commercial HPV license badge; strictly satvik, teetotaler, non-smoking chauffeurs assigned to temple tours (Tirupati, Sabarimala, Navagraha).

12. **Vector SVG Icon Standardization (Lucide React vs. Material Symbols Font):**
   - **Strict Invariant:** NEVER use `<span class="material-symbols-outlined">...</span>` on new or modified pages/components.
   - **Reasoning:** The local `material-symbols-outlined.woff2` font in `Layout.astro` is an ultra-compressed 5.6 KB subset containing only ~12 glyphs for homepage LCP. Unrecognized ligature names render as clipped 1em raw text fragments (`d`, `t`, `h`, `o`).
   - **Standard:** Always import and render vector SVG icons from `lucide-react` (e.g., `Car`, `Bus`, `Users`, `Luggage`, `CheckCircle2`, `ShieldCheck`, `MapPin`, `Landmark`, `Receipt`, `ExternalLink`, `Info`) or use inline SVGs.
   - See [.agents/rules/icon-standardization.md](./.agents/rules/icon-standardization.md) for full rationale and guidelines.

13. **The 1-Day Toll Invariant (Strict Commercial Standard):**
    - **1-Day Packages Only:** Highway FASTag tolls and statutory state entry permits are pre-included upfront for **1-Day fixed tour packages ONLY** (Tirupati, Thiruvannamalai, Kanchipuram, Pondicherry, Vellore, Chidambaram, Mahabalipuram).
    - **Multi-Day & Outstation at Actuals:** For ALL multi-day packages (>1 Day, e.g. 2-Day, 3-Day, Kumbakonam Navagraha, Rameswaram, Sabarimala) and open per-km outstation rentals, highway tolls, parking fees, and state entry permits are strictly payable at actuals by the passenger as per official FASTag receipts.
    - **Strict UI & SEO Rule:** Never display "All Tolls Included", "Tolls Included", or pre-paid toll promises on multi-day tour cards, stay duration dropdowns, FAQs, or SEO metadata. Service promise badge must read `"Tolls Covered on 1-Day Tours"`.

14. **Commercial Policy Transparency & Zero Competitor Brand Leaks (Google Compliance Standard):**
    - **Advance Policy Uniformity:** Never state "Zero Advance to Book" if an advance deposit (e.g., ₹500) is required to lock a vehicle or chauffeur. All trust badges, cards, FAQs, and structured data schemas MUST strictly declare: `"₹500 Advance Locks Cab • 100% Deducted from Final Bill • Fully Refundable up to 6h Prior"`.
    - **Zero Competitor Leaks Invariant:** NEVER display competitor brand names or reference benchmarks (e.g., "Savaari", "Savaari Standard", "Ola-style") anywhere in client-facing HTML, headers, calculator cards, or customer messages. Always use `"Kalidass Transparent Tariff"`.
    - **Truth in Partnership & Institutional Claims:** Do not label clients or vendors as "Official Partner" of government bodies (e.g. Airport Authority of India, Tamil Nadu Police) unless verified by active legal contract. Use compliant phrases like `"Dedicated Corporate & Airport Corridor Provider"` or `"Institutional Mobility Provider"`.

15. **LCP Preload Parity Invariant (Core Web Vitals Standard):**
    - **Strict Asset Matching:** Whenever a hero background or banner image is preloaded via `<link rel="preload">` in page frontmatter or layouts, the preloaded URI/srcset MUST match the EXACT first image candidate rendered in the above-the-fold component.
    - **Zero Phantom Preloads:** Never preload an unrendered or fallback asset that wastes user mobile bandwidth and delays the true LCP element.

16. **Booking Engine Clarity & Zero-Gimmick UX Standard (Universal Invariant Across All Engines):**
    - **Zero Fake Trust Badges:** Never display fake tech badges (e.g., "Live Radar", "Live Satellite Tracking", "AI Radar") on flight or trip inputs unless real-time telemetry APIs are genuinely integrated. Keep labels honest and minimal: `Flight Number (Optional)`.
    - **Clean Button Typography (No Glyph Clutter):** Fare calculation CTAs must never contain decorative cash/currency bill icons (`[$]`, `Receipt`). Keep action labels clean, bold, and readable: `View Instant Fare →`.
    - **Structured Journey Summary Header:** When transitioning to the fare summary, never pack route, date, and vehicle specs into a dense unformatted run-on string. Separate Pickup, Drop, and Date/Time into clean visual tiers. Never display seating capacity in the route header—seating belongs strictly to vehicle selection.
    - **Mandatory Seating & Luggage Capacity on Vehicle Cards:** Every vehicle selection card (Sedan, Ertiga, Innova, Crysta, Tempo Traveller) MUST explicitly declare passenger and baggage capacity on the card itself (e.g. `Sedan: 4 Seats • 2 Bags`, `Ertiga: 6 Seats • 3 Bags`, `Innova: 7 Seats • 4 Bags`). Never expect users to know car model seating by name. Cards must be thumb-friendly with smooth horizontal swipe/scroll.
    - **Zero Duplicate Contact CTAs:** Never stack redundant contact triggers in the same view (e.g., top header Call button + bottom "Call Us" button + bottom "24/7 Helpline" text). Keep WhatsApp as the primary high-conversion action, paired with a single unified secondary phone contact.
    - **Zero Duplicate Invoice on Airport Taxi & Local Rentals ONLY:** The Clean Modern Layout (large showcase vehicle cards with prices, compact trust strip, and zero duplicate bill receipt) is strictly deployed for Airport Taxi and Local Hourly Rentals ONLY. Outstation multi-day / per-km trips strictly preserve the Classic Outstation Layout with compact switcher pills, detailed itemized math (km cost, driver bata, interstate taxes), and full payment rules. Never apply the Clean Layout's large showcase cards or direct pricing to Outstation trips.

17. **Strict Input Validation & Zero-Fabrication Invariant (Never Show Rates Without Destination):**
    - **No Phantom Calculations:** Never calculate or transition to fare results without a validated drop location/destination entered by the user.
    - **Explicit Blocking Validation:** Clicking `View Instant Fare` with an empty destination MUST immediately halt calculation, display an unambiguous validation alert (e.g., `Please enter your destination / hotel / area in Chennai`), highlight the empty input field with an error ring, and scroll/focus to the input.
    - **Zero Silent Defaults:** Never silently substitute a default dummy location (e.g. 'Chennai City Area') or fabricate a fake default distance/price when the user hasn't specified their destination.

18. **Mobile Horizontal Swipe Hint Affordance Standard (`👉 Swipe horizontally`):**
    - **Invariant:** Whenever a component or page presents a horizontally scrollable container / carousel on mobile (e.g. vehicle comparison carousels, packages scroll track, driver profiles, customer reviews, booking engine vehicle selectors, or wide tables), ALWAYS provide a mobile-only hint directly beneath or above the track/indicator dots.
    - **Standard Markup & Styling:**
      ```html
      <!-- Mobile Swipe Hint -->
      <div class="flex items-center justify-center gap-1.5 text-xs font-medium text-m3-on-surface-variant md:hidden mt-1">
        <span>👉 Swipe horizontally to compare all vehicle tariffs</span>
      </div>
      ```
    - **Contextual Copy Variations:**
      - Fleet / Tariff Carousels: `👉 Swipe horizontally to compare all vehicle tariffs` (or `...to compare vehicles`)
      - Tour Packages: `👉 Swipe horizontally to view all [N] packages`
      - Chauffeurs: `👉 Swipe horizontally to view all verified chauffeurs`
      - Customer Reviews: `👉 Swipe horizontally to read all customer reviews`
      - Wide Data Tables: `👉 Swipe horizontally to compare all vehicle specifications` (or `...view full table`)
    - **Breakpoints:** Use responsive utility (`md:hidden` or `sm:hidden`) so the hint displays strictly on touch/mobile screens where swipe gestures apply, and remains cleanly hidden on desktop grid views.

See [docs/03_RULES.md](./docs/03_RULES.md) for full quality standards.
