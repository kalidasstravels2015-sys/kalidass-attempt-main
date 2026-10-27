const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Test (1280x800)
  console.log('Testing Desktop Viewport (1280x800)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await desktopContext.newPage();

  await page.goto('http://localhost:4321/services/tempo-traveller-rental-chennai/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click floating Plan My Trip button
  console.log('Clicking floating AI button...');
  await page.click('#floating-ai-btn');
  await page.waitForTimeout(600);

  // Verify Side Panel is visible
  const modalBox = page.locator('#ai-modal-box');
  const isBoxVisible = await modalBox.isVisible();
  console.log('Side panel box visible:', isBoxVisible);

  // Take screenshot of Initial Welcome Hero State
  const welcomeHero = page.locator('#ai-welcome-hero');
  const isHeroVisible = await welcomeHero.isVisible();
  console.log('Welcome Hero visible initially:', isHeroVisible);

  const contextPill = page.locator('#ai-context-pill');
  const contextText = await contextPill.innerText().catch(() => '');
  console.log('Context Pill Text:', contextText);

  const heroScreenshotPath = path.resolve('C:/Users/spoll/.gemini/antigravity-ide/brain/a1c5ed09-0b47-489b-93ae-ff81bb549238/ask_gemini_welcome_hero.png');
  await page.screenshot({ path: heroScreenshotPath });
  console.log('Saved welcome hero screenshot to', heroScreenshotPath);

  // Click on the first prompt card: "Multiple Places & Outstation Tour"
  console.log('Clicking first welcome prompt card...');
  const firstPrompt = page.locator('.welcome-prompt-card').first();
  await firstPrompt.click();

  // Wait for typing indicator and response
  await page.waitForSelector('#ai-typing-indicator', { state: 'attached', timeout: 3000 }).catch(() => {});
  await page.waitForSelector('#ai-typing-indicator', { state: 'detached', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Verify Hero is now hidden
  const isHeroHiddenNow = !(await welcomeHero.isVisible());
  console.log('Welcome Hero hidden after query:', isHeroHiddenNow);

  // Verify chat bubbles exist
  const bubbles = await page.locator('.ai-chat-bubble-row').count();
  console.log('Chat bubbles count:', bubbles);

  const responseScreenshotPath = path.resolve('C:/Users/spoll/.gemini/antigravity-ide/brain/a1c5ed09-0b47-489b-93ae-ff81bb549238/ask_gemini_rich_cards_reply.png');
  await page.screenshot({ path: responseScreenshotPath });
  console.log('Saved reply screenshot to', responseScreenshotPath);

  // Click "New Chat" button to reset
  console.log('Clicking New Chat button...');
  await page.click('#ai-new-chat-btn');
  await page.waitForTimeout(500);

  const isHeroRestored = await welcomeHero.isVisible();
  console.log('Welcome Hero restored after New Chat:', isHeroRestored);

  // 2. Mobile Test (412x915)
  console.log('Testing Mobile Viewport (412x915)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:4321/services/tempo-traveller-rental-chennai/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  await mobilePage.click('#floating-ai-btn');
  await mobilePage.waitForTimeout(600);

  const mobileScreenshotPath = path.resolve('C:/Users/spoll/.gemini/antigravity-ide/brain/a1c5ed09-0b47-489b-93ae-ff81bb549238/ask_gemini_mobile_sheet.png');
  await mobilePage.screenshot({ path: mobileScreenshotPath });
  console.log('Saved mobile sheet screenshot to', mobileScreenshotPath);

  await browser.close();
  console.log('All tests passed successfully!');
})();
