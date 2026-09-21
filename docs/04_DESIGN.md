# Design System & UI/UX Guidelines
## Project: Kalidass Travels
**Document Version:** 1.0.0  
**Design Standard:** Google Material Design 3 (M3)  
**Theme:** Executive Midnight Charcoal & Onyx with Warm Amber & Slate Harmony  
**Target Viewports:** Mobile-First (360px–428px), Tablet (768px–1024px), Desktop (1280px–1920px)  

---

## 1. Visual Brand Identity & Design Principles

### 1.1 Core Principles
1. **Executive Clarity & Trust:** Clean, anti-glare surfaces designed for readability under bright South India sunlight.
2. **Zero Visual Noise:** High-contrast information hierarchy where prices, vehicle capacities, and routes are instantly legible.
3. **Thumb-Zone Accessibility:** Critical actions (Call Now, WhatsApp, Book Now) remain permanently within easy reach of one-handed smartphone users.
4. **M3 Material Authenticity:** Subtle tonal elevation shifts rather than heavy artificial shadows or garish gradients.

---

## 2. Dynamic Color & Surface Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ Executive Midnight Charcoal (#1E252D) - Primary Action / Nav │
├─────────────────────────────────────────────────────────────┤
│ Slate Steel Charcoal (#475467) - Secondary Accent / Subheads│
├─────────────────────────────────────────────────────────────┤
│ Warm Golden Amber (#6D5E0F / #F8E287) - Ratings / Yatras   │
├─────────────────────────────────────────────────────────────┤
│ Brand Logo Red (#EC221F) - Strictly "K" Logo & Live Status  │
├─────────────────────────────────────────────────────────────┤
│ Rates & Prices: Deep Onyx Slate (#1A1C1E / #111827) - NEVER RED│
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Tonal Color Palette
| Color Token | Hex Code | Material Tone | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `bg-m3-primary` | `#1E252D` | Tone 40 | Executive Charcoal. Primary buttons, selected states, top headers. |
| `text-m3-on-primary` | `#FFFFFF` | Tone 100 | White text on primary buttons and dark surfaces. |
| `bg-m3-primary-container`| `#E2E5EA` | Tone 90 | Soft light slate container for subtle badge highlights. |
| `text-m3-on-primary-container`| `#101418` | Tone 10 | Dark text inside primary containers. |
| `bg-m3-secondary` | `#475467` | Tone 40 | Harmonized slate steel for secondary buttons and outlines. |
| `bg-m3-tertiary` | `#6D5E0F` | Tone 40 | Warm Golden Amber for 5-star ratings, temple badges, and highlights. |
| `bg-m3-tertiary-container`| `#F8E287`| Tone 90 | Warm champagne accent container for review cards and special notices. |
| `text-logo-red` | `#EC221F` | Brand Accent | **Restricted Token:** Logo "K" monogram and pulsing availability dots. |

### 2.2 Surface Elevation Ladder
M3 replaces heavy shadows with tonal container elevation:
- **Canvas Base (`bg-m3-surface`):** `#F9FAFB` (Tone 98) — Main page backdrop.
- **Section Low (`bg-m3-surface-container-low`):** `#F3F4F6` (Tone 96) — Alternating full-width section bands.
- **Elevated Cards (`bg-m3-surface-container-lowest`):** `#FFFFFF` (Tone 100) — Booking card, vehicle cards, review tiles.
- **Form Inputs (`bg-m3-surface-container`):** `#ECEEF2` (Tone 94) — Input fields, search inputs, dropdown containers.
- **Active Navigation High (`bg-m3-surface-container-high`):** `#E6E8ED` (Tone 92) — Active category tabs and selected chips.
- **Borders & Dividers (`bg-m3-surface-container-highest`):** `#E0E2E7` (Tone 90) — Soft partition lines.

---

## 3. M3 Typescale Architecture

The typography is built on the official **15-Role Google Material Design 3 Typescale** with Google Fonts Inter / Outfit:

| Role | Class | Size / Height | Tracking | Weight | Semantic Placement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Large** | `text-m3-display-l` | 57px / 64px | -0.25px | 700 | Desktop Hero impact headlines |
| **Display Medium** | `text-m3-display-m` | 45px / 52px | 0px | 600 | Sub-hero feature banners |
| **Display Small** | `text-m3-display-s` | 36px / 44px | 0px | 600 | Mobile Hero main headline |
| **Headline Large** | `text-m3-headline-l` | 32px / 40px | 0px | 600 | Primary section H2 titles |
| **Headline Medium**| `text-m3-headline-m` | 28px / 36px | 0px | 500 | Service page H1, major modal titles |
| **Headline Small** | `text-m3-headline-s` | 24px / 32px | 0px | 500 | Mobile section titles, card group headers |
| **Title Large** | `text-m3-title-l` | 22px / 28px | 0px | 600 | Card titles, vehicle model names |
| **Title Medium** | `text-m3-title-m` | 16px / 24px | +0.15px | 500 | Form label headers, FAQ summary headers |
| **Title Small** | `text-m3-title-s` | 14px / 20px | +0.1px | 500 | Table column labels, badge headings |
| **Body Large** | `text-m3-body-l` | 16px / 24px | +0.5px | 400 | Editorial lead paragraphs |
| **Body Medium** | `text-m3-body-m` | 14px / 20px | +0.25px | 400 | Standard body copy, reviews, descriptions |
| **Body Small** | `text-m3-body-s` | 12px / 16px | +0.4px | 400 | Vehicle spec notes, secondary footnotes |
| **Label Large** | `text-m3-label-l` | 14px / 20px | +0.1px | 600 | Primary buttons, active nav tabs |
| **Label Medium** | `text-m3-label-m` | 12px / 16px | +0.5px | 500 | Assist chips, status badges |
| **Label Small** | `text-m3-label-s` | 11px / 16px | +0.5px | 500 | Timestamps, legal notices |

---

## 4. Shape Scale & Touch Target Standards

### 4.1 Corner Radii Tokens
- `rounded-m3-none`: 0px (Full-width edge hero image containers)
- `rounded-m3-xs`: 4px (Status pips, miniature tags)
- `rounded-m3-sm`: 8px (Form inputs, date pickers, select dropdowns)
- `rounded-m3-md`: 12px (Compact route pills, quick answer items)
- `rounded-m3-lg`: 16px (Standard cards, FAQ accordions, feature blocks)
- `rounded-m3-xl`: 24px (Fleet cards, elevated booking panel, modal dialogs)
- `rounded-m3-2xl`: 28px (Navigation drawers, full sheet overlays)
- `rounded-m3-full`: 9999px (Pill buttons, assist chips, FAB, WhatsApp CTA)

### 4.2 Touch Targets & Ergonomics
- All tap targets have a minimum clickable area of **48px x 48px** to prevent misclicks on touch screens.
- Adequate gutter spacing (minimum 12px) between adjacent buttons and chips.

---

## 5. Mobile-First Interaction Architecture

### 5.1 Floating Quick Actions Bar (`FloatingActions.astro`)
- **Positioning:** Fixed to the bottom viewport on mobile (`bottom-4 right-4`).
- **Primary Elements:**
  1. **Direct Call Button:** Phone dialer trigger with instantaneous connection to `+91 90923 03060`.
  2. **WhatsApp Action Button:** High-visibility green circular FAB triggering a direct pre-composed WhatsApp chat.
- **Scroll-Aware Behavior:** Floating bar collapses slightly when scrolling down to maximize reading space, expanding smoothly on scroll-up.

### 5.2 Virtual Keyboard Safeguards
- When the user taps origin/destination input fields on mobile devices, the virtual keyboard pushes viewport contents. The application uses the custom `useVirtualKeyboard` hook to dynamically adjust modal scroll positioning, ensuring the submit button remains visible above the keyboard.

### 5.3 Micro-Animations & Trust Indicators
- **Live Status Pulsing Pip:** Subtle 1.5s CSS pulse on the "Cabs Available in Chennai" badge creating real-time availability reassurance.
- **Card Hover Transitions:** Smooth 200ms ease-out elevation lifts (`translate-y-[-2px]` + `shadow-m3-2`) indicating interactivity on vehicle cards.
