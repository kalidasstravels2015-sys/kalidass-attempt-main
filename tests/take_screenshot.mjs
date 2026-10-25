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
      await page.waitForTimeout(600);
      await page.screenshot({
        path: 'C:\\Users\\spoll\\.gemini\\antigravity-ide\\brain\\87bea370-302a-473a-845c-45616b1ed28a\\fleet_viewport.png'
      });
      console.log('Fleet viewport screenshot taken!');
      await fleet.screenshot({
        path: 'C:\\Users\\spoll\\.gemini\\antigravity-ide\\brain\\87bea370-302a-473a-845c-45616b1ed28a\\fleet_section_element.png'
      });
      console.log('Fleet section element screenshot taken!');
    } else {
      console.log('#fleet-section not found');
    }
    await browser.close();
  } catch (err) {
    console.error('Playwright error:', err);
  }
})();
