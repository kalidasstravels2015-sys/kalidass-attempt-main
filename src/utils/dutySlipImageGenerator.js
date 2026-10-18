/**
 * Generates a high-resolution, branded Digital Duty Slip Voucher Card (PNG)
 * ready to be shared directly on WhatsApp or downloaded.
 */
export function generateDutySlipCanvas(data) {
  const width = 800;
  const height = 980;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#0F172A'; // Deep Slate Navy
  ctx.fillRect(0, 0, width, height);

  // Top Gold Accent Bar
  ctx.fillStyle = '#F59E0B'; // Amber Gold
  ctx.fillRect(0, 0, width, 8);

  // 1. Header Section
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('KALIDASS TRAVELS', 40, 52);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Executive Chauffeur & Outstation Mobility • Medavakkam, Chennai', 40, 76);

  // Booking Ref Badge
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.roundRect(width - 200, 32, 160, 38, 8);
  ctx.fill();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(data.bookingId || '#KT-DUTY', width - 120, 56);
  ctx.textAlign = 'left';

  // 2. White Ticket Body Card
  const cardX = 30;
  const cardY = 100;
  const cardW = width - 60;
  const cardH = 750;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 16);
  ctx.fill();

  // Ticket Header Strip
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, 55, [16, 16, 0, 0]);
  ctx.fill();

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX, cardY + 55);
  ctx.lineTo(cardX + cardW, cardY + 55);
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('OFFICIAL TRIP DUTY SLIP & BILL', cardX + 24, cardY + 34);

  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('CONFIRMED BOOKING', cardX + cardW - 24, cardY + 34);
  ctx.textAlign = 'left';

  let y = cardY + 85;

  // Row 1: Passenger & Schedule
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PASSENGER NAME & MOBILE', cardX + 24, y);
  ctx.fillText('SCHEDULED DATE & TIME', cardX + 380, y);

  y += 22;
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 17px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(data.guestName || 'Guest', cardX + 24, y);
  ctx.fillStyle = '#D97706';
  ctx.fillText(`${data.startDate || 'Today'} @ ${data.startTime || '05:00 AM'}`, cardX + 380, y);

  y += 18;
  ctx.fillStyle = '#64748B';
  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillText(`+91 ${String(data.guestPhone || '').replace(/[^0-9]/g, '').slice(-10)}`, cardX + 24, y);

  y += 28;
  // Route Box
  ctx.fillStyle = '#F1F5F9';
  ctx.beginPath();
  ctx.roundRect(cardX + 20, y, cardW - 40, 52, 10);
  ctx.fill();

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PICKUP LOCATION & ROUTE', cardX + 34, y + 20);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(data.pickupAddress || 'Chennai ➔ Outstation', cardX + 34, y + 40);

  y += 72;

  // Row 2: Chauffeur & Vehicle Box
  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.roundRect(cardX + 20, y, cardW - 40, 75, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ASSIGNED CHAUFFEUR', cardX + 34, y + 22);
  ctx.fillText('VEHICLE & PLATE NUMBER', cardX + 380, y + 22);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(data.chauffeurName || 'Assigned Driver', cardX + 34, y + 45);
  ctx.fillText(`${data.vehicleCategory || 'Commercial Vehicle'} (${data.vehiclePlate || 'Assigned Plate'})`, cardX + 380, y + 45);

  ctx.fillStyle = '#64748B';
  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.fillText(`Contact: +91 ${String(data.chauffeurPhone || '').replace(/[^0-9]/g, '').slice(-10)}`, cardX + 34, y + 63);

  y += 95;

  // Row 3: Odometer & Readings
  ctx.fillStyle = '#FEF3C7'; // Light Amber
  ctx.beginPath();
  ctx.roundRect(cardX + 20, y, cardW - 40, 68, 10);
  ctx.fill();

  ctx.fillStyle = '#92400E';
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ODOMETER READINGS', cardX + 34, y + 22);

  ctx.fillStyle = '#78350F';
  ctx.font = 'bold 14px "JetBrains Mono", monospace';
  const startKmText = data.startKm ? `${data.startKm} KM` : 'At Pickup';
  const endKmText = data.endKm ? `${data.endKm} KM` : 'At Drop';
  const totalKmText = data.totalKm ? `${data.totalKm} KM` : `Package: ${data.packageAllowedKm} KM`;
  ctx.fillText(`Start: ${startKmText}   |   End: ${endKmText}   |   Total Run: ${totalKmText}`, cardX + 34, y + 48);

  y += 88;

  // Row 4: Billing Breakdown
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ITEMIZED TARIFF BREAKDOWN', cardX + 24, y);

  y += 18;
  const drawLineItem = (label, val, isSub = false) => {
    ctx.fillStyle = isSub ? '#64748B' : '#334155';
    ctx.font = isSub ? '12px "Plus Jakarta Sans", sans-serif' : '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label, cardX + 24, y);
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(val, cardX + cardW - 24, y);
    ctx.textAlign = 'left';
    y += 22;
  };

  drawLineItem('Base Package Fare', `Rs. ${Number(data.basePackageFare || 0).toLocaleString('en-IN')}`);
  if (data.extraKm > 0) {
    drawLineItem(`Extra Kilometers (${data.extraKm} KM @ Rs.${data.extraKmRate}/KM)`, `+ Rs. ${data.extraKmCharge}`);
  }
  if (data.tolls > 0) {
    drawLineItem('FASTag Toll Taxes (Actuals)', `+ Rs. ${data.tolls}`);
  }
  if (data.parking > 0) {
    drawLineItem('Parking / State Border Permit', `+ Rs. ${data.parking}`);
  }
  if (data.nightAllowance > 0) {
    drawLineItem('Night Driving Allowance', `+ Rs. ${data.nightAllowance}`);
  }

  y += 8;

  // Total & Net Payable Dark Box
  const totalBoxH = 110;
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.roundRect(cardX + 16, y, cardW - 32, totalBoxH, 12);
  ctx.fill();

  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Total Trip Gross: Rs. ${Number(data.grossFare || 0).toLocaleString('en-IN')}`, cardX + 36, y + 32);

  ctx.fillStyle = '#F59E0B';
  ctx.fillText(`Token Advance Received: -Rs. ${Number(data.advance || 0).toLocaleString('en-IN')}`, cardX + 36, y + 54);

  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('NET BALANCE DUE AT DROP:', cardX + 36, y + 88);

  ctx.textAlign = 'right';
  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.fillText(`Rs. ${Number(data.balanceToCollect || 0).toLocaleString('en-IN')}`, cardX + cardW - 36, y + 88);
  ctx.textAlign = 'left';

  // 3. Footer Bar
  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Kalidass Travels Chennai • 24/7 Helpline: +91 89395 39211 • Thank you for your patronage! 🙏', width / 2, height - 40);

  return canvas;
}
