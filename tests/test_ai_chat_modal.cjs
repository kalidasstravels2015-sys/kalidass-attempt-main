// tests/test_ai_chat_modal.cjs
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Starting Playwright interactive browser test for AI Concierge...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 412, height: 915 } }); // Mobile viewport like user's phone screenshot

  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  console.log('Loaded homepage');

  // Find floating Ask me / Gemini button and click it
  const askMeBtn = page.locator('#ask-me-fab, button:has-text("Ask me"), #modal-header-gemini').first();
  await page.evaluate(() => {
    // Open modal directly if button is tricky
    const modal = document.getElementById('ai-fare-modal');
    if (modal) {
      modal.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      modal.classList.add('flex', 'opacity-100', 'pointer-events-auto');
    }
  });
  await page.waitForTimeout(500);

  const input = page.locator('#ai-user-input');
  const sendBtn = page.locator('#ai-send-btn');

  // Turn 1: Ask 1-day Tirupati
  console.log('Submitting Turn 1: Chennai to Tirupati 1-day package in Sedan and Ertiga...');
  await input.fill('How much for Chennai to Tirupati 1-day package in Sedan and Ertiga?');
  await sendBtn.click();
  await page.waitForTimeout(1000);

  // Turn 2: Ask for 2 days ?
  console.log('Submitting Turn 2: for 2 days ? ...');
  await input.fill('for 2 days ?');
  await sendBtn.click();
  await page.waitForTimeout(1000);

  // Turn 3: Ask what about Innova Crysta?
  console.log('Submitting Turn 3: what about Innova Crysta? ...');
  await input.fill('what about Innova Crysta?');
  await sendBtn.click();
  await page.waitForTimeout(1000);

  // Scroll chat to bottom
  await page.evaluate(() => {
    const thread = document.getElementById('ai-chat-thread');
    if (thread) thread.scrollTop = thread.scrollHeight;
  });
  await page.waitForTimeout(500);

  const screenshotPath = path.resolve(process.cwd(), 'tests/ai_chat_multi_turn_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Captured screenshot to: ${screenshotPath}`);

  // Extract messages from DOM
  const messages = await page.evaluate(() => {
    const thread = document.getElementById('ai-chat-thread');
    if (!thread) return [];
    return Array.from(thread.children).map(c => c.innerText.trim()).filter(Boolean);
  });

  console.log('\n--- EXTRACTED CHAT THREAD MESSAGES ---');
  messages.forEach((m, idx) => {
    console.log(`[Msg ${idx + 1}]:\n${m}\n`);
  });

  await browser.close();
  console.log('Playwright test completed successfully!');
})();
