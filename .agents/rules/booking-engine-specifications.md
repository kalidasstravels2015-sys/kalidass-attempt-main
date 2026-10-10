# Booking Engine Design & Component Specifications

All booking engines, quotation calculators, and trip booking components across the project must follow these architectural guidelines:

## 1. Trip Duration & Date Handling
- **Auto-Calculate Duration**: Never use separate manual duration buttons (e.g. 1 Day / 2 Days / 3 Days) if dates are selected. Always calculate trip duration (`days`) automatically from `pickupDate` and `dropDate` (Return Date).
- **Date Constraints**: Always enforce `min={pickupDate}` on the drop/return date picker. When `pickupDate` is changed to a date past `dropDate`, automatically synchronize `dropDate` to match.
- **Same-Day Return**: If `dropDate === pickupDate`, duration is 1 Day (Same Day Return). If `dropDate === pickupDate + 1`, duration is 2 Days (1 Night Stay), etc.

## 2. Layout & Pairing Invariants
- **Side-by-Side Pairing (`grid grid-cols-2`)**:
  - Pair `Pickup Date` and `Drop Date (Return)` in the same row.
  - Pair `Pickup Time` and `Trip Duration` in the same row.
  - Pair `Passengers` and `Vehicle Model` in the same horizontal row across all viewports including mobile (`grid-cols-2`).
- **Dynamic Vehicle Auto-Filtering**:
  - Changing passenger count must immediately filter out vehicles with insufficient capacity.
  - If the currently selected vehicle cannot accommodate the new passenger count, automatically upgrade to the first eligible vehicle.

## 3. Minimalist Presentation & Flat Hierarchy (No Card Inside Card)
- **No Nested Cards**: Do not nest cards inside cards. The booking engine should be a single unified card or section container; form fields and fare summaries must sit directly on the surface without boxed sub-panels, dark inner cards, or redundant nested borders.
- **No Marketing Titles Inside Booking Card**: Omit verbose marketing titles (such as "Ready to Book Your..."). The booking engine should start immediately with the functional configuration fields.
- Avoid redundant quick-pickup chips or excessive helper text that pushes booking actions below the fold.
- Keep fixed destinations (e.g. Tirupati Tirumala Balaji Temple) as a subtle badge or confirmation notice rather than editable input fields.

## 4. Site Default Theme & Color Discipline
- **Container Theme**: Use the site default theme (`bg-m3-surface`, `text-m3-on-surface`, `border-m3-outline-variant`, `shadow-m3-1`). Inputs should use standard clean white/light styling (`bg-white`, `border-m3-outline-variant`, `text-m3-on-surface`). Avoid dark inverse slabs (`bg-m3-inverse-surface`) unless explicitly requested.
- **Color Discipline (No Rainbow/Multi-Color Icons)**: Keep field icons, labels, and badges in a calm, neutral, monochromatic palette (`text-m3-on-surface-variant`, neutral containers). Do NOT use multiple competing accent colors (such as blue, amber, green, purple) across form field labels.
- **WhatsApp CTA**: The standardized `WhatsAppButton` (with its M3 Mint Palette) should be the sole prominent color accent for conversion. Never stretch buttons to full width (`w-full` is prohibited).

## 5. Government Regulatory Compliance & Fair Tariff Policies
All tariff calculators, booking engines, and quote generators must adhere to statutory consumer protections and standard transport regulations:

- **Mandatory Regulatory Cross-Checking**: Before introducing any penalty, surcharge, waiting fee, or cancellation charge, cross-check against applicable Motor Vehicles Rules, Consumer Protection Act standards, and transport authority guidelines.
- **Strict Distinction between Night Batta vs. Night Halt**:
  - **Night Driving Allowance (Night Batta: ₹300–₹500)**: Applies *only* when the driver actively drives during late night hours (11:00 PM to 4:00 AM/6:00 AM) on same-day returns.
  - **Night Halt (₹1,000–₹1,500)**: Applies *strictly* when the vehicle and driver remain parked outstation overnight for a multi-day itinerary. Never charge a halt fee if the vehicle returns home that night.
  - **Multi-Day Package Invariant**: Multi-day tour packages (2+ days) already bundle driver night halt and room allowances into the base package rate. Never double-charge night halt on top of multi-day package tariffs.
- **Mandatory Traffic Grace Period**:
  - Always provide a minimum **1-hour traffic grace period** for evening returns (e.g., standard returns up to 11:00 PM incur ₹0 extra charge) to accommodate highway toll plaza and city entry delays.
- **Fair Pro-Rata Hourly Outstation Pricing (No Unfair Tariff Jumps)**:
  - Under the Consumer Protection Act (2019) and State Transport fair trade practices, when trips exceed 24 hours into intermediate durations (e.g. 25–36 hours, such as departing Saturday evening and returning Sunday night), do NOT abruptly charge a flat 2-day package rate (+₹3,500 extra).
  - Apply the statutory pro-rata overage model:
    `Fare = min(Base 1-Day Rate + Driver Night Stay Allowance + (Extra Hours × Extra Hour Rate), Full 2-Day Package Rate)`
  - Always enforce a hard ceiling cap: the customer must never pay more than the full multi-day package rate for that tier.
- **Strict Prohibition on Premature Multi-Day Package Labeling**:
  - Trips between 24 and 48 hours must **never** be labeled as "2 Days Package" in banners, duration badges, or copy.
  - They must strictly display as **`1 Day + X hr(s)`** (e.g. `1 Day + 1 hr`, `1 Day + 5 hrs`) with subtext `1 Night Stay`.
  - The term "2 Days Package" is strictly reserved for itineraries that hit the hard ceiling cap or represent a full 2-day sightseeing tour.
- **Grace Period Overage Hour Billing**:
  - A 1-hour traffic grace window ($24 < H \le 25$) is included at ₹0 surcharge.
  - Billable extra hours begin strictly after the 25-hour mark: `Extra Hours = ceil(H - 25)`. Never bill for the free grace hour (e.g., 25.9 hours = 1 billable extra hour, not 2).
- **Banner Independence from Vehicle Selection**:
  - Trip duration, pro-rata status, and "Why?" reasoning must render immediately from pickup/return dates alone, regardless of whether passenger or vehicle dropdowns have been chosen yet.
- **Customer Schedule Autonomy (Zero Patronizing Timing Advice)**:
  - Travel scheduling is 100% the customer's personal choice and convenience.
  - Never display unsolicited, patronizing timing advice telling customers when they should travel or return (e.g., "Change your return time to save money").
  - Instead, compute fair, transparent pricing automatically and explain the itemized breakdown objectively when the customer requests details (via "Why?").

## 6. Material Design 3 (M3) Dropdown & Select Field Specifications
All dropdown select controls (such as Passengers, Vehicle Model, Trip Type, and Route selectors) must strictly follow the Material Design 3 Outlined Select Field pattern:

- **Mandatory M3 Container Wrapper (`relative flex items-center`)**:
  - Every `<select>` must be wrapped inside a `relative flex items-center bg-white border border-m3-outline-variant hover:border-m3-outline rounded-m3-lg transition-colors focus-within:border-m3-primary focus-within:ring-2 focus-within:ring-m3-primary/20 shadow-2xs` container.
- **Suppression of Native Browser Arrows (`appearance-none`)**:
  - The `<select>` element must always include `appearance-none bg-transparent outline-none cursor-pointer pr-8 sm:pr-9 text-xs sm:text-sm font-semibold text-m3-on-surface`.
  - Native browser drop-down arrows must NEVER be displayed as they introduce cross-platform visual misalignment, font-metric clipping, and inconsistent OS rendering.
- **Dedicated Centered Trailing Chevron (`ChevronDown`)**:
  - A Lucide `ChevronDown` icon (`w-4 h-4 text-m3-on-surface-variant pointer-events-none shrink-0`) must be positioned at `absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2`.
  - `pointer-events-none` guarantees that user clicks anywhere on the right-hand arrow trigger the native select sheet/dropdown menu without blocking interaction.
- **Harmonized Field Heights (Min 44px–48px Touch Target)**:
  - Input and select fields must maintain consistent vertical rhythm (`py-2 sm:py-2.5` with minimum 44px–48px tap targets) to align seamlessly when paired side-by-side in `grid grid-cols-2` layouts.
- **Accessible Disabled States**:
  - When disabled (e.g., Vehicle selection before Passenger count is picked), the wrapper must receive `bg-m3-surface-container-low border-m3-outline-variant/60 opacity-60 cursor-not-allowed` and the select element must carry `disabled:cursor-not-allowed`.

## 7. Passenger-First Rate Summary & Progressive Disclosure
All fare summary cards and checkout actions must prioritize a calm, frictionless experience for everyday passengers:

- **Progressive Disclosure for Corporate/GST**:
  - Never display loud billing segmented buttons or mandatory business fields above the booking CTAs.
  - Corporate GST billing must be presented as a subtle, optional checkbox at the bottom of the card: `[ ] Need GST Tax Invoice for Corporate (+5% ITC)`.
  - Recipient fields (Company Name, Client GSTIN, Mobile) and tax calculation badges must smoothly expand *only* when the checkbox is active.
- **Frictionless WhatsApp Booking**:
  - Passenger/Devotee Name must always be optional and non-blocking.
  - Clicking `Book on WhatsApp` in retail cash mode must immediately open WhatsApp pre-filled with the trip manifest without auto-downloading PDF files to mobile devices or displaying "attach PDF" instructions.
  - Standalone document generation is reserved exclusively for corporate/GST workflows or manual `Save PDF` button clicks.

## 8. Rate Summary Copy Discipline & Invariants
- **Single "All-Inclusive" Invariant**:
  - The term "All-Inclusive" must appear **strictly once** on the entire rate summary card, placed in the badge directly beside the hero price (e.g., `₹ 6,000 [✓ All-Inclusive Fixed Fare]`).
  - Do NOT repeat "All-Inclusive", "Included", or "Inclusions" in the guarantee heading, inclusions subtext, or breakdown buttons.
  - **Inclusions Subtext**: Use `Covers FASTag Tolls + AP Permit + Ghat Road + Driver Bata` (never `... Included`).
  - **Breakdown Toggle**: Use `View Itemized Fare Breakdown` and `Hide Itemized Fare Breakdown` (never `... & Inclusions`).
- **Minimalist Rate Summary (Zero Banner Fatigue)**:
  - Do not add noisy guarantee headlines (such as `Zero Hidden Charges Guarantee` or `Corporate Tax Invoice Guarantee` with shield icons) above the inclusions.
  - Do not add redundant advance bullet points (such as `Zero Advance Required • Pay Chauffeur After Darshan / Return`) under the price, as token advance terms are already detailed inside the itemized breakdown table (`Advance Token Payment: ₹0`).
  - Do not place verbose links (such as `View Full Government Format Proforma Letterhead`) at the bottom of the breakdown table or corporate box. Keep document export discreet via the compact `Save PDF` action.

