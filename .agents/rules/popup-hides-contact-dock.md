# Popups Must Hide the Floating Call Button

The global contact shortcut (`#floating-actions-container` in `src/components/FloatingActions.astro`)
MUST be hidden whenever any popup, modal, bottom sheet, or dialog is open. Popups carry their own
enquiry/call CTAs; the floating button is duplicate noise and can cover the popup's footer buttons.

## How (central mechanism lives in `src/layouts/Layout.astro` global styles)
- **Preferred:** use native `<dialog>` opened with `showModal()` → hidden automatically via `dialog:modal`.
- **Custom overlays** (React conditional render, `fixed inset-0` divs, bottom sheets):
  add `data-hide-contact-dock` to the overlay root element. Present only while open.
- Do NOT rely on `[aria-modal="true"]` — the mobile nav drawer has it permanently.
- Do NOT hand-roll per-component JS to toggle the dock.

## Stacking-context check
A `position: fixed` popup rendered inside a parent with `relative z-*`, `transform`,
`filter`, or `backdrop-filter` is trapped below the dock. Render React popups via
`createPortal(..., document.body)` or use native `<dialog>` (top layer).

## Before finishing any popup work
1. Grep for new overlays: `fixed inset-0`, `role="dialog"`, `<dialog`.
2. Confirm each is either a `showModal()` dialog or has `data-hide-contact-dock`.
3. Verify at 412×924 mobile viewport that the dock disappears on open and returns on close
   (regression test: `tests/contact_dock_overlay.spec.js`).
