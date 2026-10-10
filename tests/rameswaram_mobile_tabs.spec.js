import { test, expect } from '@playwright/test';

test.describe('Rameswaram Mobile & Desktop Itinerary, Guide and Navigation', () => {
  test('Mobile view shows direct action strip and keeps all sections (Booking, Route, Guide, FAQ) visible in flow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/services/rameswaram-2-days/');

    // 1. Prominent Rameswaram Temple visual hero card is visible on mobile
    const templeImage = page.locator('img[alt*="Ramanathaswamy Temple & Pamban Bridge"]');
    await expect(templeImage).toBeVisible();
    await expect(page.getByText('Ramanathaswamy & Dhanushkodi', { exact: true })).toBeVisible();

    // 2. Mobile Trust Strip is visible
    const trustStrip = page.locator('[data-mobile-trust-strip]');
    await expect(trustStrip).toBeVisible();
    await expect(trustStrip.getByText('₹0 Advance')).toBeVisible();
    await expect(trustStrip.getByText('NH 87 Tolls Inc.')).toBeVisible();
    await expect(trustStrip.getByText('1,200 km Covered')).toBeVisible();

    // 3. Quick Navigation is visible with all 4 section links
    const nav = page.locator('nav[data-quick-nav]');
    await expect(nav).toBeVisible();

    const tabFares = nav.locator('a[href="#booking"]');
    const tabRoute = nav.locator('a[href="#route"]');
    const tabGuide = nav.locator('a[href="#guide"]');
    const tabFaq = nav.locator('a[href="#faq"]');

    await expect(tabFares).toBeVisible();
    await expect(tabRoute).toBeVisible();
    await expect(tabGuide).toBeVisible();
    await expect(tabFaq).toBeVisible();

    // 4. All sections are rendered and visible in DOM
    const bookingSection = page.locator('#booking');
    const routeSection = page.locator('#route');
    const guideSection = page.locator('#guide');
    const faqSection = page.locator('#faq');

    await expect(bookingSection).toBeVisible();
    await expect(routeSection).toBeVisible();
    await expect(guideSection).toBeVisible();
    await expect(faqSection).toBeVisible();

    // 5. Booking Engine is rendered with Rameswaram destination
    await expect(page.getByText('Book Chennai to Rameswaram')).toBeVisible();
    await expect(page.getByText('Ramanathaswamy Temple & Dhanushkodi')).toBeVisible();

    // 6. Test Guide Tabs on mobile
    const btnTimings = page.locator('#guide-tab-btn-practical');
    const btnSignificance = page.locator('#guide-tab-btn-significance');
    await expect(btnTimings).toBeVisible();
    await expect(btnSignificance).toBeVisible();

    // Switch to Significance tab
    await btnSignificance.click();
    await expect(page.locator('#guide')).toHaveAttribute('data-active-tab', 'significance');

    // Switch back to Timings tab
    await btnTimings.click();
    await expect(page.locator('#guide')).toHaveAttribute('data-active-tab', 'practical');
  });

  test('Desktop view keeps continuous layout and all sections visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/services/rameswaram-2-days/');

    // Prominent Rameswaram Temple visual hero card is visible on desktop
    const templeImage = page.locator('img[alt*="Ramanathaswamy Temple & Pamban Bridge"]');
    await expect(templeImage).toBeVisible();

    // Dedicated Rameswaram Booking Engine is visible in initial hero viewport
    const bookingSection = page.locator('#booking');
    await expect(bookingSection).toBeVisible();
    await expect(page.getByText('Book Chennai to Rameswaram')).toBeVisible();

    // Fleet Carousel is visible with Select in Booking Engine buttons
    const carouselTrack = page.locator('#fleet-carousel-track');
    await expect(carouselTrack).toBeVisible();

    const selectButtons = page.locator('[data-select-vehicle]');
    await expect(selectButtons.first()).toBeVisible();

    // Compare section is positioned before FAQs
    const compareSection = page.locator('#compare');
    await expect(compareSection).toBeVisible();
    await expect(compareSection.getByText('Transparent Comparison')).toBeVisible();

    // FAQs section is visible
    const faqSection = page.locator('#faq');
    await expect(faqSection).toBeVisible();
  });

  test('Preserves JSON-LD schema and speakable snippet attributes', async ({ page }) => {
    await page.goto('/services/rameswaram-2-days/');

    // Schema validation in <head>
    const types = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      const parsedTypes = [];
      scripts.forEach(s => {
        try {
          const json = JSON.parse(s.textContent || '');
          if (json['@graph']) {
            json['@graph'].forEach((item) => parsedTypes.push(item['@type']));
          } else if (Array.isArray(json)) {
            json.forEach((item) => parsedTypes.push(item['@type']));
          } else if (json['@type']) {
            parsedTypes.push(json['@type']);
          }
        } catch {
          // ignore
        }
      });
      return parsedTypes;
    });

    expect(types).toContain('TouristTrip');
    expect(types).toContain('Product');
    expect(types).toContain('FAQPage');

    // Direct Google featured snippet block
    const speakable = page.locator('[data-speakable="true"]');
    await expect(speakable).toBeAttached();
    const text = await speakable.textContent();
    expect(text).toContain('₹15,500 (Sedan)');
    expect(text).toContain('~1,200 km round-trip');
  });
});
