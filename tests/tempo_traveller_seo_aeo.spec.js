import { test, expect } from '@playwright/test';

test.describe('Tempo Traveller Rental in Chennai Passenger-First Flow & SEO', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services/tempo-traveller-rental-chennai/');
  });

  test('Page metadata contains optimized Title, Meta Description, and Keywords', async ({ page }) => {
    // 1. Title verification
    await expect(page).toHaveTitle(/Tempo Traveller Rental in Chennai \| 12, 17 Seater & Urbania \| Kalidass Travels/);

    // 2. Meta description verification
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute(
      'content',
      /Hire luxury 12 & 17-Seater Force Tempo Travellers & Urbania in Chennai/
    );

    // 3. Meta keywords verification
    const metaKeywords = page.locator('meta[name="keywords"]');
    const content = await metaKeywords.getAttribute('content');
    expect(content).toContain('tempo traveller rental chennai');
    expect(content).toContain('12 seater tempo traveller in chennai');
    expect(content).toContain('17 seater tempo traveller chennai');
    expect(content).toContain('chennai to tirupati tempo traveller package');
    expect(content).toContain('force urbania rental in chennai');
  });

  test('Dedicated Tempo Quotation Engine handles Tempo Fleet (12S, 17S, Urbania) and calculates rates', async ({ page }) => {
    const quotationEngine = page.locator('#tempo-quotation-engine');
    await expect(quotationEngine).toBeVisible();

    // Verify Trip Type tabs: only Round Trip and Local Package (One Way is removed)
    await expect(quotationEngine.locator('button', { hasText: 'Round Trip' })).toBeVisible();
    await expect(quotationEngine.locator('button', { hasText: 'Local Package' })).toBeVisible();
    await expect(quotationEngine.locator('button', { hasText: 'One Way' })).toHaveCount(0);

    // Switch to Local Package tab (auto-populates drop location)
    const localTabBtn = quotationEngine.locator('button', { hasText: 'Local Package' });
    await localTabBtn.click();

    // Click calculate fare button to display instant 1-tap vehicle comparison and fare
    const btnCalc = quotationEngine.locator('#btn-calculate-fare');
    await btnCalc.click();

    // Verify Tempo fleet in QuotationEngine
    await expect(quotationEngine).toContainText(/Force Tempo/i);
    await expect(quotationEngine).toContainText(/12-Seater/i);
    await expect(quotationEngine).toContainText(/17-Seater/i);
    await expect(quotationEngine).toContainText(/Urbania/i);
    // Ensure regular sedans/hatchbacks are NOT present in tempo-only mode
    await expect(quotationEngine).not.toContainText(/Swift Dzire/i);
    await expect(quotationEngine).not.toContainText(/Toyota Etios/i);

    // Result card should appear with flat local package estimate
    await expect(quotationEngine).toContainText(/Total Fare|Quote Ref/i);
    await expect(quotationEngine).toContainText(/12-Seater Luxury Force Tempo/);
    
    // Verify per-person cost is NOT displayed
    await expect(quotationEngine).not.toContainText(/\/person/);
    
    // Check WhatsApp CTA button
    const waButton = quotationEngine.locator('[data-direct-whatsapp="true"]').first();
    await expect(waButton).toBeVisible();
    await expect(waButton).toContainText(/WhatsApp|வாட்ஸ்அப்/i);
  });

  test('Mobile Viewport (390x844) renders sticky M3 nav, swipeable fleet deck and swipeable packages deck', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/services/tempo-traveller-rental-chennai/');

    // 1. Material 3 Sticky Navigation Bar
    const nav = page.locator('#mobile-quick-nav');
    await expect(nav).toBeVisible();
    await expect(nav.getByText('Fare Calculator')).toBeVisible();
    await expect(nav.getByText('Tempo Fleet')).toBeVisible();
    await expect(nav.getByText('Outstation Packages')).toBeVisible();
    await expect(nav.getByText('Inclusions & Policy')).toBeVisible();
    await expect(nav.getByText('Passenger FAQs')).toBeVisible();

    // 2. Fleet Scroller with Horizontal Swipe and Indicator Dots
    const fleetScroller = page.locator('#spec-fleet-scroller');
    await expect(fleetScroller).toBeVisible();
    await expect(page.getByText('Swipe horizontally to compare vehicles')).toBeVisible();
    const fleetDots = page.locator('#spec-fleet-dots');
    await expect(fleetDots).toBeVisible();

    // 3. Top Outstation Packages Carousel with Horizontal Swipe Track and Dots
    const packagesTrack = page.locator('#packages-carousel-track');
    await expect(packagesTrack).toBeVisible();
    await expect(page.getByText('Swipe horizontally to view all 6 packages')).toBeVisible();
    const packageDots = page.locator('#packages-carousel-dots');
    await expect(packageDots).toBeVisible();
  });

  test('Popular Packages section displays top 6 all-inclusive routes with transparent vehicle fares (no per-person rates)', async ({ page }) => {
    const pkgSection = page.locator('#packages-section');
    await expect(pkgSection).toBeVisible();

    const expectedDestinations = [
      'Tirupati Balaji Darshan',
      'Pondicherry & Auroville',
      'Thiruvannamalai Girivalam',
      'Kumbakonam 9 Navagraha Temples',
      'Vellore Golden Temple & Sripuram',
      'Sabarimala Pilgrim Yatra (Pamba)'
    ];

    for (const dest of expectedDestinations) {
      await expect(pkgSection.getByRole('heading', { name: dest })).toBeAttached();
    }

    // Verify transparent package vehicle fares
    await expect(pkgSection).toContainText(/₹12,499/);
    await expect(pkgSection).toContainText(/₹13,899/);

    // Verify per-person costs are NOT displayed anywhere
    await expect(pkgSection).not.toContainText(/\/person/);
  });

  test('Passenger FAQs section contains 7 relevant questions including multi-home drops policy', async ({ page }) => {
    const faqSection = page.locator('#faq-section');
    await expect(faqSection).toBeVisible();

    const details = faqSection.locator('details');
    await expect(details).toHaveCount(7);

    await expect(faqSection).toContainText(/How much luggage can fit in a 12-seater and 17-seater Tempo Traveller?/);
    await expect(faqSection).toContainText(/Are tolls, driver bata, and state permits included in your packages?/);
    await expect(faqSection).toContainText(/How does the ₹500 booking advance work?/);
    await expect(faqSection).toContainText(/Can the Tempo Traveller drop each passenger at their individual homes upon return\?/);
  });

  test('JSON-LD Structured Data conforms to Google Search Central guidelines with numeric prices', async ({ page }) => {
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThan(0);

    const graph = [];
    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).textContent();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (parsed['@graph']) {
            graph.push(...parsed['@graph']);
          } else {
            graph.push(parsed);
          }
        } catch (e) {
          // ignore
        }
      }
    }

    // 1. AutoRental / LocalBusiness
    const autoRental = graph.find(item => {
      const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
      return (types.includes('AutoRental') || types.includes('TravelAgency')) &&
             (item['@id'] && item['@id'].includes('tempo-traveller'));
    });
    expect(autoRental).toBeDefined();
    expect(autoRental.telephone).toBe('+918939539211');
    expect(autoRental.aggregateRating).toBeDefined();
    expect(autoRental.aggregateRating.ratingValue).toBe('4.9');

    // 2. Service with OfferCatalog containing Vehicles & TouristTrips
    const service = graph.find(item => item['@type'] === 'Service' && item['@id'] && item['@id'].includes('tempo-traveller'));
    expect(service).toBeDefined();
    expect(service.hasOfferCatalog).toBeDefined();

    // Check presence of TouristTrip
    const offers = service.hasOfferCatalog.itemListElement;
    const tourTripOffer = offers.find(o => o.itemOffered && o.itemOffered['@type'] === 'TouristTrip');
    expect(tourTripOffer).toBeDefined();
    expect(typeof tourTripOffer.price).toBe('number');
    expect(tourTripOffer.priceCurrency).toBe('INR');

    // Check presence of Vehicle with proper properties
    const vehicleOffer = offers.find(o => o.itemOffered && o.itemOffered['@type'] === 'Vehicle');
    expect(vehicleOffer).toBeDefined();
    expect(typeof vehicleOffer.price).toBe('number');
    expect(vehicleOffer.priceCurrency).toBe('INR');
    expect(typeof vehicleOffer.itemOffered.seatingCapacity).toBe('number');
    expect(vehicleOffer.itemOffered.fuelType).toBe('Diesel');

    // 3. FAQPage
    const faqPage = graph.find(item => item['@type'] === 'FAQPage');
    expect(faqPage).toBeDefined();
    expect(faqPage.mainEntity.length).toBe(7);

    // 4. BreadcrumbList with #breadcrumb
    const breadcrumbs = graph.find(item => item['@type'] === 'BreadcrumbList');
    expect(breadcrumbs).toBeDefined();
    expect(breadcrumbs['@id']).toContain('#breadcrumb');
  });

  test('Icons are standardized as vector SVGs with zero broken Material Symbols', async ({ page }) => {
    // 1. Verify zero .material-symbols-outlined elements on the main page content
    const materialIcons = page.locator('main .material-symbols-outlined');
    await expect(materialIcons).toHaveCount(0);

    // 2. Verify vector SVG icons are present in trust strip, specifications, guidelines, and guarantees
    const svgs = page.locator('main svg');
    const svgCount = await svgs.count();
    expect(svgCount).toBeGreaterThanOrEqual(10);

    // 3. Verify specific Lucide icon classes or SVGs are visible
    await expect(page.locator('#inclusions-section svg')).toHaveCount(4);
  });
});
