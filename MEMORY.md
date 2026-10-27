# System Memory & Context Knowledge Base — Kalidass Travels

> **Full Document:** Please refer to the comprehensive [docs/06_MEMORY.md](./docs/06_MEMORY.md) for full Architecture Decision Records (ADRs), schema contracts, and domain memory.

### Key Facts & Memory

- **Operating Entity:** Kalidass Travels (Est. 2015, Medavakkam, Chennai).
- **Contact:** `+91 89395 39211` | `kalidasstravels2015@gmail.com`.
- **Fleet:** Swift Dzire, Toyota Etios, Maruti Ertiga, Toyota Innova, Innova Crysta, Tempo Traveller.
- **Architectural Baseline:** Astro SSG + React Islands + Tailwind M3 + Google Apps Script Webhook (`google_apps_script.js`) + Google Sheets DB.
- **Paid Ads Strategy (Google Ads):** **Search Phone Call Ads (Call-Only) strictly over Search Traffic Ads**. We target **MAA Airport to Outstation Highway Transfers** (Vellore CMC/VIT, Pondicherry, Tirupati, Kumbakonam — ₹2,500 to ₹8,000 high-ticket trips), strictly NOT low-ticket local city drops. Web traffic search ads ("Search - Chennai Airport Transfers" — ₹1,000 burned with zero success) exhaust budget on unengaged website clicks. Outstation travelers arriving at MAA with luggage/families need direct verbal confirmation (`+91 89395 39211`). Phone call campaigns generate high-ticket, actionable outstation leads where 1 booking covers ad spend.
- **Critical Gotcha:** Always submit data to Google Apps Script as `text/plain` to prevent browser CORS preflight blocks. Always enforce trailing slashes on URLs (`trailingSlash: 'always'`). Rates must never be displayed in red.

- **Admin Console & Booking Workflow:** Single-operator 7-stage workflow (Enquiry ➔ ₹500 Advance ➔ Assign Driver ➔ WhatsApp Duty Slips ➔ Live Tracking ➔ Close Trip & KM ➔ 5★ Google Review). Verified review link: `https://share.google/1IOq41QwMkhDJvrLY`. Strictly zero mock data policy. Admin PIN: `2015`.
- **Strict Tone & Quotation Rules (Non-Negotiable):**
  1. **4th-Grade English:** Always simple, clean words that a 9-year-old child understands. Short sentences (10 to 15 words max). No corporate buzzwords, no flowery fluff.
  2. **Cut and Dried:** No polite filler, no essays, no apologetic or sycophantic padding ("Yes sir", "My apologies", "I'd be happy to"). Jump straight to the facts, rates, and numbers.
  3. **Zero AI Hallucination:** Never invent or hallucinate fares, kilometer packages, or discounts. Strictly quote only verified rates:
     - **1-Day Tour Packages (All-Inclusive with tolls & driver bata):** Pondicherry ₹4,500 flat (Sedan), Tirupati ₹6,000 flat, Kanchipuram ₹3,500 flat, Thiruvannamalai ₹6,500 flat.
     - **Outstation Round Trip (Per-km + bata, tolls actuals):** Sedan ₹14/km + ₹500 bata (min 250 km/day), Ertiga ₹17/km + ₹500 bata, Innova ₹20/km + ₹600 bata, Crysta ₹22/km + ₹700 bata, Tempo 12S ₹24/km + ₹800 bata (min 300 km/day).
  4. **Restaurant-Bill Format:** Keep quotations point-by-point, formatted like a clean bill with itemized car, bata, included km, and payment terms (₹500 advance to confirm).

See [docs/06_MEMORY.md](./docs/06_MEMORY.md) for full system context.


