# System Memory & Context Knowledge Base — Kalidass Travels

> **Full Document:** Please refer to the comprehensive [docs/06_MEMORY.md](./docs/06_MEMORY.md) for full Architecture Decision Records (ADRs), schema contracts, and domain memory.

### Key Facts & Memory

- **Operating Entity:** Kalidass Travels (Est. 2015, Medavakkam, Chennai).
- **Contact:** `+91 63819 39769` | `kalidasstravels2015@gmail.com`.
- **Fleet:** Swift Dzire, Toyota Etios, Maruti Ertiga, Toyota Innova, Innova Crysta, Tempo Traveller.
- **Architectural Baseline:** Astro SSG + React Islands + Tailwind M3 + Google Apps Script Webhook (`google_apps_script.js`) + Google Sheets DB.
- **Critical Gotcha:** Always submit data to Google Apps Script as `text/plain` to prevent browser CORS preflight blocks. Always enforce trailing slashes on URLs (`trailingSlash: 'always'`). Rates must never be displayed in red.

See [docs/06_MEMORY.md](./docs/06_MEMORY.md) for full system context.
