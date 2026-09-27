# Engineering, UX & Operational Rules — Kalidass Travels

> **Full Document:** Please refer to the comprehensive [docs/03_RULES.md](./docs/03_RULES.md) for complete engineering, design, tariff calculation, and operational standards.

### Critical Rules at a Glance
1. **Astro-First:** Write static components in native `.astro`. Use React (`.jsx`) only when dynamic client state is strictly necessary.
2. **Strict Color Standard:** Brand Red (`#EC221F`) is strictly reserved for the "K" logo mark only. **NEVER use red for live status pulse indicators, rates, or prices**. Tariffs must always be Midnight Onyx Slate (`#1A1C1E` / `#111827`).
3. **Outstation Minimum Billing:** 250 km/day for Sedans & standard SUVs; 300 km/day for Innova Crysta & Tempo Traveller. Driver Bata applies per calendar day.
4. **Quality Gates:** Desktop Lighthouse $\ge 95$, Mobile Lighthouse $\ge 90$, 0.000 CLS, and zero console errors.
5. **Modern Web Standards & Baseline Policy:** Target is **Baseline 2024 with progressive enhancement fallbacks**. Follow Chrome Modern Web Guidance (`.agents/skills/modern-web-guidance`) for native HTML/CSS platform primitives (native `<dialog>`, `popover`, `:user-invalid`, and top-layer animations) over heavy JS libraries.

See [docs/03_RULES.md](./docs/03_RULES.md) for full quality standards.
