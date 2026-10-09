# WhatsApp Call-To-Action (CTA) Standardization

All WhatsApp call-to-action buttons across the project must use the centralized `WhatsAppButton` component and `buildWhatsAppUrl` utility.

## Core Rules

1. **Material Design 3 (M3) Mint Palette (Always Use Mint Palette):**
   - **Always** use the Material Mint palette for all WhatsApp buttons.
   - **Never** use raw, solid `#25D366` green backgrounds or ad-hoc green button styles anywhere.
   - The M3 Mint Palette specification:
     - Surface: `bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200`
     - Typography: `text-emerald-950 font-bold`
     - Border: `border border-emerald-300/80`
     - Icon: Brand WhatsApp icon (`variant="brand"` / emerald accent)
   - Always use the standardized `WhatsAppButton` component (`variant="tonal"` or `variant="filled"`).

2. **Single Source of Truth for URLs:**
   - **Never** hardcode `https://wa.me/918939539211?...` strings in components or pages.
   - Always import and call `buildWhatsAppUrl(message)` from `src/utils/whatsapp.ts`.

3. **Strict Ban on Full-Width Buttons (Never Use Full Width):**
   - **Never** use `fullWidth={true}`, `w-full`, or stretching block widths on buttons anywhere across the application.
   - This applies unconditionally: no exceptions for hero sections, dedicated booking panels, modals, dialogs, sheets, cards, or accordions.
   - All buttons must be **inline-flex / content-sized** (auto-width with appropriate padding: `size="sm"` or `size="md"`).
   - In modals, cards, or forms, align or center the button container (`flex justify-center` or `flex justify-start`), but keep the button itself auto-sized.
   - ✅ Correct: `<WhatsAppButton size="sm" variant="tonal" text="Book Pickup" />`
   - ✅ Correct: `<WhatsAppButton size="md" variant="tonal" text="Confirm & Send on WhatsApp" />`
   - ❌ Wrong: `<WhatsAppButton fullWidth ... />`
   - ❌ Wrong: `<button class="w-full ...">...</button>`
   - ❌ Wrong: `<a class="w-full ...">...</a>`

4. **Standard Component Usage:**
   - **React Components (`.jsx` / `.tsx`):**
     ```jsx
     import WhatsAppButton from './react/WhatsAppButton.jsx';

     <WhatsAppButton href={buildWhatsAppUrl(message)} size="sm" variant="tonal" text="Book Pickup" />
     ```
   - **Astro Pages / Components (`.astro`):**
     ```astro
     import WhatsAppButton from '../components/WhatsAppButton.astro';

     <WhatsAppButton href={buildWhatsAppUrl(message)} size="md" variant="tonal" text="Book on WhatsApp" />
     ```
