/**
 * whatsappTemplates.ts
 * Clean, battle-tested WhatsApp messaging templates for Kalidass Travels dispatch.
 * 100% mirrors the exact real-world operations workflow.
 */

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
  const collectionStr = params.collectionAmount > 0
    ? `Collect ₹${params.collectionAmount.toLocaleString('en-IN')} + Tolls + Parking at the end of the trip.`
    : 'All Paid Online / ₹0 to collect (+ Tolls/Parking as per slip).';

  return `🚖 NEW DUTY - KALIDASS TRAVELS
${params.bookingId ? `Ref: ${params.bookingId}\n` : ''}
• Pickup Time: ${params.travelDateTime}
• Pickup: ${pickup}${drop}

• Guest: ${params.guestName}
• Phone: ${params.guestPhone.startsWith('+') ? params.guestPhone : `+91 ${params.guestPhone}`}

• Vehicle: ${params.vehicleName}${params.vehiclePlate ? ` (${params.vehiclePlate})` : ''}
• Driver: Mr. ${params.driverName}

💵 Collection Amount:
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
  const refLine = params.bookingId ? `Ref: ${params.bookingId}\n\n` : '\n';
  const balLine = params.collectionAmount > 0
    ? `\n💵 Balance amount ₹${params.collectionAmount.toLocaleString('en-IN')} + actual tolls & parking can be paid directly to the driver at the end of the trip.\n`
    : '\n💵 Total fare is pre-paid. Tolls & parking as per slip to driver at trip end.\n';

  return `🚖 KALIDASS TRAVELS — CAB & DRIVER DETAILS
${refLine}Driver Name: ${params.driverName}
Phone No: ${params.driverPhone}
Vehicle name: ${params.vehicleName}
Vehicle No: ${params.vehiclePlate}
${balLine}
Have a safe and pleasant journey!
24/7 Helpline: +91 89395 39211`;
}

export function buildAdvancePaymentRequestMessage(params: {
  bookingId?: string;
  guestName?: string;
  vehicleCategory?: string;
  advanceAmount?: number;
  balanceAmount?: number;
  upiId?: string;
}): string {
  const adv = params.advanceAmount || 500;
  const bal = params.balanceAmount ? `\n(Balance amount ₹${params.balanceAmount.toLocaleString('en-IN')} + actual tolls & parking can be paid directly to the driver at the end of the trip).\n` : '';
  const vehicle = params.vehicleCategory ? `the ${params.vehicleCategory}` : 'the cab';
  const nameGreeting = params.guestName ? ` ${params.guestName}` : ' Sir';
  const refLine = params.bookingId ? ` (Ref: ${params.bookingId})` : '';

  return `Great, thank you${nameGreeting}!

Please transfer the ₹${adv} advance to reserve ${vehicle}${refLine}:
UPI ID: ${params.upiId || 'saravn.appu@okhdfcbank'}
Name: Saravanan K
${bal}
Please share the payment screenshot once transferred.`;
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
