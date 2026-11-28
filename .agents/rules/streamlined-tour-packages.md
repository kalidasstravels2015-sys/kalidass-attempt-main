# Streamlined Tour Package Architecture & SEO Preservation

When optimizing, refactoring, or adding tour package pages (`src/pages/services/[slug].astro`), follow these strict invariants to ensure high mobile conversion and 100% preservation of Schema.org rich snippets.

## Invariant 1: Schema.org Decoupling from Visual Presentation
- **Never couple Schema.org generation to visual DOM elements.**
- Structured data (`TaxiService`, `TouristTrip`, `Product`, `AggregateOffer`, `FAQPage`, `BreadcrumbList`) must always be synthesized directly from canonical backend data models (`serviceDetails.json`, `service.tariff.rows`, `PILGRIM_ROUTES`, and `service.faq`).
- Even if visual vehicle cards are replaced by an interactive booking engine or horizontal carousel, the `Product` schema with `AggregateOffer` and `TaxiService` offers MUST remain completely populated with valid pricing, currency, seller, and price specifications.

## Invariant 2: Split-Hero Architecture Above the Fold
- **Desktop (sm+)**: Use a 2-column layout:
  - **Left Column**: Category chip, SLA badge, H1, concise 1-2 sentence overview, visual monument photo card with starting rate pill, and desktop Inclusions Matrix.
  - **Right Column**: Interactive dedicated booking engine positioned in the initial viewport for immediate engagement (`Book Chennai to [Destination]`).
- **Mobile (<sm)**:
  - Compact title & photo card with starting fare badge.
  - **Mobile Trust Strip**: Single compact bar (`✓ ₹0 Advance • ✓ Tolls Included • ✓ Standby / Hill Road`) replacing repetitive text blocks.

## Invariant 3: Calibrated `#facts` Direct Answer Block (Google AI / Rich Snippet)
- Include a cut-and-dried `<p data-speakable="true">` snippet directly answering user search intent (e.g., "What is the [Service] Fare & Inclusions?").
- Dynamic content: Must pull exact starting fares, km limits, and package-specific inclusions from `PILGRIM_ROUTES` registry rather than hardcoded generic text.
- 3-point or 4-point compact metric bar (`Total Distance`, `Travel Time`, `Tolls & Permits`) without redundant vehicle price repetitions.

## Invariant 4: Mobile Scroll Space Compression
1. **Fleet Presentation**: Use horizontal snap-scroll carousels (`#fleet-carousel-track`) on mobile instead of stacking 5-6 tall vehicle cards vertically. Connect cards via "Select in Booking Engine ↑" buttons that dispatch custom events to the hero engine.
2. **Travel Guide Section**: Implement a 2-tab mobile switcher (`⏰ Timings & Dress Code` vs `🛕 Sthala Puranam & Tips`), reducing mobile vertical scrolling by ~600px.
3. **Conversion Banner Elimination**: Remove redundant full-width dark conversion banners at the bottom if sticky quick-nav and hero booking engines already provide clear conversion paths.
4. **Compare Table Placement**: Position the "Why Us vs Aggregators" comparison table below the itinerary and guide, directly preceding FAQs.

## Invariant 5: Full Group Fleet Coverage (Beyond 12-Seater)
- **Never stop fleet listings or tariff tables at 12-Seater Tempo Traveller.**
- For temple tours, family celebrations, and group outstation packages, include the full Master Tariff fleet when applicable:
  - Cars & MPVs: `Swift Dzire / Toyota Etios` (4+1), `Maruti Ertiga / XL6` (6+1), `Toyota Innova` (7+1), `Innova Crysta` (7+1)
  - Group Coaches: `12-Seater Tempo Traveller` (12+1), `14-Seater Tempo Traveller` (14+1), `17-Seater Tempo Traveller` (17+1), `Force Urbania (16+1 VIP)`, `20-Seater Grand Tempo` (20+1), `26-Seater Mini Bus` (26+1)

## Invariant 6: Carousel Price Formatting, Subtext & Live Content Verification
- **Enable Carousel Mode:** Add every new tour slug in `src/pages/services/[slug].astro` to `hasDedicatedEngine` (and `isTempleTour` when applicable) so it renders the horizontal `#fleet-carousel-track` instead of the fallback 2-column grid.
- **Clean Single-Line Card Prices:** In `serviceDetails.json`, name the tariff price column header to match `totalCostIdx` (e.g., `Outstation Package Cost` or `Round-Trip Flat Cost`), place only the short fare (e.g., `₹8,200`) in that cell, and never start `Key Highlights` with `₹`.
- **Accurate Subtext:** Set `cardPriceSubtext` in `[slug].astro` to state whether tolls are included or extra (e.g., `550 Km Round Trip (Bata Inc., Tolls Extra)`).
- **Web-Verified Temple & Route Info:** Verify current temple darshan/pooja timings, dress codes, and highway/toll details via web search before finalizing `routePlan`, `travelGuide`, and `faq`.
- **Structured `travelGuide` & Official HR&CE Portals:** Always format `travelGuide` as a structured object (`history`, `timings`, `dressCode`, `tips`)—never a plain string—so the 4-card Darshan Guide populates cleanly. For Tamil Nadu temples, include `travelGuide.officialPortal` pointing to its dedicated **TN HR&CE (`hrce.tn.gov.in`)** page (`index_temple.php?tid=...`).
