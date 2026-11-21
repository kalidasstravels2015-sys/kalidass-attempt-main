/**
 * whatsappTemplates.ts
 * Clean, battle-tested WhatsApp messaging templates for Kalidass Travels dispatch.
 * 100% mirrors the exact real-world operations workflow.
 */

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Replaces numeric DD-MM-YYYY or DD/MM/YYYY dates with written month names (e.g. "01 Nov 2026")
 * so WhatsApp never underlines dates as clickable phone numbers.
 */
export function sanitizeWhatsAppDate(str: string): string {
  if (!str) return '';
  return String(str).replace(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](20\d{2})\b/g, (_, d, m, y) => {
    const mIdx = parseInt(m, 10) - 1;
    return `${String(d).padStart(2, '0')} ${SHORT_MONTHS[mIdx] || m} ${y}`;
  });
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text.trim());
  if (cleanPhone.length >= 10) {
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

export function buildDriverDutySlipMessage(params: {
  bookingId?: string;
  travelDateTime: string;
  pickupAddress: string;
  dropAddress?: string;
  guestName: string;
  guestPhone: string;
  driverName: string;
  vehicleName: string;
  vehiclePlate: string;
  collectionAmount: number;
}): string {
  const pickup = params.pickupAddress || 'Chennai';
  const drop = params.dropAddress ? `\n• Drop: ${params.dropAddress}` : '';
  const safePickupTime = sanitizeWhatsAppDate(params.travelDateTime);
  const collectionStr = params.collectionAmount > 0
    ? `Collect ₹${params.collectionAmount.toLocaleString('en-IN')} + Tolls + Parking at the end of the trip.`
    : 'All Paid Online / ₹0 to collect (+ Tolls/Parking as per slip).';

  return `*NEW DUTY - KALIDASS TRAVELS*

- Pickup Time: ${safePickupTime}
- Pickup: ${pickup}${drop}

- Guest: ${params.guestName}
- Phone: ${params.guestPhone.startsWith('+') ? params.guestPhone : `+91 ${params.guestPhone}`}

- Vehicle: ${params.vehicleName}${params.vehiclePlate ? ` (${params.vehiclePlate})` : ''}
- Driver: Mr. ${params.driverName}

*Amount to Collect:*
${collectionStr}`;
}

export function buildCustomerCabDetailsMessage(params: {
  bookingId?: string;
  driverName: string;
  driverPhone: string;
  vehicleName: string;
  vehiclePlate: string;
  collectionAmount: number;
}): string {
  const balLine = params.collectionAmount > 0
    ? `\nBalance to driver: ₹${params.collectionAmount.toLocaleString('en-IN')} + Toll & Parking\n`
    : '\nFare is pre-paid. Toll & Parking as per slip to driver.\n';

  return `*KALIDASS TRAVELS — CAB DETAILS*

Driver: ${params.driverName}
Phone: +91 ${String(params.driverPhone || '').replace(/^\+?91\s*/, '')}
Vehicle: ${params.vehicleName}
Vehicle No: ${params.vehiclePlate}
${balLine}
Safe & happy journey!
Helpline: +91 89395 39211`;
}

export function buildAdvancePaymentRequestMessage(params: {
  bookingId?: string;
  guestName?: string;
  vehicleCategory?: string;
  advanceAmount?: number;
  balanceAmount?: number;
  upiId?: string;
} = {}): string {
  const adv = params.advanceAmount || 500;
  return `Yes Sir/Mam, vehicle is available.

To confirm booking:
1. Share *Pickup Address*
2. Pay *₹${adv} advance* via attached QR
   UPI: ${params.upiId || 'saravn.appu@okhdfcbank'} (Saravanan K)`;
}

export function buildGoogleReviewMessage(guestName: string = 'Sir/Madam'): string {
  return `Dear ${guestName},
Thank you for traveling with Kalidass Travels!
We hope you had a pleasant and comfortable journey.

Please take 10 seconds to share your 5★ feedback on Google:
https://share.google/1IOq41QwMkhDJvrLY

Thank you,
Kalidass Travels (+91 89395 39211)`;
}
