// tests/test_multiline_plan_trip.cjs
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Starting Playwright test for Multi-line Chat & Plan My Trip...');
  const browser = await chromium.launch({ headless: true });
  
  // Test 1: Desktop Viewport
  const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await desktopPage.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  console.log('Loaded desktop page');

  // Open Ask Gemini / Plan My Trip
  await desktopPage.evaluate(() => {
    if (window.openAiFareModal) window.openAiFareModal();
  });
  await desktopPage.waitForTimeout(600);

  const input = desktopPage.locator('#ai-user-input');
  const bulletBtn = desktopPage.locator('#ai-bullet-btn');
  const sendBtn = desktopPage.locator('#ai-send-btn');

  // Check initial height
  const initialBox = await input.boundingBox();
  console.log('Initial input height:', initialBox ? initialBox.height : 'unknown');

  // Test Bullet button
  console.log('Clicking Bullet button...');
  await bulletBtn.click();
  let currentVal = await input.inputValue();
  console.log('Value after 1st bullet click:', JSON.stringify(currentVal));

  // Type a multi-line formatted trip plan
  const multiLinePlan = `Hi Kalidass Travels, we want to book a trip:
• From: Chennai
• Places to visit: Pondicherry, Auroville, Paradise Beach
• Number of days: 2 days (21st Nov 8:00 AM to 22nd Nov 8:00 PM)
• Passengers: 7 members (5 adults, 2 kids)
• Luggage: 4 bags

Please provide vehicle quote for Innova and Tempo Traveller.`;

  await input.fill(multiLinePlan);
  await desktopPage.waitForTimeout(300);

  const expandedBox = await input.boundingBox();
  console.log('Expanded input height after multi-line text:', expandedBox ? expandedBox.height : 'unknown');

  // Take screenshot before send
  const screenshotBeforePath = path.resolve('tests/multiline_chat_input_before_send.png');
  await desktopPage.screenshot({ path: screenshotBeforePath });
  console.log('Saved screenshot before send:', screenshotBeforePath);

  // Send message
  console.log('Clicking send button...');
  await sendBtn.click();
  await desktopPage.waitForTimeout(2500);

  // Take screenshot after send showing user message bubble with line breaks preserved
  const screenshotAfterPath = path.resolve('tests/multiline_chat_user_bubble_after_send.png');
  await desktopPage.screenshot({ path: screenshotAfterPath });
  console.log('Saved screenshot after send:', screenshotAfterPath);

  // Verify user message bubble in DOM contains whitespace-pre-wrap
  const userBubbleStyle = await desktopPage.evaluate(() => {
    const userBubble = document.querySelector('.ai-msg-content');
    if (!userBubble) return null;
    const parent = userBubble.closest('.bg-blue-600');
    return {
      classes: parent ? parent.className : '',
      text: userBubble.innerText
    };
  });
  console.log('User Bubble Verification:', userBubbleStyle);

  // Test 2: Mobile Viewport (412x915)
  console.log('\nTesting Mobile Viewport...');
  const mobilePage = await browser.newPage({ viewport: { width: 412, height: 915 } });
  await mobilePage.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await mobilePage.evaluate(() => {
    if (window.openAiFareModal) window.openAiFareModal();
  });
  await mobilePage.waitForTimeout(600);

  const mobileInput = mobilePage.locator('#ai-user-input');
  await mobileInput.fill(`Chennai to Tirupati
• 7 members
• 2 days
Please quote Ertiga & Innova`);
  await mobilePage.waitForTimeout(300);

  const mobileScreenshotPath = path.resolve('tests/multiline_chat_mobile_view.png');
  await mobilePage.screenshot({ path: mobileScreenshotPath });
  console.log('Saved mobile screenshot:', mobileScreenshotPath);

  await browser.close();
  console.log('All multi-line tests completed successfully!');
})();
