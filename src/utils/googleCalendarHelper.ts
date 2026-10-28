/**
 * Google Calendar & Operations Manifest Utilities — Kalidass Travels
 * Handles date normalization, Google Calendar URL generation, and CSV manifest export.
 */

export interface CalendarTripItem {
  bookingId?: string;
  quoteId?: string;
  travelDateTime?: string;
  travelDate?: string;
  followUpDate?: string;
  followUpTime?: string;
  isFollowUp?: boolean;
  tripType?: string;
  guestNamePhone?: string;
  name?: string;
  phone?: string;
  pickupAddress?: string;
  pickup?: string;
  drop?: string;
  vehicleCategory?: string;
  vehicle?: string;
  terminalFare?: number | string;
  estimatedFare?: number | string;
  fare?: number | string;
  advancePaid?: number | string;
  advance?: number | string;
  assignedChauffeur?: string;
  manifestStatus?: string;
  partySize?: string;
  notes?: string;
  metadata?: string;
}

/**
 * Normalizes travel schedule strings into standard Date objects.
 * Handles:
 * - "Tomorrow @ 05:00 AM", "Today @ 06:30 PM", "Today Evening @ 05:00 PM"
 * - "2026-10-25T06:00", "2026-10-25"
 * - "25 Oct 2026 @ 07:00 AM", "25-Oct-2026"
 * - "25/10/2026, 06:00:00 AM"
 */
export function parseTravelDateToDate(dateStr?: string, refDate: Date = new Date()): Date {
  const target = new Date(refDate.getTime());

  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) {
    // Default to tomorrow 06:00 AM
    target.setDate(target.getDate() + 1);
    target.setHours(6, 0, 0, 0);
    return target;
  }

  const raw = dateStr.trim();
  const lower = raw.toLowerCase();

  // 1. Check relative keywords: "today", "tomorrow"
  let dateBase: Date | null = null;
  if (lower.includes('today')) {
    dateBase = new Date(refDate.getTime());
  } else if (lower.includes('tomorrow')) {
    dateBase = new Date(refDate.getTime());
    dateBase.setDate(dateBase.getDate() + 1);
  } else if (lower.includes('yesterday')) {
    dateBase = new Date(refDate.getTime());
    dateBase.setDate(dateBase.getDate() - 1);
  }

  // 3. Extract time portion properly (only match HH:MM or H AM/PM, not bare date numbers like "24")
  let hours = 6;
  let minutes = 0;
  const timeMatch = raw.match(/(?:@\s*)?(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?/i) ||
                    raw.match(/(\d{1,2})\s*(am|pm)\b/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const isShortMeridianOnly = timeMatch[2] && /^(am|pm)$/i.test(timeMatch[2]);
    const m = (!isShortMeridianOnly && timeMatch[2]) ? parseInt(timeMatch[2], 10) : 0;
    const meridian = (isShortMeridianOnly ? timeMatch[2] : (timeMatch[3] || '')).toLowerCase();
    if (meridian === 'pm' && h < 12) h += 12;
    if (meridian === 'am' && h === 12) h = 0;
    hours = h;
    minutes = m;
  }

  if (dateBase) {
    dateBase.setHours(hours, minutes, 0, 0);
    return dateBase;
  }

  // Strip range suffixes like "to 30" or "to Dec 30" or "- 30 Dec" so we parse the departure date cleanly
  const primaryPart = raw
    .split(/\s+(?:to|till|until|-)\s+/i)[0]
    .replace(/\([^)]*\)/g, ' ')
    .replace('@', ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 4. Try Month-Day or Day-Month formats (e.g. "Dec 24", "Dec 24 2026", "24 Dec", "24 Dec 2026")
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const mmmDayMatch = primaryPart.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?(?:[\s,]+(\d{4}))?/i);
  if (mmmDayMatch) {
    const mIdx = monthNames.findIndex(m => mmmDayMatch[1].toLowerCase().startsWith(m));
    if (mIdx !== -1) {
      const day = parseInt(mmmDayMatch[2], 10);
      const year = mmmDayMatch[3] ? parseInt(mmmDayMatch[3], 10) : refDate.getFullYear();
      const customDate = new Date(year, mIdx, day, hours, minutes, 0, 0);
      if (!isNaN(customDate.getTime())) return customDate;
    }
  }

  const dayMmmMatch = primaryPart.match(/\b(\d{1,2})(?:st|nd|rd|th)?[\s-]+([A-Za-z]{3,9})(?:[\s,-]+(\d{4}))?/i);
  if (dayMmmMatch) {
    const mIdx = monthNames.findIndex(m => dayMmmMatch[2].toLowerCase().startsWith(m));
    if (mIdx !== -1) {
      const day = parseInt(dayMmmMatch[1], 10);
      const year = dayMmmMatch[3] ? parseInt(dayMmmMatch[3], 10) : refDate.getFullYear();
      const customDate = new Date(year, mIdx, day, hours, minutes, 0, 0);
      if (!isNaN(customDate.getTime())) return customDate;
    }
  }

  // 5. Try YYYY-MM-DD ISO date prefix
  const isoMatch = primaryPart.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const customDate = new Date(year, month, day, hours, minutes, 0, 0);
    if (!isNaN(customDate.getTime())) return customDate;
  }

  // 6. Try DD/MM/YYYY or DD-MM-YYYY format
  const dmyMatch = primaryPart.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const customDate = new Date(year, month, day, hours, minutes, 0, 0);
    if (!isNaN(customDate.getTime())) return customDate;
  }

  // 7. Try standard Date.parse
  const parsedTimestamp = Date.parse(primaryPart);
  if (!isNaN(parsedTimestamp)) {
    const d = new Date(parsedTimestamp);
    if (timeMatch && d.getHours() === 0 && d.getMinutes() === 0 && hours !== 0) {
      d.setHours(hours, minutes, 0, 0);
    }
    return d;
  }

  // Fallback: Return tomorrow 06:00 AM
  target.setDate(target.getDate() + 1);
  target.setHours(hours, minutes, 0, 0);
  return target;
}

/**
 * Returns YYYY-MM-DD key for grouping items by calendar date.
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats a Date object to Google Calendar ISO UTC string: YYYYMMDDTHHmmSSZ
 */
function toGCalDateTimeString(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generates a direct "Add to Google Calendar" URL with prefilled parameters.
 * Automatically recognizes enquiry follow-up reminders vs confirmed trip duties.
 */
export function buildGoogleCalendarUrl(item: CalendarTripItem): string {
  const isBooking = Boolean(item.bookingId || (item.manifestStatus && item.manifestStatus !== 'Enquiry'));
  const isFollowUpReminder = Boolean(item.isFollowUp || item.followUpTime || item.followUpDate || (!isBooking && item.notes?.toLowerCase().includes('follow-up')));
  const id = item.bookingId || item.quoteId || 'Duty';
  
  // Passenger Info
  const guestRaw = item.guestNamePhone || item.name || 'Customer';
  const phoneMatch = `${guestRaw} ${item.phone || ''}`.match(/[6-9]\d{9}/);
  const guestPhone = phoneMatch ? phoneMatch[0] : (item.phone || '');
  const guestName = guestRaw.replace(/\(?\+?91?[6-9]\d{9}\)?/g, '').replace(/[()]/g, '').trim() || 'Guest';

  // Route & Vehicle
  const route = item.pickupAddress || `${item.pickup || 'Chennai'} ➔ ${item.drop || 'Outstation'}`;
  const vehicle = item.vehicleCategory || item.vehicle || 'Sedan';
  const fare = Number(item.terminalFare || item.estimatedFare || item.fare || 0);
  const advance = Number(item.advancePaid || item.advance || 0);
  const balance = Math.max(0, fare - advance);
  const driver = item.assignedChauffeur || 'Unassigned';

  // If this is an enquiry follow-up reminder, set the event at follow-up time for 30 minutes
  if (isFollowUpReminder) {
    const followUpTarget = item.followUpTime || item.followUpDate || 'Today @ 05:00 PM';
    const startDate = parseTravelDateToDate(followUpTarget);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes reminder

    const title = `[Follow-Up] ${guestName} - ${route} (Quoted ₹${fare.toLocaleString('en-IN')})`;
    const descriptionLines = [
      `📞 KALIDASS TRAVELS — CUSTOMER ENQUIRY FOLLOW-UP`,
      `--------------------------------------`,
      `Enquiry ID: ${id}`,
      `Passenger: ${guestName} (+91 ${guestPhone})`,
      `Route: ${route}`,
      `Vehicle: ${vehicle}`,
      `Package / Trip Type: ${item.tripType || 'Outstation Package'}`,
      `Quoted Fare: ₹${fare.toLocaleString('en-IN')}`,
      `Expected Travel Date: ${item.travelDateTime || item.travelDate || 'Pending confirmation'}`,
      `Follow-up Schedule: ${followUpTarget}`,
      `--------------------------------------`,
      `Action: Call customer to confirm booking and collect ₹500 advance`,
      `UPI ID for Advance: 8939539211@okbizaxis (Kalidass Travels)`,
      `Notes: ${item.notes || 'Customer to confirm today evening'}`,
      `24/7 Desk: +91 89395 39211`
    ];

    const location = item.pickupAddress || item.pickup || 'Medavakkam, Chennai';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${toGCalDateTimeString(startDate)}/${toGCalDateTimeString(endDate)}`,
      details: descriptionLines.join('\n'),
      location: location
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // Otherwise, it's a confirmed travel duty (6 hours default)
  const startDate = parseTravelDateToDate(item.travelDateTime || item.travelDate);
  const endDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000);

  // Title
  const title = `[${id}] ${guestName} - ${vehicle} (${route})`;

  // Trip sheet link
  const cleanRef = id.replace(/[^A-Za-z0-9]/g, '');
  const tripSheetUrl = `https://kalidasstravels.in/trip/?ref=${cleanRef}`;

  // Description body
  const descriptionLines = [
    `🚕 KALIDASS TRAVELS — TRIP DUTY SLIP`,
    `--------------------------------------`,
    `Trip ID: ${id}`,
    `Passenger: ${guestName} (+91 ${guestPhone})`,
    `Route: ${route}`,
    `Vehicle: ${vehicle}`,
    `Chauffeur: ${driver}`,
    `Fare: ₹${fare.toLocaleString('en-IN')}`,
    `Advance Received: ₹${advance.toLocaleString('en-IN')}`,
    `Balance Due at Drop: ₹${balance.toLocaleString('en-IN')}`,
    `--------------------------------------`,
    `Live Trip Sheet: ${tripSheetUrl}`,
    `Helpline: +91 89395 39211`,
    `Headquarters: Medavakkam, Chennai`
  ];

  if (item.notes || item.metadata) {
    descriptionLines.push(`Notes: ${item.notes || item.metadata}`);
  }

  const location = item.pickupAddress || item.pickup || 'Medavakkam, Chennai';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toGCalDateTimeString(startDate)}/${toGCalDateTimeString(endDate)}`,
    details: descriptionLines.join('\n'),
    location: location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Exports current monthly manifest to a downloadable CSV spreadsheet.
 */
export function exportMonthlyManifestToCsv(
  bookings: CalendarTripItem[],
  year: number,
  monthIndex: number // 0-based: 0 = Jan, 9 = Oct
): boolean {
  if (typeof window === 'undefined') return false;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[monthIndex] || 'Month';

  // Filter bookings for this month
  const monthlyItems = bookings.filter(b => {
    const d = parseTravelDateToDate(b.travelDateTime || b.travelDate);
    return d.getFullYear() === year && d.getMonth() === monthIndex;
  });

  const headers = [
    'Booking ID',
    'Travel Date & Time',
    'Customer Name & Phone',
    'Route (Pickup ➔ Drop)',
    'Vehicle',
    'Party Size',
    'Total Fare (INR)',
    'Advance Paid (INR)',
    'Balance Due (INR)',
    'Chauffeur Assigned',
    'Duty Status',
    'Notes'
  ];

  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows: string[] = [headers.map(escapeCell).join(',')];

  monthlyItems.forEach(b => {
    const fare = Number(b.terminalFare || b.estimatedFare || b.fare || 0);
    const advance = Number(b.advancePaid || b.advance || 0);
    const balance = Math.max(0, fare - advance);

    rows.push([
      escapeCell(b.bookingId || ''),
      escapeCell(b.travelDateTime || b.travelDate || ''),
      escapeCell(b.guestNamePhone || b.name || ''),
      escapeCell(b.pickupAddress || `${b.pickup || ''} ➔ ${b.drop || ''}`),
      escapeCell(b.vehicleCategory || b.vehicle || ''),
      escapeCell(b.partySize || '4 Seats'),
      escapeCell(fare),
      escapeCell(advance),
      escapeCell(balance),
      escapeCell(b.assignedChauffeur || 'Unassigned'),
      escapeCell(b.manifestStatus || 'Need Driver'),
      escapeCell(b.notes || b.metadata || '')
    ].join(','));
  });

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Kalidass_Manifest_${year}_${String(monthIndex + 1).padStart(2, '0')}_${monthName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
