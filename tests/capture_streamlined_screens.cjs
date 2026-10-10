const { chromium } = require('playwright');

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:4322/services/tirupati-package/');

  // 1. Facts screenshot
  await page.locator('#facts').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/ccc9054b-7086-45f3-bf46-cdb609b47f83/tirupati_streamlined_facts_mobile.png' });

  // 2. Guide tab 1 (practical)
  await page.locator('#guide').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/ccc9054b-7086-45f3-bf46-cdb609b47f83/tirupati_streamlined_guide_tab1_mobile.png' });

  // 3. Guide tab 2 (significance)
  await page.locator('#guide-tab-btn-significance').click();
  await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/ccc9054b-7086-45f3-bf46-cdb609b47f83/tirupati_streamlined_guide_tab2_mobile.png' });

  // 4. Comparison section
  await page.locator('section[aria-label="Why Choose Kalidass Travels Over Online Aggregators"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/ccc9054b-7086-45f3-bf46-cdb609b47f83/tirupati_streamlined_compare_mobile.png' });

  // 5. Desktop Guide screenshot
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator('#guide').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'C:/Users/spoll/.gemini/antigravity-ide/brain/ccc9054b-7086-45f3-bf46-cdb609b47f83/tirupati_streamlined_guide_desktop.png' });

  await browser.close();
  console.log('Screenshots captured and saved to brain directory');
}

capture();
