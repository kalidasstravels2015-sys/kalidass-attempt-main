# Icon Standardization: Always Use Lucide SVG Icons, Never Material Symbols

## The Problem (Why Icons Broke in New/Altered Pages)
In `src/layouts/Layout.astro`, there is a local `@font-face` pointing to `/fonts/material-symbols-outlined.woff2`.
- This file is an ultra-compressed **5.6 KB subset** created for homepage Core Web Vitals (LCP). It only contains ~12 specific glyphs (`call`, `star`, `verified`, `directions_car`, etc.).
- The full Google Material Symbols font is **4.0 MB**.
- When anyone uses `<span class="material-symbols-outlined">icon_name</span>` with an icon outside the subset (such as `photo_camera`, `id_card`, `description`, `send`, `location_on`):
  1. The browser cannot find the ligature in the local 5.6 KB font.
  2. The browser renders the raw text string (e.g. `p-h-o-t-o-_-c-a-m-e-r-a`).
  3. Because `.material-symbols-outlined` has `width: 1em; height: 1em; overflow: hidden;` in `Layout.astro`, the text gets violently clipped down to a 1em box, appearing as broken glyphs, weird curves, or single letters (`C`, `I`, `≡\`).

## The Strict Rule
1. **Always use Lucide React icons (`lucide-react`) or inline SVGs** across all `.astro`, `.jsx`, and `.tsx` components and pages.
   ```astro
   ---
   import { Car, MapPin, Camera, FileText, Send, CheckCircle2 } from "lucide-react";
   ---

   <Car className="w-4 h-4 text-m3-primary" />
   <MapPin className="w-4 h-4 text-m3-on-surface-variant" />
   ```
2. **Never use `<span class="material-symbols-outlined">...</span>`** for any newly created or modified component.
3. **Benefits**:
   - Zero font-loading race conditions.
   - Zero ligature clipping or broken characters.
   - Zero network requests (pure inline vector SVGs).
   - Instant LCP render on all mobile and desktop viewports.
