import { test, expect } from '@playwright/test';

test.describe('Streamlined Acting Drivers Page Validation', () => {
  test('Verify swapped card positions, pill elimination, and calculator interactivity', async ({ page }) => {
    // 1. Measure Desktop Scroll Height on Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/services/acting-drivers/', { waitUntil: 'networkidle' });

    const desktopHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log(`\n=== SCROLL MEASUREMENT ===`);
    console.log(`Desktop Scroll Height: ${desktopHeight}px`);

    // Verify significant reduction from original >6000px
    expect(desktopHeight).toBeLessThan(4800);

    // 2. Verify Card Order: 1. City Metro, 2. One-Way Drop, 3. Round Trip
    const cardHeaders = await page.locator('#pricing-panel-cards h3').allInnerTexts();
    console.log('Card Headers found:', cardHeaders);
    expect(cardHeaders.length).toBe(3);
    expect(cardHeaders[0]).toContain('Within Chennai Metro');
    expect(cardHeaders[1]).toContain('Outstation One-Way Drop');
    expect(cardHeaders[2]).toContain('Outstation Round Trip');
    console.log('✔ Card order verified: 1. Local Metro -> 2. One-Way Drop -> 3. Round Trip.');

    // 2b. Verify WhatsApp buttons in all 3 cards match bottom sticky WhatsApp button style
    const cardWaButtons = page.locator('#pricing-panel-cards a[href*="wa.me"]');
    const waCount = await cardWaButtons.count();
    expect(waCount).toBe(3);
    for (let i = 0; i < waCount; i++) {
      const btn = cardWaButtons.nth(i);
      const cls = await btn.getAttribute('class');
      expect(cls).toContain('bg-emerald-50');
      expect(cls).toContain('text-emerald-950');
      expect(cls).toContain('border-emerald-300');
      const text = await btn.innerText();
      expect(text).toContain('WhatsApp Enquiry');
    }
    console.log('✔ All 3 card WhatsApp buttons match the bottom sticky WhatsApp button style.');

    // 3. Verify No Horizontal Tab Switchers / Pills
    const legacyPillBars = await page.locator('nav[data-quick-nav]').count();
    expect(legacyPillBars).toBe(0);
    const legacyPricingTabs = await page.locator('#pricing-tab-btn-cards').count();
    expect(legacyPricingTabs).toBe(0);
    const legacyStandardsTabs = await page.locator('#standards-tab-btn-transmissions').count();
    expect(legacyStandardsTabs).toBe(0);
    const legacyCoverageTabs = await page.locator('button[data-coverage-target]').count();
    expect(legacyCoverageTabs).toBe(0);
    console.log('✔ All 14 redundant horizontal tab pills successfully eliminated.');

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
    await calcBtn.click();

    // Check that breakdown appears
    const resultBox = page.locator('#acting-driver-result-card');
    await expect(resultBox).toBeVisible({ timeout: 5000 });
    const resultText = await resultBox.innerText();
    expect(resultText.toUpperCase()).toContain('TRANSPARENT ESTIMATE');
    expect(resultText).toContain('1,600');
    console.log('✔ Custom calculation executed successfully: ₹1,600 for Pondicherry One-Way.');

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
    expect(mobileHeight).toBeLessThan(6500); // Drastically reduced from 7,743px

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
