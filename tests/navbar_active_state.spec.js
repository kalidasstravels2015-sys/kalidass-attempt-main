import { test, expect } from '@playwright/test';

test.describe('Top Navigation Bar - Clean Header & Active Route States', () => {
  test('Mobile viewport: Header is ultra-clean with Logo and Hamburger only', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const nav = page.locator('nav[aria-label="Main Navigation"]');
    await expect(nav).toBeVisible();

    // 1. Verify mobile section chip is completely removed
    const sectionChip = page.locator('#mobile-section-chip');
    await expect(sectionChip).toHaveCount(0);

    // 2. Verify mobile header call button is not present
    const mobileCallBtn = nav.locator('a[href="tel:+918939539211"].sm\\:hidden');
    await expect(mobileCallBtn).toHaveCount(0);

    // 3. Verify hamburger button is present and visible
    const hamburgerBtn = page.locator('#mobile-menu-btn');
    await expect(hamburgerBtn).toBeVisible();

    // 4. Open mobile drawer and verify new quick links
    await hamburgerBtn.click();
    const drawer = page.locator('#mobile-menu-drawer');
    await expect(drawer).toBeVisible();

    await expect(drawer.locator('a[href="/fleet/"]')).toBeVisible();
    await expect(drawer.locator('a[href="/drivers/"]')).toBeVisible();
    await expect(drawer.locator('a[href="/tariff/"]')).toBeVisible();
    await expect(drawer.locator('a[href="/calculator/"]')).toBeVisible();
  });

  test('Desktop viewport: Home page marks Home link active', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const nav = page.locator('nav[aria-label="Main Navigation"]');
    const homeLink = nav.locator('a[href="/"][aria-current="page"]');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveText('Home');

    // Other desktop links should NOT have aria-current="page"
    const fleetLink = nav.locator('a[href="/fleet/"][aria-current="page"]');
    await expect(fleetLink).toHaveCount(0);
  });

  test('Desktop viewport: Fleet page marks Fleet link active', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/fleet/');

    const nav = page.locator('nav[aria-label="Main Navigation"]');
    const fleetLink = nav.locator('a[href="/fleet/"][aria-current="page"]');
    await expect(fleetLink).toBeVisible();
    await expect(fleetLink).toHaveText('Fleet');

    const homeLink = nav.locator('a[href="/"][aria-current="page"]');
    await expect(homeLink).toHaveCount(0);
  });

  test('Desktop viewport: Tariff page marks Tariff link active', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/tariff/');

    const nav = page.locator('nav[aria-label="Main Navigation"]');
    const tariffLink = nav.locator('a[href="/tariff/"][aria-current="page"]');
    await expect(tariffLink).toBeVisible();
    await expect(tariffLink).toHaveText('Tariff');
  });

  test('Desktop viewport: Calculator page marks Calculator link active', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/calculator/');

    const nav = page.locator('nav[aria-label="Main Navigation"]');
    const calcLink = nav.locator('a[href="/calculator/"][aria-current="page"]');
    await expect(calcLink).toBeVisible();
    await expect(calcLink).toHaveText('Fare Calculator');
  });

  test('Desktop viewport: Temple tour page highlights Temple Tours dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/services/tirupati-package/');

    const nav = page.locator('nav[aria-label="Main Navigation"]');
    // Button for Temple Tours should have the active background class
    const templeToursBtn = nav.locator('button:has-text("Temple Tours")');
    await expect(templeToursBtn).toBeVisible();
    await expect(templeToursBtn).toHaveClass(/bg-m3-primary/);
  });

  test('Desktop viewport: Cab service page highlights Cabs & Rentals dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/services/outstation-cabs/');

    const nav = page.locator('nav[aria-label="Main Navigation"]');
    const cabsBtn = nav.locator('button:has-text("Cabs & Rentals")');
    await expect(cabsBtn).toBeVisible();
    await expect(cabsBtn).toHaveClass(/bg-m3-primary/);
  });
});
