const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4321/services/outstation-cabs/ ...');
  await page.goto('http://localhost:4321/services/outstation-cabs/', { waitUntil: 'networkidle' });

  // Scroll to calculator
  const calc = page.locator('#outstation-calculator, #fare-calculator, [data-calculator-root]').first();
  await page.waitForTimeout(1000);

  const calcPath = path.resolve('C:/Users/spoll/.gemini/antigravity-ide/brain/57fb6232-38ba-4a58-a2dd-6af960bea854/plan_trip_calculator.png');
  await page.screenshot({ path: calcPath });
  console.log('Saved calculator screenshot to', calcPath);

  // Click floating Plan My Trip button
  const planTripBtn = page.locator('#floating-ai-btn');
  await planTripBtn.click();
  await page.waitForTimeout(1000);

  const modalPath = path.resolve('C:/Users/spoll/.gemini/antigravity-ide/brain/57fb6232-38ba-4a58-a2dd-6af960bea854/plan_trip_modal.png');
  await page.screenshot({ path: modalPath });
  console.log('Saved modal screenshot to', modalPath);

  await browser.close();
  console.log('Done!');
})();
