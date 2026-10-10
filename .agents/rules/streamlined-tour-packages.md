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
