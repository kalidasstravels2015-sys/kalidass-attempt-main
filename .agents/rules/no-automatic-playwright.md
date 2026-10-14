# Testing & Verification Guidelines

## Rule: Do NOT Run Playwright Automatically
- **Default Behavior**: Do NOT run Playwright tests (`npx playwright test`, `test:e2e`, or browser automation scripts) after routine code edits, UI updates, styling changes, or text adjustments.
- **Why**: Running end-to-end browser tests on every prompt is time-consuming, expensive, and unnecessary for standard development tasks where Astro's local dev server / HMR is already running.
- **When to Run Playwright**:
  - Run Playwright **ONLY** when the user explicitly asks to run tests, verify via Playwright, or run an E2E suite.
  - Otherwise, inspect code statically, perform fast syntax/lint validation if needed, and let the user review live in their running dev server.
