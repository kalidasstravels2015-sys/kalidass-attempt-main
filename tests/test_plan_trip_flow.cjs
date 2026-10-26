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

  // Click "Plan My Trip ->" button in the calculator tile
  const planBtnInCalc = page.locator('button:has-text("Plan My Trip")').first();
  await planBtnInCalc.click();
  // Wait for typing indicator to attach, then detach
  await page.waitForSelector('#ai-typing-indicator', { state: 'attached', timeout: 3000 }).catch(() => {});
  await page.waitForSelector('#ai-typing-indicator', { state: 'detached', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  // Scroll chat thread to bottom
  await page.evaluate(() => {
    const thread = document.getElementById('ai-chat-thread');
    if (thread) thread.scrollTop = thread.scrollHeight;
  });
  await page.waitForTimeout(500);

  // Take screenshot of the reply
  const replyPath = path.resolve('C:/Users/spoll/.gemini/antigravity-ide/brain/57fb6232-38ba-4a58-a2dd-6af960bea854/plan_trip_reply.png');
  await page.screenshot({ path: replyPath });
  console.log('Saved reply screenshot to', replyPath);

  await browser.close();
  console.log('Done!');
})();
