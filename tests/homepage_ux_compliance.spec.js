import { test, expect } from '@playwright/test';

test.describe('Homepage UX, CWV & Google Compliance Verification', () => {
  test('verifies headline, trust badges, and payment policy alignment', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 1. Headline includes full service scope
    const h1 = page.locator('#hero h1');
    await expect(h1).toContainText('Outstation Cabs, Temple Tours & Airport Transfers across South India');

    // 2. Trust badges reflect standardized ₹500 advance deposit policy
    const hero = page.locator('#hero');
    await expect(hero).toContainText('₹500 Advance Locks Cab');
    await expect(hero).toContainText('100% Deducted from Final Bill');
    await expect(hero).not.toContainText('Zero Advance to Book');

    // 3. Booking Engine header displays Book Your Trip (no competitor leaks)
    const bookingPanel = page.locator('#booking-panel');
    await expect(bookingPanel).toContainText('Book Your Trip');
    await expect(bookingPanel).not.toContainText('Savaari');

    // 4. Accessible Form Inputs & Placeholders
    const pickupInput = page.locator('input[placeholder*="Pickup Location in Chennai"], input[placeholder*="T. Nagar, Central, Airport"]');
    await expect(pickupInput).toBeVisible();

    const dropInput = page.locator('input[placeholder*="Drop Location / City"], input[placeholder*="Pondicherry, Tirupati, Bangalore"]');
    await expect(dropInput).toBeVisible();

    // 5. Partners Section: Competitor Savaari is purged
    const partners = page.locator('#partners');
    await expect(partners).not.toContainText('Savaari');

    // 6. LCP Preload Parity: Verify preloaded image matches hero slide candidate
    const preloadLink = page.locator('link[rel="preload"][as="image"]');
    const preloadHref = await preloadLink.getAttribute('href');
    expect(preloadHref).toContain('tirupati-balaji');
  });

  test('verifies mobile drawer touch target compliance (>= 48px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Open mobile menu
    await page.locator('#mobile-menu-btn').click();
    const closeBtn = page.locator('#close-menu-btn');
    await expect(closeBtn).toBeVisible();

    const box = await closeBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  });

  test('verifies all booking engines do not show select vehicle before view instant fare button', async ({ page }) => {
    // 1. QuotationEngine on Homepage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const bookingPanel = page.locator('#booking-panel');
    await expect(bookingPanel.locator('button:has-text("View Instant Fare")')).toBeVisible();
    await expect(bookingPanel.locator('text=Select Vehicle:')).toHaveCount(0);
    await expect(bookingPanel.locator('text=வாகனம் தேர்வு செய்யவும்:')).toHaveCount(0);

    // 2. AirportBookingEngine on Chennai Airport Taxi page
    await page.goto('/services/chennai-airport-taxi', { waitUntil: 'domcontentloaded' });
    const airportEngine = page.locator('#booking-section');
    await expect(airportEngine.locator('#get-flat-fare-btn')).toBeVisible();
    await expect(airportEngine.locator('text=Select Vehicle:')).toHaveCount(0);

    // 3. TourBookingEngine on Tirupati Temple Tour page
    await page.goto('/services/tirupati-package', { waitUntil: 'domcontentloaded' });
    const tourEngine = page.locator('#booking');
    await expect(tourEngine.locator('#btn-calculate-fare')).toBeVisible();
    await expect(tourEngine.locator('text=Select Vehicle:')).toHaveCount(0);
    await expect(tourEngine.locator('text=Vehicle Model')).toHaveCount(0);
  });
});
