import { test, expect } from '@playwright/test';

test.describe('Fleet Page (/fleet/) Comprehensive Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fleet/');
  });

  test('Page metadata, breadcrumbs, and trust pills render correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Commercial Taxi & Van Fleet in Chennai \| Sedans, Tempo Travellers & Urbania \| Kalidass Travels/);
    
    // Breadcrumbs
    const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toBeVisible();
    await expect(breadcrumbs).toContainText('Fleet');

    // Header and trust pills
    const h1 = page.locator('#fleet-page-header h1');
    await expect(h1).toContainText('Our Commercial Fleet');
    await expect(page.locator('text=100% Commercial Yellow-Plate AITP Fleet')).toBeVisible();
    await expect(page.locator('text=Chilled Commercial AC Guaranteed')).toBeVisible();
  });

  test('All 11 vehicles are rendered including Tempo Travellers (12S, 14S, 17S, 20S, 26S) and Force Urbania', async ({ page }) => {
    const cards = page.locator('.fleet-card');
    await expect(cards).toHaveCount(11);

    // Verify key recent models
    await expect(page.locator('#tempo-12')).toContainText('12-Seater Luxury Force Tempo');
    await expect(page.locator('#tempo-12')).toContainText('₹24');
    await expect(page.locator('#tempo-12')).toContainText('3–4 Medium Trolleys');

    await expect(page.locator('#tempo-14')).toContainText('14-Seater Executive Force Tempo');
    await expect(page.locator('#tempo-14')).toContainText('₹25');
    await expect(page.locator('#tempo-14')).toContainText('5–6 Medium Trolleys');

    await expect(page.locator('#tempo-17')).toContainText('17-Seater Executive Force Tempo');
    await expect(page.locator('#tempo-17')).toContainText('₹26');
    await expect(page.locator('#tempo-17')).toContainText('6–7 Medium Trolleys');

    await expect(page.locator('#tempo-20')).toContainText('20-Seater Grand Force Tempo');
    await expect(page.locator('#tempo-20')).toContainText('₹30');

    await expect(page.locator('#tempo-26')).toContainText('26-Seater Force Mini Bus Coach');
    await expect(page.locator('#tempo-26')).toContainText('₹36');

    await expect(page.locator('#urbania')).toContainText('Force Urbania VIP Luxury Chauffeur Van');
    await expect(page.locator('#urbania')).toContainText('₹38');
    await expect(page.locator('#urbania')).toContainText('6–8 Executive Hard Trolleys');

    // Verify obsolete vehicles are NOT present
    await expect(page.locator('text=Mahindra Bolero')).toHaveCount(0);
    await expect(page.locator('text=Tata Sumo')).toHaveCount(0);
  });

  test('Category filter tabs filter vehicle cards correctly', async ({ page }) => {
    // 1. Filter by Sedans
    const sedanTab = page.locator('button[data-fleet-filter="sedan"]');
    await sedanTab.click();

    await expect(page.locator('#dzire')).toBeVisible();
    await expect(page.locator('#etios')).toBeVisible();
    await expect(page.locator('#tempo-12')).not.toBeVisible();
    await expect(page.locator('#urbania')).not.toBeVisible();

    // 2. Filter by Tempo Travellers & Coaches
    const tempoTab = page.locator('button[data-fleet-filter="tempo"]');
    await tempoTab.click();

    await expect(page.locator('#dzire')).not.toBeVisible();
    await expect(page.locator('#tempo-12')).toBeVisible();
    await expect(page.locator('#tempo-14')).toBeVisible();
    await expect(page.locator('#tempo-17')).toBeVisible();
    await expect(page.locator('#tempo-20')).toBeVisible();
    await expect(page.locator('#tempo-26')).toBeVisible();
    await expect(page.locator('#urbania')).not.toBeVisible();

    // 3. Filter by Force Urbania VIP
    const luxuryTab = page.locator('button[data-fleet-filter="luxury"]');
    await luxuryTab.click();

    await expect(page.locator('#urbania')).toBeVisible();
    await expect(page.locator('#tempo-12')).not.toBeVisible();
    await expect(page.locator('#dzire')).not.toBeVisible();

    // 4. Reset to All Vehicles
    const allTab = page.locator('button[data-fleet-filter="all"]');
    await allTab.click();

    const visibleCards = page.locator('.fleet-card:visible');
    await expect(visibleCards).toHaveCount(11);
  });

  test('Comparison matrix table displays all 11 vehicles with correct rates', async ({ page }) => {
    const table = page.locator('table');
    await expect(table).toBeVisible();

    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(11);

    await expect(table).toContainText('12-Seater Luxury Force Tempo');
    await expect(table).toContainText('17-Seater Executive Force Tempo (4020 WB)');
    await expect(table).toContainText('Force Urbania VIP Luxury Chauffeur Van');
    await expect(table).toContainText('₹24/km');
    await expect(table).toContainText('₹26/km');
    await expect(table).toContainText('₹38/km');
  });

  test('Structured Data (ItemList and FAQPage) is present and valid', async ({ page }) => {
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThan(0);

    let hasFleetItemList = false;
    let hasFAQ = false;

    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).textContent();
      if (!text) continue;
      try {
        const parsed = JSON.parse(text);
        const graph = parsed['@graph'] || [parsed];
        for (const item of graph) {
          if (item['@type'] === 'ItemList' && item['@id'] && item['@id'].includes('fleet')) {
            hasFleetItemList = true;
            expect(item.itemListElement.length).toBe(11);
          }
          if (item['@type'] === 'FAQPage') {
            hasFAQ = true;
            expect(item.mainEntity.length).toBeGreaterThanOrEqual(5);
          }
        }
      } catch (e) {
        // pass
      }
    }

    expect(hasFleetItemList).toBe(true);
    expect(hasFAQ).toBe(true);
  });
});
