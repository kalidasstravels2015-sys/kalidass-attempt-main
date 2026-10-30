# Mobile Horizontal Swipe Hint Standard (`👉 Swipe horizontally`)

When creating new pages, services, tour packages, or components in Kalidass Travels, any section that contains horizontally scrollable items or carousels on mobile must include a visible swipe affordance label.

## Core Rules

1. **Mandatory Swipe Affordance for Mobile Scroll Containers:**
   - Any carousel, track, or container using `overflow-x-auto` or `snap-x` on mobile (vehicle comparison decks, tour package cards, chauffeur cards, customer reviews, or full-width data tables) **MUST** include a mobile-only hint:
     `👉 Swipe horizontally to [action]`
   - Placed directly beneath the scroll indicator dots (or beneath the scroller track if dots are not present, or above/below wide tables).

2. **Standard Component Markup & Styling:**
   ```html
   <!-- Mobile Swipe Hint -->
   <div class="flex items-center justify-center gap-1.5 text-xs font-medium text-m3-on-surface-variant md:hidden mt-1">
     <span>👉 Swipe horizontally to compare all vehicle tariffs</span>
   </div>
   ```

3. **Responsive Breakpoint Guard:**
   - Always include `md:hidden` (or `sm:hidden` if the desktop grid switches at `sm:`).
   - This ensures the hint is visible only when the element is actually horizontally scrollable on touchscreens, and automatically hidden on desktop where cards are laid out in a grid.

4. **Context-Specific Copy Guidelines:**
   - **Vehicle Tariffs / Fleet Galleries:**
     `👉 Swipe horizontally to compare all vehicle tariffs` (or `👉 Swipe horizontally to compare vehicles`)
   - **Tour Packages:**
     `👉 Swipe horizontally to view all [N] packages` (e.g. `👉 Swipe horizontally to view all temple tour packages`)
   - **Verified Chauffeurs / Drivers:**
     `👉 Swipe horizontally to view all verified chauffeurs`
   - **Customer Reviews:**
     `👉 Swipe horizontally to read all customer reviews`
   - **Vehicle Specification Tables / Matrices:**
     `👉 Swipe horizontally to compare all vehicle specifications` (or `👉 Swipe horizontally to view full table`)
   - **Booking Engine Vehicle Selector:**
     `👉 Swipe horizontally to compare vehicles`

5. **Astro and React Support:**
   - Works uniformly in `.astro` templates and React (`.jsx` / `.tsx`) components (using `className`).

