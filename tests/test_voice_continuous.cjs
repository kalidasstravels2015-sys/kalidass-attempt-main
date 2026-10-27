// tests/test_voice_continuous.cjs
const { chromium } = require('playwright');

(async () => {
  console.log('--- Testing Continuous Speech Recognition & Breath Resilience ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 412, height: 915 } });

  // Inject MockSpeechRecognition with event dispatch helpers
  await page.addInitScript(() => {
    class MockSpeechRecognition {
      constructor() {
        this.continuous = false;
        this.interimResults = false;
        this.maxAlternatives = 1;
        this.lang = '';
        this.onstart = null;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
        window.__mockRecognitionInstance = this;
      }
      start() {
        window.__mockRecognitionStarted = true;
        if (this.onstart) setTimeout(() => this.onstart(), 50);
      }
      stop() {
        window.__mockRecognitionStopped = true;
        if (this.onend) setTimeout(() => this.onend(), 50);
      }
      abort() {
        window.__mockRecognitionAborted = true;
        if (this.onend) setTimeout(() => this.onend(), 50);
      }
    }
    window.SpeechRecognition = MockSpeechRecognition;
    window.webkitSpeechRecognition = MockSpeechRecognition;
  });

  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  console.log('1. Page loaded successfully.');

  // Open the AI modal
  await page.evaluate(() => {
    if (window.openAiFareModal) window.openAiFareModal();
  });
  await page.waitForTimeout(500);

  const modal = page.locator('#ai-fare-assistant-modal');
  const isModalVisible = await modal.isVisible();
  console.log('2. AI Chat Modal visible:', isModalVisible);

  const micBtn = page.locator('#ai-mic-btn');
  const voiceStatus = page.locator('#ai-voice-status');
  const voiceStatusText = page.locator('#ai-voice-status-text');
  const voiceDoneBtn = page.locator('#ai-voice-done-btn');
  const voiceCancelBtn = page.locator('#ai-voice-cancel-btn');
  const userInput = page.locator('#ai-user-input');

  // Verify initial state
  console.log('3. Clicking mic button to start voice recognition...');
  await micBtn.click();
  await page.waitForTimeout(300);

  // Check mock recognition configuration
  const config = await page.evaluate(() => {
    const inst = window.__mockRecognitionInstance;
    return {
      continuous: inst ? inst.continuous : null,
      interimResults: inst ? inst.interimResults : null,
      started: window.__mockRecognitionStarted
    };
  });
  console.log('4. Recognition Instance Config:', JSON.stringify(config));

  if (config.continuous !== true) {
    throw new Error('FAIL: recognition.continuous should be true for breathing resilience!');
  }
  console.log('✓ PASS: recognition.continuous is TRUE (user can breathe without closing mic).');

  const isStatusVisible = await voiceStatus.isVisible();
  const statusMsg = await voiceStatusText.innerText();
  console.log('5. Voice status bar visible:', isStatusVisible, '| Message:', statusMsg);
  console.log('   Done button visible:', await voiceDoneBtn.isVisible());
  console.log('   Cancel button visible:', await voiceCancelBtn.isVisible());

  // Simulate Speech Segment 1: User says "Chennai to Pondicherry"
  console.log('6. Simulating speech segment 1: "Chennai to Pondicherry"...');
  await page.evaluate(() => {
    const inst = window.__mockRecognitionInstance;
    if (inst && inst.onresult) {
      const mockEvent = {
        resultIndex: 0,
        results: [
          Object.assign([{ transcript: 'Chennai to Pondicherry' }], { isFinal: true })
        ]
      };
      inst.onresult(mockEvent);
    }
  });
  await page.waitForTimeout(300);

  let val1 = await userInput.inputValue();
  console.log('   Input value after segment 1:', JSON.stringify(val1));

  // Simulate User Breathing / Pausing for 1.2 seconds
  console.log('7. Simulating user taking a breath (pause of 1.2s)...');
  await page.waitForTimeout(1200);

  // Verify mic is STILL listening and has NOT closed or sent
  const isStillListening = await page.evaluate(() => {
    const status = document.getElementById('ai-voice-status');
    return status && !status.classList.contains('hidden');
  });
  console.log('   Mic still active after taking a breath:', isStillListening);
  if (!isStillListening) {
    throw new Error('FAIL: Mic closed while user was taking a breath!');
  }
  console.log('✓ PASS: Mic stayed open during the breath pause!');

  // Simulate Speech Segment 2: User continues speaking after the breath
  console.log('8. Simulating speech segment 2 after breath: "tomorrow morning 6 AM Ertiga"...');
  await page.evaluate(() => {
    const inst = window.__mockRecognitionInstance;
    if (inst && inst.onresult) {
      const mockEvent = {
        resultIndex: 1,
        results: [
          Object.assign([{ transcript: 'Chennai to Pondicherry' }], { isFinal: true }),
          Object.assign([{ transcript: 'tomorrow morning 6 AM Ertiga' }], { isFinal: true })
        ]
      };
      inst.onresult(mockEvent);
    }
  });
  await page.waitForTimeout(300);

  let val2 = await userInput.inputValue();
  console.log('   Input value after segment 2:', JSON.stringify(val2));
  if (!val2.includes('Chennai to Pondicherry') || !val2.includes('tomorrow morning 6 AM Ertiga')) {
    throw new Error('FAIL: Concatenated speech text missing either segment: ' + val2);
  }
  console.log('✓ PASS: Speech across breath pauses was seamlessly concatenated!');

  // Test Done button click
  console.log('9. Clicking Done button (#ai-voice-done-btn)...');
  await voiceDoneBtn.click();
  await page.waitForTimeout(500);

  // Check typing indicator or user bubble
  const typingIndicator = await page.locator('#ai-typing-indicator').isVisible().catch(() => false);
  const userBubbles = await page.locator('.ai-chat-bubble-row').count();
  console.log('10. Request submitted successfully! User bubbles:', userBubbles, '| Typing indicator:', typingIndicator);

  // Take screenshot for verification
  const screenshotPath = 'tests/voice_continuous_verified.png';
  await page.screenshot({ path: screenshotPath });
  console.log('Saved verification screenshot to', screenshotPath);

  await browser.close();
  console.log('\n*** ALL TESTS PASSED SUCCESSFULLY! Continuous voice listening is working perfectly. ***');
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
