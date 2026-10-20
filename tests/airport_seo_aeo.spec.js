import { test, expect } from '@playwright/test';

test.describe('Chennai Airport Taxi SEO, AEO & SERP Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services/chennai-airport-taxi/');
  });

  test('Page metadata contains optimized Title, Description, and Keywords', async ({ page }) => {
    // 1. Verify Page Title
    await expect(page).toHaveTitle(/Chennai Airport Taxi & Cab Booking \(MAA\) \| Fares from ₹650 \| Kalidass Travels/);

    // 2. Verify Meta Description
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute(
      'content',
      /Book 24\/7 Chennai airport taxi & cab transfers from ₹650/
    );

    // 3. Verify Keywords Meta Tag contains GSC queries (fare, drop, pickup charges, prepaid taxi)
    const metaKeywords = page.locator('meta[name="keywords"]');
    const content = await metaKeywords.getAttribute('content');
    expect(content).toContain('chennai airport taxi fare');
    expect(content).toContain('chennai airport prepaid taxi');
    expect(content).toContain('chennai airport pickup charges');
    expect(content).toContain('chennai international airport prepaid taxi');
    expect(content).toContain('chennai airport cab service');
    expect(content).toContain('book airport transfer taxi in chennai');
  });

  test('AEO Quick Facts direct answer snippet box is rendered at the top', async ({ page }) => {
    const aeoBox = page.locator('section[aria-label="Quick summary of Chennai Airport taxi and cab services"]');
    await expect(aeoBox).toBeVisible();
    await expect(aeoBox).toContainText(/Quick Facts: Chennai Airport Taxi & Cab Service \(MAA\)/);
    await expect(aeoBox).toContainText(/₹650 Flat/);
    await expect(aeoBox).toContainText(/T1, T2 & T4/);
    await expect(aeoBox).toContainText(/100% Free Wait/);
    await expect(aeoBox).toContainText(/Chennai airport prepaid taxi/);
  });

  test('Prepaid Taxi vs Pre-booked Cab comparison section is present and structured', async ({ page }) => {
    const comparisonSection = page.locator('#prepaid-taxi-comparison');
    await expect(comparisonSection).toBeAttached();
    await expect(comparisonSection).toContainText(/Why Travelers Choose Kalidass Pre-Booked Cabs vs Airport Prepaid Taxi/);
    await expect(comparisonSection).toContainText(/Prepaid Taxi/);
    await expect(comparisonSection).toContainText(/Kalidass Travels/);
    await expect(comparisonSection).toContainText(/Terminal Waiting Time/);
    await expect(comparisonSection).toContainText(/Flight Delay Handling/);
    await expect(comparisonSection).toContainText(/Advance Payment/);
  });

  test('Pickup Charges clarification is present in FAQ and Schema', async ({ page }) => {
    const faqQuestion = page.locator('#airport-faq').getByText('Are Chennai airport pickup charges different from airport drop charges?');
    await expect(faqQuestion).toBeAttached();
  });

  test('Terminal Pick Up & Drop Guide (T1, T2 & T4) is attached with complete procedures', async ({ page }) => {
    const terminalGuide = page.locator('#terminal-pickup-drop-guide');
    await expect(terminalGuide).toBeAttached();
    await expect(terminalGuide).toContainText(/Arrival Pick Up Protocol \(Terminal 1, 2 & 4\)/);
    await expect(terminalGuide).toContainText(/Doorstep Airport Drop Protocol/);
    await expect(terminalGuide).toContainText(/Automated Flight Tracking/);
    await expect(terminalGuide).toContainText(/Terminal Exit Meet & Greet/);
    await expect(terminalGuide).toContainText(/Direct Elevated Ramp Drop/);
  });

  test('JSON-LD Structured Data includes TaxiService, FAQPage and ItemList', async ({ page }) => {
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThan(0);

    const graph = [];
    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).textContent();
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed['@graph']) {
          graph.push(...parsed['@graph']);
        } else {
          graph.push(parsed);
        }
      }
    }

    // Find TaxiService
    const taxiService = graph.find((item) => item['@type'] === 'TaxiService');
    expect(taxiService).toBeDefined();
    expect(taxiService.name).toContain('Chennai Airport Taxi & Cab Transfers (MAA)');
    expect(taxiService.serviceType).toContain('Airport Taxi, Cab Transfers & Prepaid Taxi Alternative');

    // Find FAQPage with at least 14 questions
    const faqPage = graph.find((item) => item['@type'] === 'FAQPage');
    expect(faqPage).toBeDefined();
    expect(faqPage.mainEntity.length).toBeGreaterThanOrEqual(14);
    
    // Check specific high-intent question in FAQPage
    const qTexts = faqPage.mainEntity.map((q) => q.name);
    expect(qTexts).toContain('What is the Chennai airport taxi fare to different parts of Chennai?');
    expect(qTexts).toContain('Is prepaid taxi available at Chennai airport, and should I choose prepaid or pre-book online?');
    expect(qTexts).toContain('Are Chennai airport pickup charges different from airport drop charges?');
    expect(qTexts).toContain('Where does the chauffeur meet me for Chennai airport arrival pick up?');

    // Find ItemList (Trip list for zone tariffs)
    const tripList = graph.find((item) => item['@id'] && item['@id'].includes('zone-route-list'));
    expect(tripList).toBeDefined();
  });
});
