# Technical Architecture — Kalidass Travels

> **Full Document:** Please refer to the comprehensive [docs/02_ARCHITECTURE.md](./docs/02_ARCHITECTURE.md) for full architecture diagrams, data flows, and webhook schemas.

### Architecture Highlights
- **Framework:** Astro 4.x Static Site Generation (SSG) with React 19 Interactive Islands.
- **Styling:** Tailwind CSS 3.4 with Google Material Design 3 (M3) semantic tokens.
- **Fare Estimation:** `QuotationEngine.jsx` using Google Maps & Places Autocomplete + offline South India distance fallback table.
- **Serverless Backend:** Google Apps Script (`google_apps_script.js`) webhook receiving JSON and appending records to Google Sheets and Google Calendar.
- **Conversion Funnel:** Pre-composed WhatsApp Click-to-Chat deep links directly to `+91 90923 03060`.

See [docs/02_ARCHITECTURE.md](./docs/02_ARCHITECTURE.md) for full system specifications.
