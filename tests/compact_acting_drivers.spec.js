import { test, expect } from '@playwright/test';

test.describe('Streamlined Acting Drivers Page Validation', () => {
  test('Verify swapped card positions, pill elimination, and calculator interactivity', async ({ page }) => {
    // 1. Measure Desktop Scroll Height on Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/services/acting-drivers/', { waitUntil: 'networkidle' });

    const desktopHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log(`\n=== SCROLL MEASUREMENT ===`);
    console.log(`Desktop Scroll Height: ${desktopHeight}px`);

    // Verify significant reduction from original >6000px (accommodates hero banner and readable M3 typography)
    expect(desktopHeight).toBeLessThan(5800);

    // 2. Verify Card Order: 1. City Metro, 2. One-Way Drop, 3. Round Trip
    const cardHeaders = await page.locator('#pricing-panel-cards h3').allInnerTexts();
    console.log('Card Headers found:', cardHeaders);
    expect(cardHeaders.length).toBe(3);
    expect(cardHeaders[0]).toContain('Within Chennai Metro');
    expect(cardHeaders[1]).toContain('Outstation One-Way Drop');
    expect(cardHeaders[2]).toContain('Outstation Round Trip');
    console.log('✔ Card order verified: 1. Local Metro -> 2. One-Way Drop -> 3. Round Trip.');

    // 2b. Verify tariff cards are non-interactive: no call or whatsapp enquiry buttons in tariff cards
    const cardWaButtons = page.locator('#pricing-panel-cards a[href*="wa.me"]');
    const cardCallButtons = page.locator('#pricing-panel-cards a[href^="tel:"]');
    expect(await cardWaButtons.count()).toBe(0);
    expect(await cardCallButtons.count()).toBe(0);
    console.log('✔ Verified tariff cards are non-interactive without call or whatsapp buttons.');

    // 3. Verify Sticky Quick-Nav Bar Positioned Immediately After Estimator (Learned from Chennai Airport Taxi)
    const quickNav = page.locator('nav[data-quick-nav]');
    await expect(quickNav).toBeVisible();
    await expect(quickNav).toHaveClass(/sticky/);
    await expect(quickNav).toHaveClass(/top-16/);

    // Verify DOM positioning: #trip-estimator is immediately followed by nav[data-quick-nav]
    const isAfterEstimator = await page.evaluate(() => {
      const estimator = document.getElementById('trip-estimator');
      const nav = document.querySelector('nav[data-quick-nav]');
      if (!estimator || !nav) return false;
      return estimator.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING;
    });
    expect(Boolean(isAfterEstimator)).toBe(true);

    const quickNavLinks = quickNav.locator('a');
    expect(await quickNavLinks.count()).toBe(6);
    const linkHrefs = await quickNavLinks.evaluateAll(els => els.map(el => el.getAttribute('href')));
    expect(linkHrefs).toEqual(['#trip-estimator', '#hero-banner', '#how-it-works', '#tariffs', '#coverage', '#driver-faqs']);
    console.log('✔ Sticky Quick-Nav bar verified in document flow after estimator with 6 section links:', linkHrefs);

    // Verify redundant in-card tab switchers remain eliminated
    const legacyPricingTabs = await page.locator('#pricing-tab-btn-cards').count();
    expect(legacyPricingTabs).toBe(0);
    const legacyStandardsTabs = await page.locator('#standards-tab-btn-transmissions').count();
    expect(legacyStandardsTabs).toBe(0);
    const legacyCoverageTabs = await page.locator('button[data-coverage-target]').count();
    expect(legacyCoverageTabs).toBe(0);
    console.log('✔ In-card redundant tab pills remain eliminated.');

    // 4. Verify Interactive Estimator Directly Accessible
    const estimator = page.locator('#trip-estimator');
    await expect(estimator).toBeVisible();

    // Verify default active tab in calculator is One Way Drop
    const onewayTab = page.locator('#acting-driver-tab-oneway');
    const roundTab = page.locator('#acting-driver-tab-round');
    await expect(onewayTab).toHaveAttribute('aria-selected', 'true');

    // Test toggle to Round Trip
    await roundTab.click();
    await expect(roundTab).toHaveAttribute('aria-selected', 'true');
    await expect(onewayTab).toHaveAttribute('aria-selected', 'false');

    // Switch back to One Way
    await onewayTab.click();
    await expect(onewayTab).toHaveAttribute('aria-selected', 'true');
    console.log('✔ Calculator tab switcher is responsive.');

    // 5. Test Calculator Execution
    const pickupInput = page.locator('#acting-driver-pickup-input');
    const dropInput = page.locator('#acting-driver-drop-input');
    await pickupInput.fill('Chennai');
    await dropInput.fill('Pondicherry');
    const calcBtn = page.locator('#acting-driver-calc-btn');
    await calcBtn.click({ force: true });

    // Check that breakdown appears
    const resultBox = page.locator('#acting-driver-result-card');
    await expect(resultBox).toBeVisible({ timeout: 5000 });
    const resultText = await resultBox.innerText();
    expect(resultText.toUpperCase()).toContain('TRANSPARENT ESTIMATE');
    expect(resultText).toContain('2,100');
    console.log('✔ Custom calculation executed successfully: ₹2,100 for Pondicherry One-Way.');

    // 6. Verify Compact Coverage Hub Strip
    const coverageSection = page.locator('#coverage');
    await expect(coverageSection).toBeVisible();
    await expect(page.locator('text=Doorstep Chauffeur Arrival Across Chennai')).toBeVisible();
    await expect(page.locator('text=South & OMR Hub')).toBeVisible();
    await expect(page.locator('text=Central & CBD Hub')).toBeVisible();
    await expect(page.locator('text=Airport & GST Corridor')).toBeVisible();
    await expect(page.locator('text=West & North Suburbs')).toBeVisible();
    console.log('✔ Compact Coverage strip verified with all 4 suburban hubs.');

    // 7. Measure Mobile Viewport and capture screenshot of compact coverage
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload({ waitUntil: 'networkidle' });
    const mobileHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log(`Mobile Scroll Height after condensation: ${mobileHeight}px`);
    // Accommodates hero banner and accessible M3 typography on single-column mobile layout
    expect(mobileHeight).toBeLessThan(8500);

    // Scroll to compact coverage strip and capture screenshot
    await page.locator('#coverage').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/d009ebb2-bab8-4f29-9d14-26c200720c6a/compact_coverage_mobile.png' });
    console.log('✔ Captured compact_coverage_mobile.png');

    // Scroll to first pricing card so both card footer and sticky dock are visible
    const firstCard = page.locator('#pricing-panel-cards > div').first();
    await firstCard.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/d009ebb2-bab8-4f29-9d14-26c200720c6a/card_and_sticky_whatsapp_match.png' });
    console.log('✔ Captured card_and_sticky_whatsapp_match.png');
  });
});
