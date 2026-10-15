export interface BookingItem {
  bookingId: string;
  guestNamePhone: string;
  travelDateTime: string;
  pickupAddress: string;
  vehicleCategory: string;
  partySize: string;
  kycStatus: string;
  darshanStatus: string;
  assignedChauffeur: string;
  manifestStatus: string;
  terminalFare: number;
  chauffeurPayout: number;
  companyMargin: number;
  financialClosure: string;
}

export interface ChauffeurItem {
  name: string;
  phone: string;
  plate: string;
  category: string;
  status: string;
  fcExpiry: string;
  permitExpiry: string;
  rating: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflictType?: 'double_booking' | 'fc_expired' | 'permit_expired';
  conflictBookingId?: string;
  message?: string;
}

/**
 * Normalizes travel date strings (e.g. "Tomorrow @ 04:30 AM", "12-Oct-2026 @ 05:00 AM", "Today @ 06:00 AM")
 * to compare potential conflicts.
 */
function extractDateKey(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  const lower = dateTimeStr.toLowerCase();
  if (lower.includes('today')) return 'today';
  if (lower.includes('tomorrow')) return 'tomorrow';
  const parts = dateTimeStr.split('@');
  return parts[0].trim().toLowerCase();
}

/**
 * Checks if assigning a chauffeur to `currentBooking` causes a collision with existing bookings.
 */
export function checkChauffeurConflict(
  currentBooking: BookingItem,
  allBookings: BookingItem[],
  chauffeursMaster?: ChauffeurItem[]
): ConflictResult {
  const chauffeur = currentBooking.assignedChauffeur;
  if (!chauffeur || chauffeur === 'Unassigned' || currentBooking.manifestStatus === 'Completed' || currentBooking.manifestStatus === 'Cancelled') {
    return { hasConflict: false };
  }

  const currentDateKey = extractDateKey(currentBooking.travelDateTime);

  // 1. Double-booking check
  for (const b of allBookings) {
    if (b.bookingId === currentBooking.bookingId) continue;
    if (b.manifestStatus === 'Completed' || b.manifestStatus === 'Cancelled') continue;

    if (b.assignedChauffeur && b.assignedChauffeur.toLowerCase().includes(chauffeur.split('-')[0].trim().toLowerCase())) {
      const bDateKey = extractDateKey(b.travelDateTime);
      if (bDateKey && currentDateKey && bDateKey === currentDateKey) {
        return {
          hasConflict: true,
          conflictType: 'double_booking',
          conflictBookingId: b.bookingId,
          message: `Double-Booking Alert: ${chauffeur.split('-')[0].trim()} is already assigned to ${b.bookingId} (${b.travelDateTime})!`
        };
      }
    }
  }

  // 2. Chauffeur FC / Permit Expiry Check (if chauffeurs list provided)
  if (chauffeursMaster && chauffeursMaster.length > 0) {
    const matched = chauffeursMaster.find(c => chauffeur.toLowerCase().includes(c.name.toLowerCase()));
    if (matched) {
      const now = new Date();
      if (matched.fcExpiry) {
        const fcDate = new Date(matched.fcExpiry);
        if (fcDate < now) {
          return {
            hasConflict: true,
            conflictType: 'fc_expired',
            message: `FC Expired Alert: Vehicle ${matched.plate} FC expired on ${matched.fcExpiry}!`
          };
        }
      }
      if (matched.permitExpiry) {
        const permitDate = new Date(matched.permitExpiry);
        if (permitDate < now) {
          return {
            hasConflict: true,
            conflictType: 'permit_expired',
            message: `Permit Expired Alert: Chauffeur ${matched.name} permit expired on ${matched.permitExpiry}!`
          };
        }
      }
    }
  }

  return { hasConflict: false };
}
