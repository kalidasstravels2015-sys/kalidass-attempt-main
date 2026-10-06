# WhatsApp Call-To-Action (CTA) Standardization

All WhatsApp call-to-action buttons across the project must use the centralized `WhatsAppButton` component and `buildWhatsAppUrl` utility.

## Core Rules

1. **Material Design 3 (M3) Tonal Styling:**
   - **Never** use raw, bright `#25D366` green background buttons for in-card or page booking CTAs.
   - Use M3 Tonal Mint styling (`bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300/80`) provided by `WhatsAppButton` (`variant="filled"` or `variant="tonal"`).
   - This ensures buttons harmonize with the card, maintain WCAG AAA contrast, and avoid harsh non-M3 color blocks.

2. **Single Source of Truth for URLs:**
   - **Never** hardcode `https://wa.me/918939539211?...` strings in components or pages.
   - Always import and call `buildWhatsAppUrl(message)` from `src/utils/whatsapp.ts`.

3. **Never Use Full-Width Booking Buttons Inside Cards or Accordions:**
   - **Never** set `fullWidth={true}` or `w-full` on a booking/WhatsApp button that sits inside an accordion panel, list card, or table row.
   - Buttons inside compact UI elements (accordions, chips, list rows) must be **inline/auto-width** (`size="sm"`, left-aligned with `justify-start`).
   - Full-width buttons are only acceptable in standalone hero sections or dedicated booking panels that are the primary CTA of the entire page section.
   - ✅ Correct: `<WhatsAppButton size="sm" variant="tonal" text="Book Pickup" />` inside an accordion
   - ❌ Wrong: `<WhatsAppButton fullWidth size="sm" text="Book Pickup" />` inside an accordion
   - ❌ Wrong: `<a class="w-full ...">Book Pickup</a>` inside an accordion

4. **Standard Component Usage:**
   - **React Components (`.jsx` / `.tsx`):**
     ```jsx
     import WhatsAppButton from './react/WhatsAppButton.jsx';

     // In-card / accordion (inline, sm, NOT full-width):
     <WhatsAppButton href={buildWhatsAppUrl(message)} size="sm" variant="tonal" text="Book Pickup" />

     // Hero / standalone CTA (full-width acceptable here only):
     <WhatsAppButton href={buildWhatsAppUrl(message)} fullWidth variant="filled" text="Book on WhatsApp" />
     ```
   - **Astro Pages / Components (`.astro`):**
     ```astro
     import WhatsAppButton from '../components/WhatsAppButton.astro';

     // In-card / accordion (inline, sm, NOT full-width):
     <WhatsAppButton href={buildWhatsAppUrl(message)} size="sm" variant="tonal" text="Book Pickup" />

     // Hero / standalone CTA (full-width acceptable here only):
     <WhatsAppButton href={buildWhatsAppUrl(message)} fullWidth variant="filled" text="Book on WhatsApp" />
     ```

