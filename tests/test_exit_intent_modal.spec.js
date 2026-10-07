import { test, expect } from '@playwright/test';

test.describe('ExitIntentModal - Comprehensive Passenger Intake Flow', () => {

  test('Should open modal via ?fleet_modal=true, populate trip details and produce structured WhatsApp dossier', async ({ page }) => {
    // 1. Visit homepage with direct fleet modal trigger
    await page.goto('/?fleet_modal=true', { waitUntil: 'networkidle' });

    // 2. Verify modal is visible
    const modal = page.locator('[role="dialog"][aria-labelledby="exit-modal-title"]');
    await expect(modal).toBeVisible();

    // 3. Verify step 1: Select "1 - 4" Sedan (default or tap)
    const sedanBtn = page.getByRole('button', { name: '1 - 4 Sedan' });
    await expect(sedanBtn).toBeVisible();
    await sedanBtn.click();

    // 4. Verify step 2: Select "Outstation"
    const outstationBtn = page.getByRole('button', { name: 'Outstation', exact: false });
    await outstationBtn.click();

    // 5. Fill Pickup Location in Chennai using quick chip
    const velacheryChip = page.getByRole('button', { name: 'Velachery' });
    await velacheryChip.click();
    const pickupInput = page.locator('#modal-pickup-location');
    await expect(pickupInput).toHaveValue('Velachery');

    // 6. Fill Destination using quick chip
    const pondyChip = page.getByRole('button', { name: 'Pondicherry' });
    await pondyChip.click();
    const dropInput = page.locator('#modal-drop-location');
    await expect(dropInput).toHaveValue('Pondicherry');

    // 7. Select Pickup Time using quick chip
    const time06Chip = page.getByRole('button', { name: '06:00 AM' });
    await time06Chip.click();

    // 8. Verify the WhatsApp Submit CTA contains full structured details
    const submitBtn = modal.locator('a:has-text("Confirm & Send to WhatsApp Desk")');
    const href = await submitBtn.getAttribute('href');
    expect(href).not.toBeNull();

    const decodedHref = decodeURIComponent(href || '');
    console.log('Decoded WhatsApp URL:', decodedHref);

    // Verify key fields are in the URL
    expect(decodedHref).toContain('Kalidass Travels - Cab Booking / Fare Quote');
    expect(decodedHref).toContain('Outstation Highway Trip');
    expect(decodedHref).toContain('Swift Dzire / Toyota Etios');
    expect(decodedHref).toContain('Velachery');
    expect(decodedHref).toContain('Pondicherry');
    expect(decodedHref).toContain('06:00 AM');
    expect(decodedHref).toContain('Website Quick Fleet Match');

    // 9. Verify skip direct enquiry link exists
    const skipLink = modal.locator('a:has-text("Skip details & chat directly")');
    await expect(skipLink).toBeVisible();
    const skipHref = decodeURIComponent(await skipLink.getAttribute('href') || '');
    expect(skipHref).toContain('Hi Kalidass Travels');

    console.log('✔ ExitIntentModal successfully validated end-to-end with full booking dossier!');
  });
});
