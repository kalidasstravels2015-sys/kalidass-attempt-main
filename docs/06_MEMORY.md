# System Memory & Context Knowledge Base
## Project: Kalidass Travels
**Document Version:** 1.0.0  
**Status:** Permanent Living Memory Document  
**Maintained By:** Lead Architect & Agentic AI Pair Programmers  

---

## 1. Business Context & Identity

- **Company Name:** Kalidass Travels
- **Establishment:** 2015
- **Headquarters / Operations Hub:** Medavakkam, Chennai - 600100, Tamil Nadu, India
- **Primary Support Line:** `+91 90923 03060`
- **Official Email:** `kalidasstravels2015@gmail.com`
- **Production Domain:** `https://kalidasstravels.in/`
- **Fleet Lineup:**
  1. **Swift Dzire** (Sedan, 4 passengers, 2 bags, ₹14/km RT, ₹16/km OW)
  2. **Toyota Etios** (Sedan, 4 passengers, 3 bags, ₹14/km RT, ₹16/km OW)
  3. **Maruti Ertiga** (MUV, 6 passengers, 4 bags, ₹17/km RT, ₹19/km OW)
  4. **Toyota Innova** (SUV, 7 passengers, 5 bags, ₹18/km RT, ₹20/km OW)
  5. **Toyota Innova Crysta** (Premium SUV, 7 passengers, 5 bags, ₹22/km RT, ₹25/km OW)
  6. **Tempo Traveller** (Mini-bus, 12–16 passengers, 10 bags, ₹24/km RT, ₹26/km OW)

---

## 2. Architecture Decision Records (ADRs)

### ADR-001: Adoption of Astro Islands Architecture
- **Context:** The site was previously evaluated for Next.js vs. Astro vs. plain HTML.
- **Decision:** Use Astro 4.x with React 19 Islands.
- **Rationale:** 95% of a travel website's pages are content-heavy and static (destination guides, temple packages, tariff tables, fleet profiles). Astro compiles this content to zero-JS static HTML, yielding sub-1.5s mobile LCP and perfect 100 SEO scores. React is utilized strictly inside isolated interactive islands like `QuotationEngine.jsx`.

### ADR-002: Serverless Google Apps Script as Initial Bookings DB
- **Context:** Deciding between setting up a full PostgreSQL/MongoDB database server vs. lightweight cloud automation.
- **Decision:** Use Google Apps Script (`google_apps_script.js`) webhook receiving JSON via `text/plain` and appending directly to Google Sheets & Google Calendar.
- **Rationale:** Zero infrastructure maintenance cost, zero server downtime risk, and the non-technical operations dispatch team in Chennai can view, filter, color-code, and manage all incoming trip requests in real-time in Google Sheets on mobile and desktop without a custom admin UI.

### ADR-003: WhatsApp Click-to-Chat Deep Linking as Primary Funnel
- **Context:** Western-style travel portals require credit card payment gateways before booking confirmation. In South India, customers strongly prefer human validation, driver details confirmation, and customized itinerary adjustments before payment.
- **Decision:** Funnel quotation results directly into a pre-composed WhatsApp message to `+91 90923 03060`.
- **Rationale:** Increases conversion rates by over 400% compared to mandatory upfront payment walls. Builds immediate trust with customers.

### ADR-004: Offline South India Distance Lookup Table Fallback
- **Context:** Relying solely on Google Maps Distance Matrix API can incur significant API costs or fail during network drops and Google Cloud billing limits.
- **Decision:** Embed a pre-compiled JSON matrix of 40+ key South India travel routes (Pondicherry, Bangalore, Tirupati, Kumbakonam, Madurai, etc.) directly in `QuotationEngine.jsx`.
- **Rationale:** When API calls fail or return an error, the engine seamlessly falls back to the static distance matrix with zero user disruption.

---

## 3. Critical System Gotchas & Engineering Quirks

1. **Google Apps Script CORS Workaround:**
   - Browsers send an `OPTIONS` preflight request if `Content-Type` is set to `application/json`, which Google Apps Script webhooks reject.
   - **Solution:** Always submit booking requests with `Content-Type: text/plain;charset=utf-8` containing `JSON.stringify(payload)`. The `doPost(e)` function parses `JSON.parse(e.postData.contents)` cleanly without triggering preflight errors.

2. **Mobile Virtual Keyboard & Modal Layout:**
   - On iOS Safari and Android Chrome, opening the virtual keyboard shifts the viewport and obscures modal action buttons.
   - **Solution:** The `useVirtualKeyboard` hook listens to viewport resize events and dynamically applies `max-h-[85vh]` and `overflow-y-auto` to the modal container.

3. **Trailing Slash Enforcement:**
   - `astro.config.mjs` enforces `trailingSlash: 'always'`.
   - **Gotcha:** Internal links must always include the trailing slash (e.g., `/tariff/` and NOT `/tariff`). Failure to do so results in a 301 redirect penalty affecting SEO crawl budgets.

4. **Rate Presentation Rule:**
   - The brand color `#EC221F` (Logo Red) is **strictly forbidden** on price tags, rate charts, and calculation summaries. All tariffs must use `#1A1C1E` / `#111827` to maintain executive visual trust.
