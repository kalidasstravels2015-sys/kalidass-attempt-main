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

See [docs/06_MEMORY.md](./docs/06_MEMORY.md) for full system context.

