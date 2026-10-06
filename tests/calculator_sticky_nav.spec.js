import { test, expect } from '@playwright/test';

test.describe('Calculator Sticky Navigation Pill Bar', () => {
  test('Pill bar is sticky at top-16 when scrolling and tracks sections', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/calculator/');

    const nav = page.locator('nav[data-quick-nav]');
    await expect(nav).toBeVisible();

    // Verify no unwanted airport booking summary banner is rendered
    await expect(page.locator('div[role="banner"][aria-label="Booking summary"]')).toHaveCount(0);

    // Check initial position (below header)
    const initialBox = await nav.boundingBox();
    expect(initialBox).not.toBeNull();
    expect(initialBox.y).toBeGreaterThan(100);

    // Scroll down 500px
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(400);

    // Nav should stick at 64px (top-16)
    const scrolledBox = await nav.boundingBox();
    expect(scrolledBox).not.toBeNull();
    expect(Math.round(scrolledBox.y)).toBe(64);

    // Click 'Airport Taxi' pill
    const airportLink = nav.locator('a[href="#airport-taxi-estimator"]');
    await airportLink.click();
    await page.waitForTimeout(1000);

    // Verify it smoothly scrolled and remains sticky at top-16
    const postClickBox = await nav.boundingBox();
    expect(Math.round(postClickBox.y)).toBe(64);

    // Verify airport taxi estimator is in viewport
    const airportSection = page.locator('#airport-taxi-estimator');
    const airportBox = await airportSection.boundingBox();
    expect(airportBox).not.toBeNull();
    expect(airportBox.y).toBeGreaterThanOrEqual(64);
  });

  test('Mobile viewport: sticky pill bar with horizontal swipe navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/calculator/');

    const nav = page.locator('nav[data-quick-nav]');
    await expect(nav).toBeVisible();

    // Scroll down 600px
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(400);

    // Check stickiness on mobile
    const scrolledBox = await nav.boundingBox();
    expect(scrolledBox).not.toBeNull();
    expect(Math.round(scrolledBox.y)).toBe(64);

    // Click Acting Drivers
    const driverLink = nav.locator('a[href="#acting-driver-estimator"]');
    await driverLink.click();
    await page.waitForTimeout(1000);

    // Verify nav is still sticky at 64px
    const finalBox = await nav.boundingBox();
    expect(Math.round(finalBox.y)).toBe(64);
  });
});
