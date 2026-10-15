# Kalidass Travels — Google Material Design 3 (M3) System Reference

> **Last Updated:** October 13, 2026  
> **Framework:** Astro + Tailwind CSS + React  
> **Official Baseline:** [Google Material Design 3 Guidelines](https://m3.material.io/get-started)  
> **Full Print & Poster System:** See [docs/08_BRAND_COLOR_SYSTEM.md](./docs/08_BRAND_COLOR_SYSTEM.md) & [Brand PDF Specification](./brand/Kalidass_Travels_Brand_Style_Guide.pdf)  
> **Theme Direction:** Option A — Executive Midnight Charcoal & Onyx  
> **Primary Seed:** Executive Midnight Charcoal (`#1E252D` | PMS 433 C | CMYK 74,63,53,57)  
> **Brand Identity Accent:** Signature Logo "K" Red (`#EC221F` | PMS 1795 C | Rule 2 Protected)  
> **Typography & Rates:** Crisp Midnight Slate Charcoal (`#111827` — never red)  
> **Icons:** Google Material Symbols Outlined  

---

## 1. M3 Typescale Architecture

The typography system follows the official **15-role Google Material Design 3 Typescale**, fully mapped in `tailwind.config.mjs`:

| Role | Token Class | Font Size / Line Height | Tracking | Weight | Semantic Usage |
|---|---|---|---|---|---|
| **Display Large** | `text-m3-display-l` | 57px / 64px | -0.25px | 400 (or bold variant) | High-impact hero banners, landing visual anchors |
| **Display Medium** | `text-m3-display-m` | 45px / 52px | 0 | 400 | Large hero sub-banners, marketing impact phrases |
| **Display Small** | `text-m3-display-s` | 36px / 44px | 0 | 400 | Mobile hero display titles |
| **Headline Large** | `text-m3-headline-l` | 32px / 40px | 0 | 400 | Primary section headers (`H2`) on desktop |
| **Headline Medium** | `text-m3-headline-m` | 28px / 36px | 0 | 400 | Interior page titles (`H1`), section headers on tablet |
| **Headline Small** | `text-m3-headline-s` | 24px / 32px | 0 | 400 | Section headers on mobile, modal title banners |
| **Title Large** | `text-m3-title-l` | 22px / 28px | 0 | 400 / 600 | Top App Bar titles, featured card headings |
| **Title Medium** | `text-m3-title-m` | 16px / 24px | +0.15px | 500 / 600 | Standard card titles (`H3`), accordion summaries |
| **Title Small** | `text-m3-title-s` | 14px / 20px | +0.1px | 500 | Compact card headers, table column groups |
| **Body Large** | `text-m3-body-l` | 16px / 24px | +0.5px | 400 | Editorial lead paragraphs, descriptive copy |
| **Body Medium** | `text-m3-body-m` | 14px / 20px | +0.25px | 400 | Standard body copy, reviews, FAQ answers |
| **Body Small** | `text-m3-body-s` | 12px / 16px | +0.4px | 400 | Secondary descriptions, vehicle specifications |
| **Label Large** | `text-m3-label-l` | 14px / 20px | +0.1px | 500 / 600 | Action buttons, prominent chips, tabs |
| **Label Medium** | `text-m3-label-m` | 12px / 16px | +0.5px | 500 | Assist chips, table headers, compact badges |
| **Label Small** | `text-m3-label-s` | 11px / 16px | +0.5px | 500 | Metadata timestamps, caption labels, legal links |

---

## 2. Dynamic Color & Surface Hierarchy (100% Google M3 Specification)

The color system implements Google Material Design 3's **Executive Midnight Charcoal & Onyx** with brand logo accent harmony and full dual-scheme (Light + Dark) support:

### Primary & Accent Tonal Palette (Light Scheme)
- **Primary:** `bg-m3-primary` (`#1E252D` - Tone 40) — Executive Midnight Onyx (12.5:1 WCAG AAA contrast on white)
- **On Primary:** `text-m3-on-primary` (`#FFFFFF` - Tone 100)
- **Primary Container:** `bg-m3-primary-container` (`#E2E5EA` - Tone 90) — Soft Executive Light Slate container
- **On Primary Container:** `text-m3-on-primary-container` (`#101418` - Tone 10)
- **Primary Fixed:** `bg-m3-primary-fixed` (`#E2E5EA` - Tone 90)
- **Primary Fixed Dim:** `bg-m3-primary-fixed-dim` (`#C6CAD0` - Tone 80)
- **On Primary Fixed:** `text-m3-on-primary-fixed` (`#101418` - Tone 10)
- **On Primary Fixed Variant:** `text-m3-on-primary-fixed-variant` (`#374151` - Tone 30)
- **Secondary:** `bg-m3-secondary` (`#475467` - Tone 40) — Harmonized Slate Steel Charcoal
- **On Secondary:** `text-m3-on-secondary` (`#FFFFFF` - Tone 100)
- **Secondary Container:** `bg-m3-secondary-container` (`#EAECF0` - Tone 90)
- **On Secondary Container:** `text-m3-on-secondary-container` (`#1D2939` - Tone 10)
- **Secondary Fixed:** `bg-m3-secondary-fixed` (`#EAECF0` - Tone 90)
- **Secondary Fixed Dim:** `bg-m3-secondary-fixed-dim` (`#BAC7DE` - Tone 80)
- **On Secondary Fixed:** `text-m3-on-secondary-fixed` (`#1D2939` - Tone 10)
- **On Secondary Fixed Variant:** `text-m3-on-secondary-fixed-variant` (`#3B485A` - Tone 30)
- **Tertiary:** `bg-m3-tertiary` (`#8B5000` - Tone 40) — Saffron & Temple Golden Amber for ratings, reviews, and travel badges
- **On Tertiary:** `text-m3-on-tertiary` (`#FFFFFF` - Tone 100)
- **Tertiary Container:** `bg-m3-tertiary-container` (`#FFDCBE` - Tone 90) — Warm champagne accent container
- **On Tertiary Container:** `text-m3-on-tertiary-container` (`#2C1600` - Tone 10)
- **Tertiary Fixed:** `bg-m3-tertiary-fixed` (`#FFDCBE` - Tone 90)
- **Tertiary Fixed Dim:** `bg-m3-tertiary-fixed-dim` (`#FFB870` - Tone 80)
- **On Tertiary Fixed:** `text-m3-on-tertiary-fixed` (`#2C1600` - Tone 10)
- **On Tertiary Fixed Variant:** `text-m3-on-tertiary-fixed-variant` (`#6A3C00` - Tone 30)
- **Success:** `bg-m3-success` (`#006D3B` - Tone 40) — M3 Custom Harmonized Green for confirmations & inclusions
- **On Success:** `text-m3-on-success` (`#FFFFFF` - Tone 100)
- **Success Container:** `bg-m3-success-container` (`#B7F1C4` - Tone 90)
- **On Success Container:** `text-m3-on-success-container` (`#00210E` - Tone 10)
- **Error:** `bg-m3-error` (`#BA1A1A` - Tone 40)
- **On Error:** `text-m3-on-error` (`#FFFFFF` - Tone 100)
- **Error Container:** `bg-m3-error-container` (`#FFDAD6` - Tone 90)
- **On Error Container:** `text-m3-on-error-container` (`#410002` - Tone 10)
- **Brand Red Accent:** `text-logo-red` (`#EC221F`) — Reserved strictly for the "K" logo mark only (never used for live status pulse indicators, rates, or copy)

### Surface Container Elevation Ladder (Light Scheme)
M3 surfaces use authentic anti-glare neutral container lightness layers:
- **Canvas Base:** `bg-m3-surface` (`#F9FAFB` - Tone 98) — Clean, modern canvas
- **Surface Dim:** `bg-m3-surface-dim` (`#E5E7EB` - Tone 87)
- **Surface Bright:** `bg-m3-surface-bright` (`#FFFFFF` - Tone 100)
- **Surface Low (Alternating Sections):** `bg-m3-surface-container-low` (`#F3F4F6` - Tone 96)
- **Surface (Elevated Cards/Sheets):** `bg-m3-surface-container-lowest` (`#FFFFFF` - Tone 100)
- **Surface Container:** `bg-m3-surface-container` (`#ECEEF1` - Tone 94) — Input fields, search bars
- **Surface Container High:** `bg-m3-surface-container-high` (`#E8EAED` - Tone 92) — Active nav pills, chips
- **Surface Container Highest:** `bg-m3-surface-container-highest` (`#E2E4E9` - Tone 90) — Subtle dividers & unselected borders
- **On Surface (Rates & Headlines):** `text-m3-on-surface` (`#111827` - Tone 10) — Deep Midnight Onyx for maximum clarity (never red!)
- **On Surface Variant:** `text-m3-on-surface-variant` (`#4B5563` - Tone 30) — Secondary copy & icons
- **Outline:** `border-m3-outline` (`#6B7280` - Tone 50) — Accessible form strokes (4.8:1 WCAG Non-Text)
- **Outline Variant:** `border-m3-outline-variant` (`#C9CDD3` - Tone 80) — Subtle structural divider strokes
- **Inverse Surface:** `bg-m3-inverse-surface` (`#1F2937` - Tone 20) — Top app bar scrolled state & dark overlays
- **Inverse On Surface:** `text-m3-inverse-on-surface` (`#F9FAFB` - Tone 95)
- **Inverse Primary:** `text-m3-inverse-primary` (`#9CA3AF` - Tone 80)
- **Surface Tint:** `bg-m3-surface-tint` (`#1E252D` - Tone 40) — Dynamic elevation surface tint layer

### Official Google M3 Dark Scheme Specification
Automatically active under `@media (prefers-color-scheme: dark)` and `html[data-theme="dark"]`:
- **Primary (Tone 80):** `#C0C7D2` | **On Primary (Tone 20):** `#151C24`
- **Primary Container (Tone 30):** `#2A3139` | **On Primary Container (Tone 90):** `#DCE3EE`
- **Secondary (Tone 80):** `#BAC7DE` | **On Secondary (Tone 20):** `#243143`
- **Secondary Container (Tone 30):** `#3B485A` | **On Secondary Container (Tone 90):** `#D6E3FB`
- **Tertiary (Tone 80):** `#FFB871` | **On Tertiary (Tone 20):** `#4A2800`
- **Tertiary Container (Tone 30):** `#6A3C00` | **On Tertiary Container (Tone 90):** `#FFDCBE`
- **Success (Tone 80):** `#80D99C` | **On Success (Tone 20):** `#00391C`
- **Success Container (Tone 30):** `#00522B` | **On Success Container (Tone 90):** `#B7F1C4`
- **Error (Tone 80):** `#FFB4AB` | **On Error (Tone 20):** `#690004`
- **Error Container (Tone 30):** `#930009` | **On Error Container (Tone 90):** `#FFDAD6`
- **Dark Surface Hierarchy:** Surface Tone 6 (`#0B0F13`), Container Low Tone 10 (`#111827`), Container Tone 12 (`#151C24`), Container High Tone 17 (`#1E252D`), Container Highest Tone 22 (`#252D37`)
- **Dark Text & Outlines:** On Surface Tone 90 (`#E2E4E9`), On Surface Variant Tone 80 (`#C9CDD3`), Outline Tone 60 (`#8A919B`), Outline Variant Tone 30 (`#404750`)

---

## 3. Shape Scale & Elevation System

### M3 Shape Scale
| Token Class | Border Radius | Component Usage |
|---|---|---|
| `rounded-m3-none` | 0px | Full bleed media banners |
| `rounded-m3-xs` | 4px | Small indicator tags, micro status pips |
| `rounded-m3-sm` | 8px | Form inputs, select dropdowns |
| `rounded-m3-md` | 12px | Compact cards, quick answer items |
| `rounded-m3-lg` | 16px | Standard cards, FAQ accordions, feature tiles |
| `rounded-m3-xl` | 24px | Elevated fleet & tour cards, modals |
| `rounded-m3-2xl` | 28px | Navigation Drawers, Dialog containers |
| `rounded-m3-full` | 9999px | Buttons, Assist Chips, Active Nav Pills, FAB |

### M3 Multi-Layer Elevation Shadows
- `shadow-m3-0`: None (flat / outline components)
- `shadow-m3-1`: Resting cards, assist chips (`0px 1px 3px 1px rgba(15,23,42,0.08)`)
- `shadow-m3-2`: Hovered cards, Top App Bar scrolled state
- `shadow-m3-3`: Floating Action Button (FAB), active dialogs
- `shadow-m3-4`: Modal Navigation Drawer (`0px 6px 10px 4px rgba(15,23,42,0.09)`)
- `shadow-m3-5`: High-impact system overlays

---

## 4. Google Material Symbols Outlined Standard

All icons across the application use **Google Material Symbols Outlined**:
```html
<!-- Material Symbol Icon Usage -->
<span class="material-symbols-outlined text-lg leading-none" aria-hidden="true">
  directions_car
</span>
```
Key icons in standard usage:
- Navigation & Status: `menu`, `close`, `expand_more`, `verified_user`, `star`
- Travel & Fleet: `directions_car`, `local_taxi`, `airport_shuttle`, `map`, `route`
- Contact & Actions: `call`, `support_agent`, `schedule`, `translate`, `share`, `calculate`

---

## 5. M3 Standard Component Recipes

### 1. Top App Bar & Active Pill
```html
<header class="sticky top-0 z-50 bg-m3-surface/90 backdrop-blur-md border-b border-m3-outline-variant/60 shadow-m3-1">
  <nav class="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 sm:h-20">
    <!-- Active Nav Indicator Pill -->
    <a href="/fleet" class="px-4 py-2 rounded-m3-full bg-m3-primary/10 text-m3-primary font-semibold text-m3-label-l">
      Fleet
    </a>
  </nav>
</header>
```

### 2. M3 Filled Action Button
```html
<a href="#booking-panel" class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-m3-primary hover:bg-crimson-800 text-m3-on-primary font-bold text-m3-label-l rounded-m3-full shadow-m3-1 hover:shadow-m3-2 transition-all">
  <span>Book Your Ride</span>
  <span class="material-symbols-outlined text-base">arrow_forward</span>
</a>
```

### 3. M3 Filled Tonal Button
```html
<button class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-m3-primary/10 hover:bg-m3-primary/20 text-m3-primary font-semibold text-m3-label-l rounded-m3-full transition-colors">
  <span>View Itinerary</span>
  <span class="material-symbols-outlined text-base">arrow_forward</span>
</button>
```

### 4. M3 Assist Chip
```html
<div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-m3-full bg-m3-surface border border-m3-outline-variant text-m3-on-surface text-m3-label-m shadow-m3-1">
  <span class="material-symbols-outlined text-m3-primary text-base">verified</span>
  <span>Transparent Pricing</span>
</div>
```

### 5. Extended Floating Action Button (FAB)
```html
<a href="tel:+919244222333" class="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2.5 px-5 py-3.5 bg-m3-primary hover:bg-crimson-800 text-m3-on-primary font-bold text-m3-label-l rounded-m3-full shadow-m3-3 hover:shadow-m3-4 transition-all">
  <span class="material-symbols-outlined text-xl">call</span>
  <span>24/7 Helpline</span>
</a>
```

### 6. Modal Navigation Drawer
```html
<aside id="mobile-menu" class="fixed inset-y-0 right-0 z-50 w-full sm:w-80 bg-m3-surface rounded-l-m3-2xl shadow-m3-4 border-l border-m3-outline-variant transform translate-x-full transition-transform duration-300 ease-in-out p-6">
  <!-- Nav item with M3 state layer -->
  <a href="/fleet" class="flex items-center gap-3 px-4 py-3 rounded-m3-full hover:bg-m3-surface-container-high transition-colors text-m3-label-l text-m3-on-surface">
    <span class="material-symbols-outlined">directions_car</span>
    <span>Our Fleet</span>
  </a>
</aside>
```

---

## 6. Typography Hygiene & Touch Target Standards

1. **Strict No Faux-Italics Rule:**  
   Because only normal-weight Latin `plus-jakarta-sans-latin.woff2` is loaded, never use `font-style: italic` or `<i>` on body sans-serif text. The browser synthetically distorts geometric sans-serif curves into sheared oblique angles. Testimonials must use clean, normal-weight typography (`text-xs sm:text-sm text-m3-on-surface font-normal leading-relaxed`).

2. **No Monospace Contamination:**  
   Do not use `font-mono` on customer-facing navigation chips, headers, or buttons. All consumer UI elements strictly use `font-sans` (`Plus Jakarta Sans`).

3. **Button Label & Touch Target Standards (WCAG 2.1 AA/AAA):**  
   - All interactive action buttons must have a **minimum height of 38px on mobile** and **44–48px on desktop**.
   - Button font size must never drop below **12px (`text-xs` / `text-m3-label-m`)**. Never use `text-micro` (10px) on interactive buttons.
   - Paragraph and descriptive card text must never use `text-badge` (11px bold); use `text-xs sm:text-sm text-m3-on-surface-variant font-normal leading-relaxed`.

4. **Section Heading Uniformity:**  
   Headlines must maintain uniform, high-contrast `#111827` (`text-m3-on-surface`). Never use pseudo-accent spans like `<span class="text-m3-primary">` on charcoal headers, which creates barely perceptible color jitter.

