const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:4321/services/chennai-airport-taxi/', { waitUntil: 'networkidle' });
  
  // Find neighborhood button
  const tambaramBtn = page.locator('button.neighborhood-book-btn[data-location*="Tambaram"]');
  await tambaramBtn.scrollIntoViewIfNeeded();
  await tambaramBtn.click();
  await page.waitForTimeout(600);
  
  await page.screenshot({ path: 'tests/audit_neighborhood_click_mobile.png' });
  await browser.close();
  console.log('Clicked and captured');
})();
