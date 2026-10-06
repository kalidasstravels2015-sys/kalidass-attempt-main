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

See [docs/03_RULES.md](./docs/03_RULES.md) for full quality standards.
