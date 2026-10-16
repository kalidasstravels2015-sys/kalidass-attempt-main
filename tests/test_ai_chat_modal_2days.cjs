// tests/test_ai_chat_modal_2days.cjs
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 412, height: 915 } });

  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

  // Open modal
  await page.evaluate(() => {
    const modal = document.getElementById('ai-fare-modal');
    if (modal) {
      modal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      modal.classList.add('flex', 'opacity-100', 'pointer-events-auto');
    }
  });
  await page.waitForTimeout(400);

  const input = page.locator('#ai-user-input');
  const sendBtn = page.locator('#ai-send-btn');

  // Turn 1
  await input.fill('How much for Chennai to Tirupati 1-day package in Sedan and Ertiga?');
  await sendBtn.click();
  await page.waitForTimeout(800);

  // Turn 2: Exactly user prompt "for 2 days ?"
  await input.fill('for 2 days ?');
  await sendBtn.click();
  await page.waitForTimeout(800);

  // Scroll to reveal the 2-day reply
  await page.evaluate(() => {
    const thread = document.getElementById('ai-chat-thread');
    if (thread) thread.scrollTop = thread.scrollHeight;
  });
  await page.waitForTimeout(300);

  const screenshotPath = path.resolve(process.cwd(), 'tests/ai_chat_tirupati_2days_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Captured: ${screenshotPath}`);

  await browser.close();
})();
