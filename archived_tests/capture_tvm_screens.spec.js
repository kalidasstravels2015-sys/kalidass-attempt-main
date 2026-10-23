import { test } from '@playwright/test';

test('Capture Thiruvannamalai mobile and desktop screenshots', async ({ page }) => {
  const dir = 'C:/Users/spoll/.gemini/antigravity-ide/brain/b4d4568c-acb4-475b-8302-370e80b1302b';

  // 1. Mobile viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/services/thiruvannamalai-girivalam-trip/');

  // Mobile Hero
  await page.screenshot({ path: `${dir}/tvm_mobile_hero.png` });

  // Mobile Facts & Speakable block
  await page.locator('#facts').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${dir}/tvm_mobile_facts.png` });

  // Mobile Fleet Carousel
  await page.locator('#fleet-carousel-track').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${dir}/tvm_mobile_carousel.png` });

  // Mobile Guide
  await page.locator('#guide').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${dir}/tvm_mobile_guide.png` });

  // 2. Desktop viewport
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/services/thiruvannamalai-girivalam-trip/');

  // Desktop Split Hero with Booking Engine
  await page.screenshot({ path: `${dir}/tvm_desktop_hero.png` });
});
