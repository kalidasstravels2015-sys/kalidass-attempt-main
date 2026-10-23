import { test } from '@playwright/test';

test('Capture Chidambaram visual screenshots', async ({ page }) => {
  const dir = 'C:/Users/spoll/.gemini/antigravity-ide/brain/b4d4568c-acb4-475b-8302-370e80b1302b';
  
  // Mobile screenshots
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/services/chidambaram-temple-trip/');

  // 1. Mobile Hero View
  await page.screenshot({ path: `${dir}/chidambaram_mobile_hero.png` });

  // 2. Mobile Facts & Speakable Snippet
  await page.locator('#facts').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${dir}/chidambaram_mobile_facts.png` });

  // 3. Mobile Fleet Carousel
  await page.locator('#fleet-carousel-track').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${dir}/chidambaram_mobile_carousel.png` });

  // 4. Mobile Guide
  await page.locator('#guide').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${dir}/chidambaram_mobile_guide.png` });

  // 5. Desktop Hero & Booking Engine
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/services/chidambaram-temple-trip/');
  await page.screenshot({ path: `${dir}/chidambaram_desktop_hero.png` });
});
