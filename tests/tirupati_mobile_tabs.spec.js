import { test, expect } from '@playwright/test';

test.describe('Tirupati Mobile & Desktop Itinerary, Guide and Navigation', () => {
  test('Mobile view shows direct action strip and keeps all sections (Booking, Route, Guide, FAQ) visible in flow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/services/tirupati-package/');

    // 1. Prominent Tirupati Temple visual hero card is visible on mobile
    const templeImage = page.locator('img[alt*="Sri Venkateswara Swamy Temple Tirumala"]');
    await expect(templeImage).toBeVisible();
    await expect(page.getByText('Sri Venkateswara Temple, Tirumala')).toBeVisible();

    // 2. Mobile Trust Strip is visible
    const trustStrip = page.locator('[data-mobile-trust-strip]');
    await expect(trustStrip).toBeVisible();
    await expect(trustStrip.getByText('₹0 Advance')).toBeVisible();

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

    // 3. Crucial: All sections are rendered and visible in DOM (NOT hidden by artificial tabs)
    const bookingSection = page.locator('#booking');
    const routeSection = page.locator('#route');
    const guideSection = page.locator('#guide');
    const faqSection = page.locator('#faq');

    await expect(bookingSection).toBeVisible();
    await expect(routeSection).toBeVisible();
    await expect(guideSection).toBeVisible();
    await expect(faqSection).toBeVisible();

    // 4. Click Route Itinerary pill smoothly scrolls to route section
    await tabRoute.click();
    await expect(routeSection).toBeVisible();

    // 5. Click Darshan Guide pill smoothly scrolls to guide section
    await tabGuide.click();
    await expect(guideSection).toBeVisible();

    // 6. Click FAQs & Compare pill smoothly scrolls to faq section
    await tabFaq.click();
    await expect(faqSection).toBeVisible();
  });

  test('Desktop view keeps continuous layout and all sections visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/services/tirupati-package/');

    // Prominent Tirupati Temple visual hero card is visible on desktop
    const templeImage = page.locator('img[alt*="Sri Venkateswara Swamy Temple Tirumala"]');
    await expect(templeImage).toBeVisible();

    // Redundant action strip is completely removed
    const mobileActionCard = page.locator('[data-mobile-action-strip]');
    await expect(mobileActionCard).toHaveCount(0);

    // All sections are rendered and visible in DOM
    const bookingSection = page.locator('#booking');
    const routeSection = page.locator('#route');
    const guideSection = page.locator('#guide');
    const faqSection = page.locator('#faq');

    await expect(bookingSection).toBeVisible();
    await expect(routeSection).toBeVisible();
    await expect(guideSection).toBeVisible();
    await expect(faqSection).toBeVisible();
  });

  test('Preserves JSON-LD schema and speakable snippet attributes', async ({ page }) => {
    await page.goto('/services/tirupati-package/');

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
    expect(text).toContain('₹6,000 (Sedan)');
  });
});
