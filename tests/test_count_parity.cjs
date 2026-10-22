const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.addInitScript(() => sessionStorage.setItem('kt_admin_pin_verified', 'true'));
  await page.goto('http://localhost:4321/admin/');
  await page.waitForTimeout(3000);

  console.log('--- Initial State ---');
  let enquiriesNav = await page.locator('aside nav button:has-text("1. New Enquiries")').innerText();
  let enquiriesHeader = await page.locator('h2:has-text("1. Customer Enquiries")').locator('..').innerText();
  let allTab = await page.locator('button:has-text("All Calls & Enquiries")').innerText();
  let radarNav = await page.locator('aside nav button:has-text("6. Website Calc Radar")').innerText();

  console.log('Sidebar Enquiries:', enquiriesNav.replace(/\n+/g, ' | '));
  console.log('Enquiries Header:', enquiriesHeader.replace(/\n+/g, ' | '));
  console.log('Enquiries Tab:', allTab.replace(/\n+/g, ' | '));
  console.log('Sidebar Radar:', radarNav.replace(/\n+/g, ' | '));

  console.log('\n--- Adding New Customer Call ---');
  await page.evaluate(() => { window.open = () => null; });
  await page.click('button:has-text("+ New Customer Call")');
  await page.waitForTimeout(400);

  await page.fill('input[placeholder*="Ramesh"]', 'Suresh G');
  await page.fill('input[placeholder*="9840123456"]', '9840123456');
  await page.fill('input[placeholder*="Tirupati"]', 'Tirupati');
  await page.fill('input[placeholder*="4500"]', '4500');

  await page.click('button:has-text("Save & Send WhatsApp Quote")');
  await page.waitForTimeout(1000);

  enquiriesNav = await page.locator('aside nav button:has-text("1. New Enquiries")').innerText();
  enquiriesHeader = await page.locator('h2:has-text("1. Customer Enquiries")').locator('..').innerText();
  allTab = await page.locator('button:has-text("All Calls & Enquiries")').innerText();

  console.log('Sidebar Enquiries (After Call Added):', enquiriesNav.replace(/\n+/g, ' | '));
  console.log('Enquiries Header (After Call Added):', enquiriesHeader.replace(/\n+/g, ' | '));
  console.log('Enquiries Tab (After Call Added):', allTab.replace(/\n+/g, ' | '));

  console.log('\n--- Switching to Radar Tab ---');
  await page.click('aside nav button:has-text("6. Website Calc Radar")');
  await page.waitForTimeout(1000);
  const radarHeader = await page.locator('h2:has-text("Website Fare Calculator Radar")').locator('..').innerText();
  console.log('Radar Header:', radarHeader.replace(/\n+/g, ' | '));

  await browser.close();
  console.log('\nAudit test completed successfully!');
})();
