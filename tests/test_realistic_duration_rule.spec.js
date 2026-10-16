import { test, expect } from '@playwright/test';

const ENGINES_TO_TEST = [
  {
    name: 'Tirupati Booking Engine',
    url: '/services/tirupati-package/',
    roundTripText: '~320 km Round Trip',
    circuitText: '~320 km circuit',
    pickupVal: '2026-10-25T06:00',
    expectedMin: '2026-10-25T18:00', // 12 hrs
    expectedDefault: '2026-10-25T18:00', // 12 hrs (first eligible)
    shortReturnVal: '2026-10-25T16:00', // 10 hrs (<12 hrs)
    advisorySnippet: 'Realistic Travel Advisory:'
  },
  {
    name: 'Kanchipuram Booking Engine',
    url: '/services/kanchipuram-temple-trip/',
    roundTripText: '~150 km Round Trip',
    circuitText: '~150 km circuit',
    pickupVal: '2026-10-25T07:00',
    expectedMin: '2026-10-25T15:00', // 8 hrs
    expectedDefault: '2026-10-25T15:00', // 8 hrs (first eligible)
    shortReturnVal: '2026-10-25T13:00', // 6 hrs (<8 hrs)
    advisorySnippet: 'Realistic Travel Advisory:'
  },
  {
    name: 'Thiruvannamalai Booking Engine',
    url: '/services/thiruvannamalai-girivalam-trip/',
    roundTripText: '~390 km Round Trip',
    circuitText: '~390 km circuit',
    pickupVal: '2026-10-25T05:00',
    expectedMin: '2026-10-25T19:00', // 14 hrs
    expectedDefault: '2026-10-25T19:00', // 14 hrs (first eligible)
    shortReturnVal: '2026-10-25T16:00', // 11 hrs (<14 hrs)
    advisorySnippet: 'Realistic Travel Advisory:'
  },
  {
    name: 'Vellore Golden Temple Booking Engine',
    url: '/services/vellore-golden-temple/',
    roundTripText: '~280 km Round Trip',
    circuitText: '~280 km circuit',
    pickupVal: '2026-10-25T06:00',
    expectedMin: '2026-10-25T16:00', // 10 hrs
    expectedDefault: '2026-10-25T16:00', // 10 hrs (first eligible)
    shortReturnVal: '2026-10-25T14:00', // 8 hrs (<10 hrs)
    advisorySnippet: 'Realistic Travel Advisory:'
  },
  {
    name: 'Pondicherry Booking Engine',
    url: '/services/pondicherry-one-day-trip/',
    roundTripText: '~310 km Round Trip',
    circuitText: '~310 km circuit',
    pickupVal: '2026-10-25T06:00',
    expectedMin: '2026-10-25T17:00', // 11 hrs
    expectedDefault: '2026-10-25T17:00', // 11 hrs (first eligible)
    shortReturnVal: '2026-10-25T15:00', // 9 hrs (<11 hrs)
    advisorySnippet: 'Realistic Travel Advisory:'
  },
  {
    name: 'Chidambaram Booking Engine',
    url: '/services/chidambaram-temple-trip/',
    roundTripText: '~450 km Round Trip',
    circuitText: '~450 km circuit',
    pickupVal: '2026-10-25T05:00',
    expectedMin: '2026-10-25T19:00', // 14 hrs
    expectedDefault: '2026-10-25T19:00', // 14 hrs (first eligible)
    shortReturnVal: '2026-10-25T16:00', // 11 hrs (<14 hrs)
    advisorySnippet: 'Realistic Travel Advisory:'
  },
  {
    name: 'Navagraha 9 Temples Booking Engine',
    url: '/services/navagraha-tour/',
    roundTripText: '~680 km Circuit',
    circuitText: '~680 km circuit',
    pickupVal: '2026-10-25T06:00',
    expectedMin: '2026-10-26T18:00', // 36 hrs
    expectedDefault: '2026-10-26T18:00', // 36 hrs (first eligible)
    shortReturnVal: '2026-10-26T12:00', // 30 hrs (<36 hrs)
    advisorySnippet: 'Realistic Travel Advisory:'
  },
  {
    name: 'Rameswaram & Dhanushkodi Booking Engine',
    url: '/services/rameswaram-2-days/',
    roundTripText: '~1150 km Circuit',
    circuitText: '~1150 km circuit',
    pickupVal: '2026-10-25T05:00',
    expectedMin: '2026-10-27T05:00', // 48 hrs
    expectedDefault: '2026-10-27T05:00', // 48 hrs (first eligible)
    shortReturnVal: '2026-10-26T17:00', // 36 hrs (<48 hrs)
    advisorySnippet: 'Realistic Travel Advisory:'
  },
  {
    name: 'Sabarimala Booking Engine',
    url: '/services/sabarimala-trip/',
    roundTripText: '~1350 km Circuit',
    circuitText: '~1350 km circuit',
    pickupVal: '2026-10-25T06:00',
    expectedMin: '2026-10-27T06:00', // 48 hrs
    expectedDefault: '2026-10-27T06:00', // 48 hrs (first eligible)
    shortReturnVal: '2026-10-26T18:00', // 36 hrs (<48 hrs)
    advisorySnippet: 'Realistic Travel Advisory:'
  }
];

test.describe('Realistic Duration & Disabled Drop Timing Universal Rule', () => {
  for (const engine of ENGINES_TO_TEST) {
    test(`Verify ${engine.name} disables drop timing, enforces realistic min/default duration, and shows distance advisory`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(engine.url, { waitUntil: 'networkidle' });

      const bookingSection = page.locator('#booking');
      await bookingSection.scrollIntoViewIfNeeded();

      const pickupDate = bookingSection.locator('input[type="datetime-local"]').first();
      const returnDate = bookingSection.locator('input[type="datetime-local"]').nth(1);

      // 1. Initial State: Return DateTime input MUST be disabled
      await expect(returnDate).toBeDisabled();

      // 2. Fixed destination or route notice must show round-trip distance badge
      await expect(bookingSection.getByText(engine.roundTripText)).toBeVisible();

      // 3. Fill pickup date & time
      await pickupDate.fill(engine.pickupVal);

      // 4. Return datetime must now be enabled
      await expect(returnDate).toBeEnabled();

      // 5. Min attribute must enforce realistic duration threshold
      const minAttr = await returnDate.getAttribute('min');
      expect(minAttr).toBe(engine.expectedMin);

      // 6. Return datetime should auto-default to first eligible window
      const defaultValue = await returnDate.inputValue();
      expect(defaultValue).toBe(engine.expectedDefault);

      // 6b. Verify NO warning or advisory is shown automatically on selecting pickup!
      await expect(bookingSection.getByText(engine.advisorySnippet)).not.toBeVisible();

      // 7. Check circuit distance pill in duration badge if present
      await expect(bookingSection.getByText(engine.circuitText).last()).toBeVisible();

      // 8. If return time is forced shorter than realistic minimum, advisory banner appears
      await returnDate.fill(engine.shortReturnVal);
      await expect(bookingSection.getByText(engine.advisorySnippet)).toBeVisible();

      console.log(`✔ Verified ${engine.name}: Disabled before pickup, auto-selects first eligible=${engine.expectedMin}, no auto-warning, advisory shown only when duration is too short.`);
    });
  }
});
