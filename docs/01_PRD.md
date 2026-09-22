# Product Requirements Document (PRD)

## Project: Kalidass Travels — Digital Mobility & Tour Platform

**Document Version:** 1.0.0  
**Status:** Approved / Active Baseline  
**Domain:** [kalidasstravels.in](https://kalidasstravels.in/)  
**Primary Hub:** Medavakkam, Chennai, Tamil Nadu, India  
**Target Market:** Chennai Metropolitan Area, Tamil Nadu, Andhra Pradesh, Karnataka, Kerala, Pondicherry

---

## 1. Executive Summary & Vision

### 1.1 Mission Statement

Kalidass Travels delivers premium, dependable, and transparent mobility services across Tamil Nadu and South India. The platform bridges the gap between unreliable street taxis, unpredictable aggregator surge pricing, and disorganized tour operators by offering guaranteed transparent tariffs, verified professional chauffeurs, sanitized vehicles, and seamless WhatsApp-first trip coordination.

### 1.2 The Problem We Solve

1. **Aggregator Volatility & Surge Pricing:** Major ride-hailing apps impose arbitrary 2x–3x surge pricing during peak morning/evening hours, airport runs, bad weather, and festival periods.
2. **Hidden Surcharges & Driver Demands:** Customers frequently experience drivers demanding extra cash over the meter, refusing air conditioning on hill stations (Ooty/Kodaikanal), or disputing toll/parking allowances.
3. **Impersonal Service for Sensitive Trips:** Pilgrimage trips (Tirupati, Navagraha, Rameswaram) and corporate client transfers require polite, satvik, patient drivers who know temple timings and highway protocols, which standard aggregators fail to guarantee.
4. **Lack of Trust in Acting Drivers:** Car owners needing temporary chauffeurs for their personal vehicles struggle with safety, punctuality, and manual transmission/automatic transmission familiarity.

### 1.3 Strategic Solution

A high-performance, mobile-first web portal powered by Astro 4 and Material Design 3 that provides:

- Instant, 100% transparent fare estimations with zero surge pricing.
- Frictionless WhatsApp-first booking flow eliminating complex app downloads or account registrations.
- Direct-to-dispatch logging via serverless Google Apps Script and automated calendar scheduling.
- Hyper-specialized service verticals: Airport Transfers (5–10 min rapid dispatch), Outstation Cab Packages, Sacred Temple Tours, Corporate Employee Commute, and Verified Acting Drivers.

---

## 2. Target User Personas

### Persona A: The Business & Airport Commuter ("Arun", 38)

- **Role:** Tech Consultant living in Medavakkam/Velachery, flying weekly from Chennai International Airport (MAA).
- **Needs:** Punctual 4:00 AM pickup, clean air-conditioned sedan (Dzire/Etios), printed/digital GST invoice for company reimbursement, zero cancellations.
- **Pain Point:** Ola/Uber drivers cancelling airport rides at early morning hours or demanding ₹200 extra cash for airport entry.
- **Conversion Trigger:** "5–10 Min Rapid Dispatch from Chennai Airport", fixed flat rates from ₹650, instant WhatsApp booking confirmation.

### Persona B: The Family Pilgrimage Coordinator ("Saraswathi", 52)

- **Role:** Homemaker organizing a 3-day family temple trip to Kumbakonam Navagraha temples with elderly parents and children.
- **Needs:** Spacious 7-seater (Innova Crysta) or 12-seater Tempo Traveller, patient driver respectful of senior citizens, transparent daily Bata, known temple darshan timings.
- **Pain Point:** Rash driving, rude driver behavior, sudden toll/fuel disputes mid-trip.
- **Conversion Trigger:** "Polite Satvik Chauffeurs", detailed itinerary breakdown with tolls and driver bata included, 100% transparent pricing.

### Persona C: The Car Owner Needing an Acting Driver ("Karthik", 34)

- **Role:** IT Manager in Sholinganallur owning a Hyundai Creta, attending a late-night family wedding or hospital appointment.
- **Needs:** Police-verified, non-smoking acting driver who can smoothly drive automatic/manual cars in heavy Chennai traffic.
- **Pain Point:** Informal call drivers who arrive late or lack proper driving discipline.
- **Conversion Trigger:** Clear hourly tariffs (₹350 for 2 hrs, ₹500 for 4 hrs, ₹800 for 8 hrs), police-verified profile badges.

### Persona D: Corporate Logistics / HR Admin ("Priya", 29)

- **Role:** Facilities & Administration Lead at an IT park in OMR / Guindy.
- **Needs:** Fleet of daily commute cabs for employees, monthly consolidated billing, GST compliance, background-verified drivers.
- **Pain Point:** Managing multiple fragmented cab vendors with erratic attendance and unorganized invoicing.
- **Conversion Trigger:** Dedicated Corporate Mobility landing page, 24/7 account management, consolidated monthly billing, verified fleet.

---

## 3. Core Product Features & Functional Requirements

### 3.1 Instant Fare Quotation & Booking Engine (`QuotationEngine.jsx`)

- **Trip Types Supported:**
  1. **One-Way Drop:** Flat per-km rate with vehicle-specific minimum drop distance (130 km for cars, 250 km for Tempo Traveller).
  2. **Round-Trip:** Distance-based calculation with daily minimum km thresholds (250 km/day for Sedans/Ertiga/Innova; 300 km/day for Innova Crysta & Tempo Traveller) + daily Driver Bata.
  3. **Local Hourly Packages:** Standard urban packages (4 Hr / 40 km, 5 Hr / 50 km, 8 Hr / 80 km, 10 Hr / 100 km, 12 Hr / 120 km) with transparent extra km/hr fees.
  4. **Airport Rapid Transfer:** Dedicated fast-flow booking tab for Chennai Airport (MAA) pickups and drops.
- **Intelligent Route & Distance Calculation:**
  - Google Places Autocomplete for seamless location entry.
  - Offline South India distance lookup table for instant zero-latency estimates and resilience against Google Maps API quotas or failures.
  - Interactive map pin repositioning and reverse geocoding.
- **Vehicle Selection & Price Transparency:**
  - Instant live card comparison across: Swift Dzire (Sedan, 4 pax), Toyota Etios (Sedan, 4 pax), Maruti Ertiga (MUV, 6 pax), Toyota Innova (SUV, 7 pax), Toyota Innova Crysta (Premium SUV, 7 pax), Tempo Traveller (Group, 12–16 pax).
  - Clear itemized price breakdown (Base fare, Driver Bata, Night allowance, Tolls & Permits notice).
- **Conversion Mechanisms:**
  - "Book via WhatsApp": Pre-populates a structured text message containing origin, destination, vehicle, travel date, estimated distance, and quoted price directly to `+91 63819 39769`.
  - "Direct Call CTA": Single-click tel link triggering dialer to `+91 63819 39769`.
  - "Google Sheets / Webhook Submission": Submits booking payload in background to Google Apps Script endpoint.

### 3.2 Service Verticals & Specialized Portals

| Service Vertical       | URL Path                          | Key Value Prop                           | Functional Highlights                                                                               |
| :--------------------- | :-------------------------------- | :--------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Airport Taxi**       | `/services/chennai-airport-taxi/` | 5–10 min rapid dispatch from MAA         | Live terminal pickup points, flight number logging, zero wait surcharge                             |
| **Outstation Cabs**    | `/services/popular-destinations/` | Inter-city road trips across South India | Popular route cards (Pondicherry, Bangalore, Tirupati, Ooty), round-trip vs one-way toggles         |
| **Temple Tours**       | `/services/temple-tours/`         | All-inclusive spiritual yatras           | Pre-calculated packages: Tirupati, Navagraha 9 Temples, Kanchipuram, Arupadai Veedu, Rameswaram     |
| **Acting Drivers**     | `/services/acting-drivers/`       | Chauffeur for your personal car          | Hourly fee estimator (₹350/2hr up to ₹800/8hr), night duty rules, outstation driver bata calculator |
| **Corporate Mobility** | `/services/corporate/`            | B2B employee transport & retainers       | Invoicing enquiry form, SLA highlights, client logos, customized contract requests                  |
| **Full Tariff Sheet**  | `/tariff/`                        | Public tariff transparency index         | Downloadable rate cards, vehicle specifications, hourly and per-km comparison tables                |

### 3.3 Trust & Social Proof Architecture

- **Verified Client Reviews:** Real customer testimonials with 5-star ratings, dates, and trip types.
- **Corporate Partners Carousel:** Recognizable enterprise brands trusting Kalidass Travels for fleet needs.
- **Driver Profiles Carousel:** Highlighting verified chauffeurs with photo, badge number, experience (years), spoken languages, and vehicle specialties.
- **Safety & Awareness Matrix:** 2x2 grid detailing vehicle sanitization, GPS tracking, 24/7 roadside assistance, and transparent billing guarantee.

---

## 4. Non-Functional Requirements (NFRs)

### 4.1 Performance & Core Web Vitals

- **Largest Contentful Paint (LCP):** < 1.5 seconds on 4G mobile connections.
- **Cumulative Layout Shift (CLS):** Exactly `0.000` (pre-allocated aspect ratios on all banners, hero images, and cards).
- **First Input Delay (FID) / Interaction to Next Paint (INP):** < 100ms.
- **Lighthouse Scores Target:**
  - Desktop: 98–100 across Performance, Accessibility, Best Practices, and SEO.
  - Mobile: >= 92 on Performance, 100 on SEO and Accessibility.

### 4.2 Accessibility (a11y)

- WCAG 2.1 Level AA compliance.
- Minimum touch target dimension: `48px x 48px` for all interactive buttons, chips, and input fields.
- Contrast ratio: Minimum `4.5:1` for regular body text; `12.5:1` achieved with Executive Onyx Slate (`#1A1C1E`) on Light Slate canvas (`#F9FAFB`).
- Screen reader semantic labeling on all modal triggers, icons, and interactive form elements.

### 4.3 Reliability, Scalability & Offline Fallback

- Zero client crashes during Google Maps API downtime or rate-limiting (guaranteed via offline South India distance fallback dictionary).
- Static Site Generation (SSG) via Astro guarantees 99.99% uptime with zero database dependency for web browsing.
- Form submissions degrade gracefully to WhatsApp direct link if the Google Apps Script webhook fails or times out.

### 4.4 Privacy & Regulatory Compliance

- Compliance with India's **Digital Personal Data Protection (DPDP) Act 2023**:
  - Purpose limitation: Customer phone and name collected solely for booking fulfillment and dispatch.
  - Explicit cookie consent banner with granular preferences (`CookieConsent.astro`).
  - Clear Terms of Service (`/terms/`) and Privacy Policy (`/privacy/`).

---

## 5. Success Metrics & Business KPIs

| Metric                                                 | Target Baseline               | Measurement Method                                                 |
| :----------------------------------------------------- | :---------------------------- | :----------------------------------------------------------------- |
| **Fare Estimate to WhatsApp Lead Conversion**          | > 8.5%                        | Google Analytics 4 custom event `generate_lead` / `whatsapp_click` |
| **Phone Call Click-Through Rate**                      | > 6.0%                        | GA4 event `click_call`                                             |
| **Average Dispatch Lead Response Time**                | < 3 minutes                   | Operational timestamp delta from webhook to WhatsApp contact       |
| **Organic Local Pack Rankings (Chennai / Medavakkam)** | Top 3 on Google Search & Maps | Google Search Console & Local SEO rank tracker                     |
| **Customer No-Show Rate**                              | < 2%                          | Google Sheets dispatch status reconciliation                       |
| **Lighthouse Performance Score**                       | >= 95 Desktop / >= 90 Mobile  | Continuous Lighthouse CI audit                                     |
