import { chromium } from '@playwright/test';

(async () => {
  try {
    const browser = await chromium.launch({
      channel: 'msedge',
      headless: true
    });
    const context = await browser.newContext({
      viewport: { width: 412, height: 924 },
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    await page.goto('http://localhost:4321/services/tempo-traveller-rental-chennai/', { waitUntil: 'networkidle' });
    
    // Find #fleet-section
    const fleet = await page.$('#fleet-section');
    if (fleet) {
      await fleet.scrollIntoViewIfNeeded();
      
      // Click 17-Seater tab
      const tab17 = await page.$('button[data-target-tab="van-17"]');
      if (tab17) {
        await tab17.click();
        await page.waitForTimeout(400);
        await fleet.screenshot({
          path: 'C:\\Users\\spoll\\.gemini\\antigravity-ide\\brain\\87bea370-302a-473a-845c-45616b1ed28a\\tab17_screenshot.png'
        });
        console.log('Tab 17 screenshot taken!');
      }

      // Click Urbania tab
      const tabUrbania = await page.$('button[data-target-tab="van-urbania"]');
      if (tabUrbania) {
        await tabUrbania.click();
        await page.waitForTimeout(400);
        await fleet.screenshot({
          path: 'C:\\Users\\spoll\\.gemini\\antigravity-ide\\brain\\87bea370-302a-473a-845c-45616b1ed28a\\tab_urbania_screenshot.png'
        });
        console.log('Tab Urbania screenshot taken!');
      }
    }
    await browser.close();
  } catch (err) {
    console.error('Playwright error:', err);
  }
})();
