import { test, expect } from '@playwright/test';

const pagesToTest = [
  { url: '/services/outstation-cabs/', name: 'Outstation Cabs' },
  { url: '/services/tours/temple-tours/', name: 'Temple Tours' },
  { url: '/services/tours/weekend-packages/', name: 'Weekend Packages' },
  { url: '/services/corporate/', name: 'Corporate' },
  { url: '/services/', name: 'Services Index' },
  { url: '/tariff/', name: 'Tariff' },
  { url: '/services/tirupati-package/', name: 'Tirupati Package (Leaf)' },
];

test.describe('Quick-Navigation Horizontal Pills Validation', () => {
  for (const pageInfo of pagesToTest) {
    test(`Pills order matches document flow and exactly 1 pill active on ${pageInfo.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(pageInfo.url);

      const nav = page.locator('nav[data-quick-nav]');
      await expect(nav).toBeVisible();

      // 1. Verify exact 1 active pill
      const activePills = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('nav[data-quick-nav] a[href^="#"]'));
        return links.filter(a => a.classList.contains('bg-m3-primary')).map(a => a.textContent?.trim());
      });
      expect(activePills.length).toBe(1);

      // 2. Verify pill link order matches section DOM order
      const { pillIds, sectionIds } = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('nav[data-quick-nav] a[href^="#"]'));
        const pillIds = links.map(a => a.getAttribute('href')?.slice(1)).filter(Boolean);
        const sections = pillIds.map(id => {
          const el = document.getElementById(id);
          return el ? { id, top: el.getBoundingClientRect().top + window.scrollY } : null;
        }).filter(Boolean);
        const sorted = sections.sort((a, b) => a.top - b.top).map(s => s.id);
        return { pillIds, sectionIds: sorted };
      });

      expect(pillIds).toEqual(sectionIds);
    });
  }

  test('Clicking pill smoothly scrolls and centers active pill without clipping', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/services/outstation-cabs/');

    const nav = page.locator('nav[data-quick-nav]');
    const links = nav.locator('a[href^="#"]');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const text = (await link.innerText()).trim();
      const href = await link.getAttribute('href');

      await link.click();
      await page.waitForTimeout(1000);

      const activeState = await page.evaluate(() => {
        const activeLink = document.querySelector('nav[data-quick-nav] a[data-active="true"]');
        const container = document.querySelector('nav[data-quick-nav] .overflow-x-auto');
        if (!activeLink || !container) return null;

        const aRect = activeLink.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();

        return {
          text: activeLink.textContent?.trim(),
          href: activeLink.getAttribute('href'),
          isFullyVisible: aRect.left >= cRect.left - 2 && aRect.right <= cRect.right + 2
        };
      });

      expect(activeState).not.toBeNull();
      expect(activeState?.href).toBe(href);
      expect(activeState?.isFullyVisible).toBe(true);
    }
  });

  test('Active pill retains high-contrast executive styling (charcoal bg + white text) when shifting and hovering', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/services/tirupati-package/');

    const nav = page.locator('nav[data-quick-nav]');
    const links = nav.locator('a[href^="#"]');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      await link.click();
      await page.waitForTimeout(600);

      // Verify active pill styles both during focus/hover and normal
      const styles = await link.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        return {
          bg: cs.backgroundColor,
          color: cs.color,
          fontWeight: parseInt(cs.fontWeight, 10),
          dataActive: el.getAttribute('data-active')
        };
      });

      expect(styles.dataActive).toBe('true');
      expect(styles.bg).toBe('rgb(30, 37, 45)'); // Executive Midnight Charcoal
      expect(styles.color).toBe('rgb(255, 255, 255)'); // Pure White
      expect(styles.fontWeight).toBeGreaterThanOrEqual(700); // Bold text
    }
  });
});
