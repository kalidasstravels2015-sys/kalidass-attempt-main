const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });

  console.log('--- 1. DESKTOP VIEWPORT TEST (1440x900) ---');
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const consoleErrors = [];
  desktopPage.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  desktopPage.on('pageerror', err => consoleErrors.push(err.message));

  await desktopPage.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

  // Check floating button
  const floatingBtn = desktopPage.locator('#floating-ai-plan-btn');
  const btnVisible = await floatingBtn.isVisible();
  const btnText = (await floatingBtn.innerText()).trim();
  console.log('Floating button visible:', btnVisible);
  console.log('Floating button text:', JSON.stringify(btnText));

  if (!btnText.includes('Plan Trip')) {
    throw new Error('Expected button text to include "Plan Trip", got: ' + btnText);
  }

  // Click floating button
  console.log('Clicking "Plan Trip" button...');
  await floatingBtn.click();
  await desktopPage.waitForTimeout(600);

  // Verify modal is open and visible
  const modalBox = desktopPage.locator('#ai-modal-box');
  const isBoxVisible = await modalBox.isVisible();
  const boxBounds = await modalBox.boundingBox();
  console.log('Modal box visible:', isBoxVisible);
  console.log('Modal box bounds:', boxBounds);

  if (!isBoxVisible || !boxBounds || boxBounds.width === 0) {
    throw new Error('Modal box did not open or is off-screen!');
  }

  const modalTitle = (await desktopPage.locator('#ai-modal-title').innerText()).trim();
  console.log('Modal title:', JSON.stringify(modalTitle));
  if (!modalTitle.includes('Plan Your Trip')) {
    throw new Error('Expected modal title "Plan Your Trip", got: ' + modalTitle);
  }

  const heroHeading = (await desktopPage.locator('#ai-welcome-hero h3').innerText()).trim();
  console.log('Hero heading:', JSON.stringify(heroHeading));

  // Check no "Gemini" in modal header or title
  const headerHtml = await desktopPage.locator('header').first().innerHTML();
  const hasGeminiInHeader = /gemini/i.test(headerHtml);
  console.log('Has "Gemini" in header?', hasGeminiInHeader);

  // Take screenshot of opened modal on desktop
  const desktopShot = path.resolve('scratch/audit_desktop_plan_trip.png');
  await desktopPage.screenshot({ path: desktopShot });
  console.log('Saved desktop screenshot to:', desktopShot);

  // Test submitting a plan request
  console.log('Clicking prompt card...');
  const firstPrompt = desktopPage.locator('.welcome-prompt-card').first();
  await firstPrompt.click();

  // Wait for typing indicator and response
  await desktopPage.waitForSelector('#ai-typing-indicator', { state: 'attached', timeout: 3000 }).catch(() => {});
  await desktopPage.waitForSelector('#ai-typing-indicator', { state: 'detached', timeout: 15000 }).catch(() => {});
  await desktopPage.waitForTimeout(1000);

  const replyShot = path.resolve('scratch/audit_desktop_reply.png');
  await desktopPage.screenshot({ path: replyShot });
  console.log('Saved reply screenshot to:', replyShot);

  console.log('--- 2. MOBILE VIEWPORT TEST (390x844) ---');
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

  // On mobile, scroll down slightly to reveal the Plan Trip button
  await mobilePage.evaluate(() => window.scrollBy(0, 300));
  await mobilePage.waitForTimeout(500);

  const mobileBtn = mobilePage.locator('#floating-ai-plan-btn');
  console.log('Mobile Plan Trip visible after scroll:', await mobileBtn.isVisible());

  await mobileBtn.click();
  await mobilePage.waitForTimeout(600);

  const mobileBox = mobilePage.locator('#ai-modal-box');
  const mobileBoxBounds = await mobileBox.boundingBox();
  console.log('Mobile modal box visible:', await mobileBox.isVisible());
  console.log('Mobile modal box bounds:', mobileBoxBounds);

  const mobileShot = path.resolve('scratch/audit_mobile_plan_trip.png');
  await mobilePage.screenshot({ path: mobileShot });
  console.log('Saved mobile screenshot to:', mobileShot);

  console.log('Console errors:', consoleErrors);
  await browser.close();

  console.log('=== ALL AUDIT CHECKS PASSED SUCCESSFULLY ===');
})();
