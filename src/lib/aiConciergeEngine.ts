// src/lib/aiConciergeEngine.ts
// 100% Grounded, Autonomous AI Concierge Engine for Kalidass Travels
// Works completely standalone without external API keys using verified website rate cards.

import { TOUR_CONFIGS } from '../data/tourBookingConfigs.js';
import tariffConfig from '../data/tariff_config.json' with { type: 'json' };
import siteContent from '../data/siteContent.json' with { type: 'json' };
import tnBusFares from '../data/tnBusFares.json' with { type: 'json' };
import tripsData from '../data/trips.json' with { type: 'json' };

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
}

export interface ConversationState {
  activeDestination: string | null;
  serviceType: 'tour' | 'outstation' | 'local' | 'airport' | 'acting_driver' | 'corporate' | 'policy' | 'greeting' | null;
  durationDays: number | null;
  durationHours: number | null;
  vehicles: string[];
  pickupLocation: string | null;
  language: 'en' | 'ta' | 'tanglish';
  isOneWay: boolean;
  passengerCount: number | null;
}

// Known round-trip and one-way distances from Chennai (km)
export const KNOWN_DISTANCES_FROM_CHENNAI: Record<string, number> = {
  chennai: 0,
  tirupati: 155,
  tirumala: 175,
  pondicherry: 155,
  puducherry: 155,
  bangalore: 346,
  bengaluru: 346,
  vellore: 137,
  kanchipuram: 75,
  mahabalipuram: 56,
  mamallapuram: 56,
  trichy: 332,
  tiruchirappalli: 332,
  madurai: 462,
  coimbatore: 505,
  salem: 340,
  thanjavur: 342,
  tanjore: 342,
  tirunelveli: 624,
  kanyakumari: 708,
  rameshwaram: 575,
  rameswaram: 575,
  kodaikanal: 530,
  ooty: 555,
  munnar: 580,
  mysore: 480,
  mysuru: 480,
  thiruvannamalai: 195,
  tiruvannamalai: 195,
  chidambaram: 215,
  pichavaram: 225,
  kumbakonam: 298,
  nagapattinam: 315,
  velankanni: 325,
  yelagiri: 230,
  yercaud: 365,
  sabarimala: 650,
  pamba: 650,
  nilakkal: 640,
  hosur: 305,
  krishnagiri: 260,
  dharmapuri: 300,
  erode: 395,
  tirupur: 460,
  dindigul: 420,
  karur: 375,
  cuddalore: 180,
  villupuram: 165,
  chengalpattu: 55,
  sriperumbudur: 45,
  arakkonam: 70,
  tiruttani: 85,
  srikalahasti: 115,
  kalahasti: 115,
  vijayawada: 450,
  nellore: 175,
  hyderabad: 630
};

// Chennai Airport transfer rates table (Sedan, Ertiga, Innova)
const AIRPORT_RATES: Record<string, { sedan: number; ertiga: number; innova: number }> = {
  velachery: { sedan: 650, ertiga: 850, innova: 1100 },
  tambaram: { sedan: 550, ertiga: 750, innova: 950 },
  tnagar: { sedan: 700, ertiga: 900, innova: 1200 },
  annanagar: { sedan: 800, ertiga: 1050, innova: 1350 },
  sholinganallur: { sedan: 750, ertiga: 950, innova: 1250 },
  porur: { sedan: 650, ertiga: 850, innova: 1100 },
  medavakkam: { sedan: 700, ertiga: 900, innova: 1200 },
  omr: { sedan: 750, ertiga: 950, innova: 1250 },
  guindy: { sedan: 500, ertiga: 700, innova: 900 },
  central: { sedan: 850, ertiga: 1100, innova: 1400 },
  egmore: { sedan: 800, ertiga: 1050, innova: 1350 },
  koyambedu: { sedan: 750, ertiga: 950, innova: 1250 },
  adyar: { sedan: 700, ertiga: 900, innova: 1200 },
  mylapore: { sedan: 750, ertiga: 950, innova: 1250 },
  chromepet: { sedan: 450, ertiga: 600, innova: 800 },
  pallavaram: { sedan: 400, ertiga: 550, innova: 750 },
  default: { sedan: 650, ertiga: 850, innova: 1100 }
};

export function isTamilText(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text);
}

export function isTanglishText(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('evlo') ||
    lower.includes('eppadi') ||
    lower.includes('sollunga') ||
    lower.includes('irunthu') ||
    lower.includes('naal') ||
    lower.includes('kattanam') ||
    lower.includes('vanakkam') ||
    lower.includes('iruka') ||
    lower.includes('poganum') ||
    lower.includes('kudunga')
  );
}

// Build pre-filled WhatsApp link
export function generateWhatsAppLink(text: string): string {
  const cleanPhone = '918939539211';
  const encoded = encodeURIComponent(text.trim())
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

// Extract conversation state across multiple turns
export function parseConversationState(messages: ChatMessage[], pageContext?: any): ConversationState {
  const state: ConversationState = {
    activeDestination: null,
    serviceType: null,
    durationDays: null,
    durationHours: null,
    vehicles: [],
    pickupLocation: null,
    language: 'en',
    isOneWay: false,
    passengerCount: null,
  };

  for (const m of messages) {
    if (m.role !== 'user') continue;
    const text = m.content || '';
    const lower = text.toLowerCase();

    // Language detection
    if (isTamilText(text)) {
      state.language = 'ta';
    } else if (isTanglishText(text)) {
      state.language = 'tanglish';
    }

    // Trip type / one way detection
    if (lower.includes('one way') || lower.includes('drop only') || lower.includes('drop taxi') || lower.includes('ஒரு வழி')) {
      state.isOneWay = true;
    } else if (lower.includes('round trip') || lower.includes('two way') || lower.includes('return') || lower.includes('இரு வழி')) {
      state.isOneWay = false;
    }

    // Passenger count
    const paxMatch = text.match(/(\d+)\s*(?:pax|people|persons?|passengers?|members?|பேர்|நபர்கள்)/i);
    if (paxMatch) {
      state.passengerCount = parseInt(paxMatch[1], 10);
    }

    // Duration in Days detection
    const daysMatch = lower.match(/(\d+)\s*(?:days?|day|நாட்கள்|நாட்களுக்கு|நாளுக்கு|நாள்)/i);
    if (daysMatch) {
      state.durationDays = parseInt(daysMatch[1], 10);
    } else if (lower.includes('same day') || lower.includes('1-day') || lower.includes('1 day') || lower.includes('one day') || lower.includes('ஒரு நாள்')) {
      state.durationDays = 1;
    } else if (lower.includes('2-day') || lower.includes('2 day') || lower.includes('two day') || lower.includes('2 நாள்') || lower.includes('2 நாட்கள்') || lower.includes('இரண்டு நாள்')) {
      state.durationDays = 2;
    } else if (lower.includes('3-day') || lower.includes('3 day') || lower.includes('three day') || lower.includes('3 நாள்') || lower.includes('3 நாட்கள்') || lower.includes('மூன்று நாள்')) {
      state.durationDays = 3;
    }

    // Vehicle detection in current turn
    const turnVehicles: string[] = [];
    if (lower.includes('sedan') || lower.includes('dzire') || lower.includes('etios') || lower.includes('செடான்')) {
      turnVehicles.push('sedan');
    }
    if (lower.includes('ertiga') || lower.includes('xl6') || lower.includes('எர்டிகா')) {
      turnVehicles.push('ertiga');
    }
    if (lower.includes('crysta') || lower.includes('கிரிஸ்டா')) {
      turnVehicles.push('crysta');
    } else if (lower.includes('innova') || lower.includes('இன்னோவா')) {
      turnVehicles.push('innova');
    }
    if (lower.includes('tempo') || lower.includes('traveller') || lower.includes('டெம்போ') || lower.includes('van')) {
      turnVehicles.push('tempo');
    }

    if (turnVehicles.length > 0) {
      state.vehicles = turnVehicles;
    }

    // Duration in Hours detection (Local rental)
    const hoursMatch = lower.match(/(\d+)\s*(?:hrs?|hours?|மணி|மணிநேரம்)/);
    if (hoursMatch) {
      state.durationHours = parseInt(hoursMatch[1], 10);
    }

    // Destination & Service Type detection
    if (lower.includes('tirupati') || lower.includes('tirumala') || lower.includes('balaji') || lower.includes('திருப்பதி')) {
      state.activeDestination = 'tirupati';
      state.serviceType = 'tour';
    } else if (lower.includes('chidambaram') || lower.includes('pichavaram') || lower.includes('சிதம்பரம்')) {
      state.activeDestination = 'chidambaram';
      state.serviceType = 'tour';
    } else if (lower.includes('thiruvannamalai') || lower.includes('tiruvannamalai') || lower.includes('girivalam') || lower.includes('திருவண்ணாமலை')) {
      state.activeDestination = 'thiruvannamalai';
      state.serviceType = 'tour';
    } else if (lower.includes('kanchipuram') || lower.includes('kanchi') || lower.includes('காஞ்சிபுரம்')) {
      state.activeDestination = 'kanchipuram';
      state.serviceType = 'tour';
    } else if (lower.includes('navagraha') || lower.includes('kumbakonam') || lower.includes('நவக்கிரக') || lower.includes('கும்பகோணம்')) {
      state.activeDestination = 'navagraha';
      state.serviceType = 'tour';
    } else if (lower.includes('rameswaram') || lower.includes('rameshwaram') || lower.includes('dhanushkodi') || lower.includes('ராமேஸ்வரம்')) {
      state.activeDestination = 'rameswaram';
      state.serviceType = 'tour';
    } else if (lower.includes('sabarimala') || lower.includes('pamba') || lower.includes('ஐயப்பன்') || lower.includes('சபரிமலை')) {
      state.activeDestination = 'sabarimala';
      state.serviceType = 'tour';
    } else if (lower.includes('vellore') || lower.includes('golden temple') || lower.includes('வேலூர்')) {
      state.activeDestination = 'vellore';
      state.serviceType = 'tour';
    } else if (lower.includes('pondy') || lower.includes('pondicherry') || lower.includes('puducherry') || lower.includes('பாண்டிச்சேரி')) {
      state.activeDestination = 'pondicherry';
      state.serviceType = 'tour';
    } else if (lower.includes('airport') || lower.includes('flight') || lower.includes('விமான நிலையம்') || lower.includes('ஏர்போர்ட்')) {
      state.serviceType = 'airport';
      state.activeDestination = 'airport';
    } else if (lower.includes('acting driver') || lower.includes('driver for my car') || lower.includes('chauffeur') || lower.includes('ஆக்டிங் டிரைவர்')) {
      state.serviceType = 'acting_driver';
      state.activeDestination = 'acting_driver';
    } else if (lower.includes('corporate') || lower.includes('employee transport') || lower.includes('ets') || lower.includes('monthly car')) {
      state.serviceType = 'corporate';
    } else if (lower.includes('local') || lower.includes('hourly') || lower.includes('city rental') || lower.includes('4hr') || lower.includes('8hr') || lower.includes('10hr') || lower.includes('12hr')) {
      state.serviceType = 'local';
    } else {
      // Check for known outstation cities
      for (const city of Object.keys(KNOWN_DISTANCES_FROM_CHENNAI)) {
        if (city === 'chennai') continue;
        if (lower.includes(city)) {
          state.activeDestination = city;
          state.serviceType = 'outstation';
          break;
        }
      }
    }

    // Check for Chennai pickup hubs
    for (const hub of Object.keys(AIRPORT_RATES)) {
      if (hub === 'default') continue;
      if (lower.includes(hub)) {
        state.pickupLocation = hub;
        break;
      }
    }
  }

  // Augment state with active on-screen page context if user query lacks explicit overrides
  if (pageContext) {
    if (!state.activeDestination && (pageContext.destination || pageContext.serviceSlug)) {
      const destStr = ((pageContext.destination || '') + ' ' + (pageContext.serviceSlug || '')).toLowerCase();
      if (destStr.includes('tirupati') || destStr.includes('tirumala') || destStr.includes('balaji')) {
        state.activeDestination = 'tirupati';
        state.serviceType = 'tour';
      } else if (destStr.includes('pondicherry') || destStr.includes('pondy') || destStr.includes('puducherry')) {
        state.activeDestination = 'pondicherry';
        state.serviceType = 'tour';
      } else if (destStr.includes('chidambaram') || destStr.includes('pichavaram')) {
        state.activeDestination = 'chidambaram';
        state.serviceType = 'tour';
      } else if (destStr.includes('thiruvannamalai') || destStr.includes('tiruvannamalai') || destStr.includes('girivalam')) {
        state.activeDestination = 'thiruvannamalai';
        state.serviceType = 'tour';
      } else if (destStr.includes('kanchipuram') || destStr.includes('kanchi')) {
        state.activeDestination = 'kanchipuram';
        state.serviceType = 'tour';
      } else if (destStr.includes('navagraha') || destStr.includes('kumbakonam')) {
        state.activeDestination = 'navagraha';
        state.serviceType = 'tour';
      } else if (destStr.includes('rameswaram') || destStr.includes('rameshwaram')) {
        state.activeDestination = 'rameswaram';
        state.serviceType = 'tour';
      } else if (destStr.includes('sabarimala') || destStr.includes('pamba')) {
        state.activeDestination = 'sabarimala';
        state.serviceType = 'tour';
      } else if (destStr.includes('vellore')) {
        state.activeDestination = 'vellore';
        state.serviceType = 'tour';
      } else if (destStr.includes('local') || pageContext.engine === 'LocalRental') {
        state.activeDestination = 'local';
        state.serviceType = 'local';
      } else if (destStr.includes('airport')) {
        state.activeDestination = 'airport';
        state.serviceType = 'airport';
      } else {
        const words = destStr.split(/[\s,]+/);
        for (const w of words) {
          if (KNOWN_DISTANCES_FROM_CHENNAI[w] !== undefined) {
            state.activeDestination = w;
            state.serviceType = 'outstation';
            break;
          }
        }
      }
    }

    if (state.vehicles.length === 0 && (pageContext.vehicleName || pageContext.vehicleId)) {
      const vStr = ((pageContext.vehicleName || '') + ' ' + (pageContext.vehicleId || '')).toLowerCase();
      if (vStr.includes('dzire') || vStr.includes('etios') || vStr.includes('sedan')) state.vehicles = ['sedan'];
      else if (vStr.includes('ertiga') || vStr.includes('xl6')) state.vehicles = ['ertiga'];
      else if (vStr.includes('crysta')) state.vehicles = ['crysta'];
      else if (vStr.includes('innova')) state.vehicles = ['innova'];
      else if (vStr.includes('tempo')) state.vehicles = ['tempo'];
    }

    if (!state.durationDays && pageContext.durationDays) {
      state.durationDays = pageContext.durationDays;
    }
    if (!state.durationHours && pageContext.durationHours) {
      state.durationHours = pageContext.durationHours;
    }
  }

  return state;
}

// Generate intelligent contextual response when user has an active on-screen calculation
function getOnScreenContextReply(
  state: ConversationState,
  pageContext: any,
  lastUserMsg: string,
  isTa: boolean
): string | null {
  if (!pageContext || !pageContext.totalFare) return null;

  const qLow = lastUserMsg.toLowerCase();
  const asksFor2Days = qLow.includes('2 day') || qLow.includes('two day') || qLow.includes('2-day') || qLow.includes('2 நாள்') || qLow.includes('2 நாட்கள்');
  const asksPrice = qLow.includes('price') || qLow.includes('cost') || qLow.includes('fare') || qLow.includes('rate') || qLow.includes('how much') || qLow.includes('quote') || qLow.includes('evlo') || qLow.includes('kattanam') || qLow.includes('tariff');
  const asksExplain = qLow.includes('explain') || qLow.includes('why') || qLow.includes('breakup') || qLow.includes('breakdown') || qLow.includes('details') || qLow.includes('screen') || qLow.includes('quote');

  const isRelevant = asksFor2Days || asksPrice || asksExplain || qLow.includes('this trip') || qLow.includes('my trip') || qLow.includes('selected') || qLow.includes('booking');
  if (!isRelevant) return null;

  const dest = pageContext.destination || (pageContext.serviceTitle ? pageContext.serviceTitle.replace(/Chennai to /i, '') : 'your trip');
  const vehicle = pageContext.vehicleName || 'Swift Dzire / Etios';
  const fare = pageContext.formattedFare || `₹${pageContext.totalFare?.toLocaleString('en-IN')}`;
  const durLabel = pageContext.durationLabel || `${pageContext.durationHours || 24} hrs`;
  const subText = pageContext.durationSubText || (pageContext.isProRata ? '1 Night Stay' : '');

  // Case 1: Pro-Rata (e.g. 36 hours / 1 Night Stay, user asks "for 2 days" or asks price)
  if (pageContext.isProRata) {
    const hrs = pageContext.durationHours || 36;
    const extraHrs = pageContext.extraHours || (hrs - 24);
    const savings = pageContext.savings ? `₹${pageContext.savings.toLocaleString('en-IN')}` : '₹1,750';
    const capFare = pageContext.maxCapFare ? `₹${pageContext.maxCapFare.toLocaleString('en-IN')}` : '₹9,500';

    const waMsg = `Hi Kalidass Travels, I have configured a ${durLabel} trip to ${dest} (${fare} for ${vehicle}). Please confirm availability.`;
    const waUrl = generateWhatsAppLink(waMsg);

    if (isTa) {
      return (
        `உங்கள் திரையில் தேர்ந்தெடுக்கப்பட்ட பயண அட்டவணை: **${durLabel} (${hrs} மணிநேரம் / ${subText || '1 இரவு தங்குதல்'})**:\n\n` +
        `• **திரையில் உள்ள புரோ-ரேட்டா கட்டணம்:** **${fare}** (${vehicle})\n` +
        `  உங்கள் பயணம் முழு 48 மணிநேரம் இல்லாமல் **${hrs} மணிநேரம்** மட்டுமே என்பதால், காளிதாஸ் டிராவல்ஸ் நியாயமான புரோ-ரேட்டா முறையில் கணக்கிட்டு முழு 2-நாள் கட்டணத்தை விட **${savings} மிச்சப்படுத்துகிறது**!\n\n` +
        `• **முழு 48-மணிநேர 2-நாள் பேக்கேஜ்:**\n` +
        `  நீங்கள் காரை முழு 48 மணிநேரமும் (2 முழு நாள்கள்) பயன்படுத்த விரும்பினால்:\n` +
        `  - **Swift Dzire / Etios (4 Pax):** ₹9,500\n` +
        `  - **Maruti Ertiga / XL6 (6 Pax):** ₹11,500\n` +
        `  - **Toyota Innova (7 Pax):** ₹12,500\n` +
        `  - **Innova Crysta:** ₹16,000\n\n` +
        `✅ **உள்ளடக்கம்:** சுத்தமான ஏசி கார், டிரைவர் பேட்டா, ஆந்திரா பெர்மிட் & திருமலை மலைப்பாதை அனுமதி.\n` +
        `🛡️ **பாலிசி:** காரை உறுதிசெய்து லாக் செய்ய **₹500 முன்பணம்** மட்டுமே. மீதமுள்ள தொகை பயண முடிவில்!\n\n` +
        `[👉 வாட்ஸ்அப்பில் முன்பதிவு செய்ய](${waUrl})`
      );
    }

    return (
      `I see your selected schedule on screen is **${durLabel}** (${hrs} hours${subText ? ` / ${subText}` : ''}) for **${dest}**:\n\n` +
      `• **Your On-Screen Pro-Rata Fare:** **${fare}** for **${vehicle}**\n` +
      `  Because your trip duration is **${hrs} hours** (rather than the full 48 hours), our transparent tariff charges you pro-rata for 1 Day + ${extraHrs} hrs, **saving you ${savings}** compared to the full 2-day package!\n\n` +
      `• **Full 48-Hour 2-Day Package Rates:**\n` +
      `  If you require the cab for the complete 48 hours (e.g. 2 full calendar days or returning late night on Day 2):\n` +
      `  - **Swift Dzire / Etios (4 Pax):** ₹9,500\n` +
      `  - **Maruti Ertiga / XL6 (6 Pax):** ₹11,500\n` +
      `  - **Toyota Innova (7 Pax):** ₹12,500\n` +
      `  - **Toyota Innova Crysta (7 Pax):** ₹16,000\n` +
      `  - **Tempo Traveller (12 Pax):** ₹19,500\n\n` +
      `✅ **Inclusions:** Dedicated AC Cab & Experienced Chauffeur, Fuel, AP State Border Permit, Tirumala Ghat Road ascent, and Driver Bata.\n` +
      `🛡️ **Policy:** Nominal **₹500 advance** to confirm & lock cab (avoids last-minute cancellation). Remaining balance paid post-trip!\n\n` +
      `[👉 Confirm Booking on WhatsApp](${waUrl})`
    );
  }

  // Case 2: Standard 1-Day on screen and customer asking "for 2 days"
  const is1Day = pageContext.durationDays === 1 || pageContext.durationHours <= 24;
  if (is1Day && asksFor2Days) {
    const waMsg = `Hi Kalidass Travels, I want to upgrade my ${dest} package from 1-day to 2-day. Please share availability.`;
    const waUrl = generateWhatsAppLink(waMsg);

    return (
      `On your screen, you currently have the **1-Day Package (${fare})** for **${vehicle}**.\n\n` +
      `If you'd like to extend to our official **2-Day Package** for **${dest}**, here are the fixed rates:\n\n` +
      `• **Swift Dzire / Etios (4 Pax):** ₹9,500\n` +
      `• **Maruti Ertiga / XL6 (6 Pax):** ₹11,500\n` +
      `• **Toyota Innova (7 Pax):** ₹12,500\n` +
      `• **Toyota Innova Crysta (7 Pax):** ₹16,000\n` +
      `• **Tempo Traveller (12 Pax):** ₹19,500\n\n` +
      `✅ **Inclusions:** Dedicated AC cab & chauffeur for 2 days. Driver bata included.\n` +
      `🛡️ **Policy:** ₹500 advance to confirm & lock cab. Balance paid post-trip!\n\n` +
      `[👉 Confirm 2-Day Package on WhatsApp](${waUrl})`
    );
  }

  // Case 3: Direct explanation of on-screen quote
  const waMsg = `Hi Kalidass Travels, I have a quote of ${fare} for ${dest} (${vehicle}). Please confirm cab availability.`;
  const waUrl = generateWhatsAppLink(waMsg);

  return (
    `Here is the verified breakdown for your on-screen quote of **${fare}** for **${dest}** (${vehicle}):\n\n` +
    `• **Vehicle:** ${vehicle} (${pageContext.passengers || '4'} Passengers)\n` +
    `• **Duration:** ${durLabel}${subText ? ` (${subText})` : ''}\n` +
    `• **Total Fare:** **${fare}**\n` +
    (pageContext.distanceKm ? `• **Distance:** ~${pageContext.distanceKm} km\n` : '') +
    `\n✅ **Transparent Pricing:** No hidden charges. Only nominal ₹500 advance to lock cab; pay balance directly after trip completion!\n\n` +
    `[👉 Confirm Booking on WhatsApp](${waUrl})`
  );
}

// Generate intelligent response based on conversation history, state, and on-screen context
export function processAiConciergeQuery(messages: ChatMessage[], pageContext?: any): { reply: string; source: string; meta?: any } {
  if (!messages || messages.length === 0) {
    return { reply: getHelpMenu('en'), source: 'autonomous_engine' };
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const state = parseConversationState(messages, pageContext);
  const qLower = lastUserMessage.toLowerCase();
  const isTa = state.language === 'ta';

  // ─── 1. POLICY, TRUST, ADVANCE & CANCELLATION INQUIRIES ─────────────────────────
  if (
    qLower.includes('advance') ||
    qLower.includes('deposit') ||
    qLower.includes('lock cab') ||
    qLower.includes('முன்பணம்') ||
    qLower.includes('advance evlo')
  ) {
    return {
      reply: getAdvancePolicyReply(isTa, state.activeDestination),
      source: 'autonomous_engine',
      meta: { type: 'policy', topic: 'advance' }
    };
  }

  // ─── 1.5. ACTIVE ON-SCREEN CALCULATION CONTEXT AWARENESS ────────────────────────
  if (pageContext && pageContext.totalFare) {
    const contextReply = getOnScreenContextReply(state, pageContext, lastUserMessage, isTa);
    if (contextReply) {
      return {
        reply: contextReply,
        source: 'contextual_engine',
        meta: { type: 'on_screen_context', fare: pageContext.totalFare, isProRata: pageContext.isProRata }
      };
    }
  }

  if (
    qLower.includes('cancel') ||
    qLower.includes('refund') ||
    qLower.includes('ரத்து') ||
    qLower.includes('திருப்பிக்கொடு')
  ) {
    return {
      reply: getCancellationPolicyReply(isTa),
      source: 'autonomous_engine',
      meta: { type: 'policy', topic: 'cancellation' }
    };
  }

  if (
    qLower.includes('driver safe') ||
    qLower.includes('driver verification') ||
    qLower.includes('night travel') ||
    qLower.includes('pvc') ||
    qLower.includes('safe') ||
    qLower.includes('பாதுகாப்பு') ||
    qLower.includes('டிரைவர்')
  ) {
    if (qLower.includes('driver') && !qLower.includes('acting driver') && (qLower.includes('safe') || qLower.includes('police') || qLower.includes('language') || qLower.includes('speak') || qLower.includes('who is') || qLower.includes('ratings'))) {
      return {
        reply: getDriverSafetyReply(isTa),
        source: 'autonomous_engine',
        meta: { type: 'policy', topic: 'driver_safety' }
      };
    }
  }

  if (
    qLower.includes('toll') ||
    qLower.includes('permit') ||
    qLower.includes('parking') ||
    qLower.includes('bata') ||
    qLower.includes('inclusion') ||
    qLower.includes('டூல்') ||
    qLower.includes('அனுமதி')
  ) {
    return {
      reply: getInclusionPolicyReply(isTa, state.activeDestination, state.durationDays || 1),
      source: 'autonomous_engine',
      meta: { type: 'policy', topic: 'inclusions' }
    };
  }

  // ─── 2. FIXED TEMPLE / TOUR PACKAGES ──────────────────────────────────────────
  if (state.serviceType === 'tour' || state.activeDestination === 'tirupati' || state.activeDestination === 'chidambaram' || state.activeDestination === 'thiruvannamalai' || state.activeDestination === 'kanchipuram' || state.activeDestination === 'navagraha' || state.activeDestination === 'rameswaram' || state.activeDestination === 'sabarimala' || state.activeDestination === 'vellore' || state.activeDestination === 'pondicherry') {
    const quote = getTourPackageQuote(state, isTa);
    if (quote) {
      return { reply: quote, source: 'autonomous_engine', meta: { type: 'tour_quote', destination: state.activeDestination, days: state.durationDays || 1 } };
    }
  }

  // ─── 3. LOCAL CHENNAI HOURLY RENTALS ─────────────────────────────────────────
  if (state.serviceType === 'local' || qLower.includes('local') || qLower.includes('hourly') || qLower.includes('சென்னை லோக்கல்')) {
    return {
      reply: getLocalRentalQuote(state, isTa),
      source: 'autonomous_engine',
      meta: { type: 'local_quote', hours: state.durationHours || 8 }
    };
  }

  // ─── 4. CHENNAI AIRPORT TRANSFERS ────────────────────────────────────────────
  if (state.serviceType === 'airport' || qLower.includes('airport') || qLower.includes('flight') || qLower.includes('ஏர்போர்ட்')) {
    return {
      reply: getAirportTransferQuote(state, isTa),
      source: 'autonomous_engine',
      meta: { type: 'airport_quote', pickup: state.pickupLocation || 'Chennai City' }
    };
  }

  // ─── 5. ACTING DRIVER SERVICE ────────────────────────────────────────────────
  if (state.serviceType === 'acting_driver' || qLower.includes('acting driver') || qLower.includes('ஆக்டிங் டிரைவர்')) {
    return {
      reply: getActingDriverQuote(state, isTa),
      source: 'autonomous_engine',
      meta: { type: 'acting_driver_quote' }
    };
  }

  // ─── 6. CORPORATE MOBILITY ───────────────────────────────────────────────────
  if (state.serviceType === 'corporate' || qLower.includes('corporate') || qLower.includes('monthly rental') || qLower.includes('ets')) {
    return {
      reply: getCorporateQuote(isTa),
      source: 'autonomous_engine',
      meta: { type: 'corporate_quote' }
    };
  }

  // ─── 7. OUTSTATION DYNAMIC DISTANCE CALCULATION ──────────────────────────────
  if (state.activeDestination && KNOWN_DISTANCES_FROM_CHENNAI[state.activeDestination] !== undefined) {
    return {
      reply: getOutstationDynamicQuote(state, isTa),
      source: 'autonomous_engine',
      meta: { type: 'outstation_quote', destination: state.activeDestination, days: state.durationDays || 1 }
    };
  }

  // ─── 8. GENERAL OUTSTATION TARIFF CARD ───────────────────────────────────────
  if (qLower.includes('outstation') || qLower.includes('per km') || qLower.includes('tariff') || qLower.includes('rate card') || qLower.includes('வெளியூர்')) {
    return {
      reply: getGeneralOutstationTariff(isTa),
      source: 'autonomous_engine',
      meta: { type: 'general_outstation_tariff' }
    };
  }

  // ─── 9. CONTEXTUAL FALLBACK / SMART PROMPT ──────────────────────────────────
  return {
    reply: getContextualHelp(state, isTa),
    source: 'autonomous_engine',
    meta: { type: 'menu' }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTE BUILDERS & KNOWLEDGE FORMATTERS
// ─────────────────────────────────────────────────────────────────────────────

function calculateMultiDayTourRate(v: any, numDays: number): number {
  if (numDays <= 3) {
    return v.rates?.[numDays] || (v.rates?.[1] ? v.rates[1] * numDays : 0);
  }
  const extraDays = numDays - 3;
  const day2 = v.rates?.[2] || v.rates?.[1] || 0;
  const day1 = v.rates?.[1] || 0;
  const extraPerDay = day2 - day1;
  const base3 = v.rates?.[3] || (day1 * 3);
  return base3 + (extraDays * extraPerDay);
}

function getTourPackageQuote(state: ConversationState, isTa: boolean): string | null {
  const dest = state.activeDestination || 'tirupati';
  const days = Math.max(state.durationDays || 1, 1);

  // Map destination to TOUR_CONFIG key
  const tourMap: Record<string, string> = {
    tirupati: 'tirupati-package',
    chidambaram: 'chidambaram-temple-trip',
    thiruvannamalai: 'thiruvannamalai-girivalam-trip',
    kanchipuram: 'kanchipuram-temple-trip',
    navagraha: 'navagraha-tour',
    rameswaram: 'rameswaram-2-days',
    sabarimala: 'sabarimala-trip',
    vellore: 'vellore-golden-temple',
    pondicherry: 'pondicherry-one-day-trip'
  };

  const configKey = tourMap[dest] || 'tirupati-package';
  const config = (TOUR_CONFIGS as any)[configKey];

  if (!config) return null;

  const title = config.serviceTitle || `Chennai to ${dest.toUpperCase()} Tour`;
  const vehicles = config.vehicles || [];

  // Filter vehicles if customer specified preference
  let filteredVehicles = vehicles;
  if (state.vehicles && state.vehicles.length > 0) {
    filteredVehicles = vehicles.filter((v: any) => {
      const vId = (v.id || '').toLowerCase();
      const vName = (v.name || '').toLowerCase();
      return state.vehicles.some(
        (pref) =>
          vId.includes(pref) ||
          vName.includes(pref) ||
          (pref === 'sedan' && (vId === 'dzire' || vName.includes('etios'))) ||
          (pref === 'ertiga' && (vId === 'ertiga' || vName.includes('xl6'))) ||
          (pref === 'innova' && vId === 'innova') ||
          (pref === 'crysta' && (vId === 'crysta' || vName.includes('crysta'))) ||
          (pref === 'tempo' && (vId.includes('tempo') || vName.includes('tempo')))
      );
    });
    if (filteredVehicles.length === 0) filteredVehicles = vehicles;
  }

  // Format quotes list
  let lines: string[] = [];
  filteredVehicles.forEach((v: any) => {
    const rate = calculateMultiDayTourRate(v, days);
    const name = v.name || v.shortName || 'Cab';
    const tag = v.tag ? ` *(${v.tag})*` : '';
    lines.push(`• **${name} (${v.capacity} Pax):** ₹${rate.toLocaleString('en-IN')}${tag}`);
  });

  const tourSlug = tourMap[dest] || 'tirupati-package';
  const pageLink = `/services/${tourSlug}/?days=${days}`;
  const whatsappMsg = `Hi Kalidass Travels, I want to book Chennai to ${dest.toUpperCase()} - ${days} Days package. Please confirm availability.`;
  const waUrl = generateWhatsAppLink(whatsappMsg);

  const DEST_NAMES_TA: Record<string, string> = {
    tirupati: 'திருப்பதி',
    tirumala: 'திருமலை',
    chidambaram: 'சிதம்பரம்',
    pichavaram: 'பிச்சாவரம்',
    thiruvannamalai: 'திருவண்ணாமலை',
    tiruvannamalai: 'திருவண்ணாமலை',
    kanchipuram: 'காஞ்சிபுரம்',
    navagraha: 'கும்பகோணம் நவக்கிரக',
    kumbakonam: 'கும்பகோணம்',
    rameswaram: 'ராமேஸ்வரம்',
    rameshwaram: 'ராமேஸ்வரம்',
    sabarimala: 'சபரிமலை',
    vellore: 'வேலூர் பொற்கோவில்',
    pondicherry: 'பாண்டிச்சேரி',
    puducherry: 'பாண்டிச்சேரி',
    bangalore: 'பெங்களூரு',
    bengaluru: 'பெங்களூரு',
    madurai: 'மதுரை',
    coimbatore: 'கோயம்புத்தூர்',
    trichy: 'திருச்சி',
    salem: 'சேலம்',
    ooty: 'ஊட்டி',
    kodaikanal: 'கொடைக்கானல்',
    munnar: 'மூணார்',
    kanyakumari: 'கன்யாகுமரி'
  };

  const destTa = DEST_NAMES_TA[dest] || dest.toUpperCase();

  if (isTa) {
    const durationLabel = days === 1 ? '1-நாள்' : `${days}-நாட்கள்`;
    return (
      `சென்னை ⇄ **${destTa} ${durationLabel} பேக்கேஜ்** அதிகாரப்பூர்வ கட்டணங்கள்:\n\n` +
      `${lines.join('\n')}\n\n` +
      `✅ **உள்ளடக்கம்:** சுத்தமான ஏசி வாகனம், டிரைவர் பேட்டா, திருமலை மலைப்பாதை அனுமதி & சுங்கக் கட்டணம் (1-நாள் பேக்கேஜில் அடங்கும்).\n` +
      `🛡️ **முன்பதிவு உத்தரவாதம்:** ₹500 முன்பணம் செலுத்தி காரை லாக் செய்யலாம் (கடைசி நேர ரத்து தவிர்க்க). மீதமுள்ள தொகை பயண முடிவில்!\n\n` +
      `[👉 ${durationLabel} கால்குலேட்டரில் பார்க்க](${pageLink})\n\n` +
      `[👉 வாட்ஸ்அப்பில் உறுதிப்படுத்தவும்](${waUrl})`
    );
  }

  const durationLabel = days === 1 ? '1-Day' : `${days}-Day`;
  const inclusionNote =
    dest === 'tirupati' && days === 1
      ? 'Fuel, FASTag Tolls, AP Border Permit, Tirumala Ghat Road ascent & Driver Bata.'
      : `Dedicated AC cab & experienced chauffeur staying with you for all ${days} days, Tirumala Ghat Road ascent & Driver Bata.`;

  return (
    `Here are our official **Chennai ⇄ ${dest.toUpperCase()} ${durationLabel} Package** rates:\n\n` +
    `${lines.join('\n')}\n\n` +
    `✅ **Inclusions:** ${inclusionNote}\n` +
    `🛡️ **Policy:** Nominal ₹500 advance to confirm & lock cab (avoids last-minute cancellation). Remaining balance paid post-trip!\n\n` +
    `[👉 Open ${dest.toUpperCase()} ${durationLabel} Calculator & View Live Quote](${pageLink})\n\n` +
    `[👉 Confirm Booking on WhatsApp](${waUrl})`
  );
}

function getOutstationDynamicQuote(state: ConversationState, isTa: boolean): string {
  const dest = state.activeDestination || 'bangalore';
  const oneWayKm = KNOWN_DISTANCES_FROM_CHENNAI[dest] || 300;
  const isOneWay = state.isOneWay;
  const days = Math.max(state.durationDays || Math.ceil((oneWayKm * (isOneWay ? 1 : 2)) / 300), 1);

  const totalKm = isOneWay ? oneWayKm : oneWayKm * 2;
  const billedKmCar = Math.max(totalKm, days * 250);
  const billedKmTempo = Math.max(totalKm, days * 300);

  // Exact calculations based on tariffConfig
  const sedanCost = billedKmCar * 14 + days * 400;
  const ertigaCost = billedKmCar * 17 + days * 500;
  const innovaCost = billedKmCar * 20 + days * 600;
  const crystaCost = billedKmCar * 22 + days * 700;
  const tempoCost = billedKmTempo * 26 + days * 800;

  // Vehicle lines mapping
  const vehicleQuotesEn: Record<string, string> = {
    sedan: `• **AC Sedan (Dzire / Etios - 4 Pax):** ~₹${sedanCost.toLocaleString('en-IN')} (₹14/km + ₹${days * 400} Bata)`,
    ertiga: `• **Maruti Ertiga / XL6 (6 Pax):** ~₹${ertigaCost.toLocaleString('en-IN')} (₹17/km + ₹${days * 500} Bata)`,
    innova: `• **Toyota Innova (7 Pax):** ~₹${innovaCost.toLocaleString('en-IN')} (₹20/km + ₹${days * 600} Bata)`,
    crysta: `• **Toyota Innova Crysta (7 Pax):** ~₹${crystaCost.toLocaleString('en-IN')} (₹22/km + ₹${days * 700} Bata)`,
    tempo: `• **Tempo Traveller (12 Pax):** ~₹${tempoCost.toLocaleString('en-IN')} (₹26/km + ₹${days * 800} Bata)`
  };

  const vehicleQuotesTa: Record<string, string> = {
    sedan: `• **AC Sedan (Dzire / Etios - 4 Pax):** ~₹${sedanCost.toLocaleString('en-IN')} (₹14/கி.மீ + ₹${days * 400} பேட்டா)`,
    ertiga: `• **Maruti Ertiga / XL6 (6 Pax):** ~₹${ertigaCost.toLocaleString('en-IN')} (₹17/கி.மீ + ₹${days * 500} பேட்டா)`,
    innova: `• **Toyota Innova (7 Pax):** ~₹${innovaCost.toLocaleString('en-IN')} (₹20/கி.மீ + ₹${days * 600} பேட்டா)`,
    crysta: `• **Toyota Innova Crysta (7 Pax):** ~₹${crystaCost.toLocaleString('en-IN')} (₹22/கி.மீ + ₹${days * 700} பேட்டா)`,
    tempo: `• **Tempo Traveller (12 Pax):** ~₹${tempoCost.toLocaleString('en-IN')} (₹26/கி.மீ + ₹${days * 800} பேட்டா)`
  };

  let selectedVehicles = Object.keys(vehicleQuotesEn);
  if (state.vehicles && state.vehicles.length > 0) {
    const matched = state.vehicles.filter((v) => vehicleQuotesEn[v]);
    if (matched.length > 0) selectedVehicles = matched;
  }

  const linesEn = selectedVehicles.map((k) => vehicleQuotesEn[k]).join('\n');
  const linesTa = selectedVehicles.map((k) => vehicleQuotesTa[k]).join('\n');

  const tripTypeLabel = isOneWay ? 'One-Way Drop' : `${days}-Day Round Trip`;
  const whatsappMsg = `Hi Kalidass Travels, I need a quote for Chennai to ${dest.toUpperCase()} (${tripTypeLabel}, ~${totalKm} km).`;
  const waUrl = generateWhatsAppLink(whatsappMsg);

  if (isTa) {
    return (
      `சென்னை ➔ **${dest.toUpperCase()} (${tripTypeLabel} ~${totalKm} கி.மீ)** மதிப்பீட்டு கட்டணங்கள்:\n\n` +
      `${linesTa}\n\n` +
      `📋 **விவரங்கள்:** குறைந்தபட்சம் 250 கி.மீ/நாள் கணக்கீடு. சுங்கக் கட்டணம் (FASTag Plazas) மற்றும் பார்க்கிங் நேரடி கட்டணம்.\n` +
      `🛡️ **உத்தரவாதம்:** ₹500 முன்பணம் செலுத்தி காரை லாக் செய்யலாம். மீதமுள்ள தொகை பயண முடிவில்!\n\n` +
      `[👉 வாட்ஸ்அப்பில் உறுதிப்படுத்தவும்](${waUrl})`
    );
  }

  return (
    `Here is the customized quote for **Chennai ⇄ ${dest.toUpperCase()} (${tripTypeLabel} ~${totalKm} km)**:\n\n` +
    `${linesEn}\n\n` +
    `📋 **Tariff Rules:**\n` +
    `• Minimum billing: 250 km / calendar day (300 km for Tempo Traveller).\n` +
    `• Highway FASTag tolls & interstate state permits payable at actuals.\n` +
    `🛡️ **Policy:** ₹500 advance to confirm & lock cab (prevents last-minute cancellation). Remaining balance post-trip!\n\n` +
    `[👉 Confirm Booking on WhatsApp](${waUrl})`
  );
}

function getLocalRentalQuote(state: ConversationState, isTa: boolean): string {
  const hours = state.durationHours || 8;
  const is4Hr = hours <= 4;
  const is8Hr = hours > 4 && hours <= 8;

  const whatsappMsg = `Hi Kalidass Travels, I need Chennai Local Rental (${hours} hrs) package. Please confirm booking.`;
  const waUrl = generateWhatsAppLink(whatsappMsg);

  if (isTa) {
    return (
      `**சென்னை நகர லோக்கல் வாடகை பேக்கேஜ்கள் (Chennai City Hourly Rentals):**\n\n` +
      `• **AC Sedan (Dzire / Etios):**\n` +
      `  - 4 மணிநேரம் / 40 கி.மீ: ₹1,350 (கூடுதல் கி.மீ: ₹15 | மணி: ₹150)\n` +
      `  - 8 மணிநேரம் / 80 கி.மீ: ₹2,200 (மிகப் பிரபலம்)\n` +
      `  - 10 மணிநேரம் / 100 கி.மீ: ₹2,600\n\n` +
      `• **Maruti Ertiga (6 சீட்டர்):**\n` +
      `  - 4 மணிநேரம் / 40 கி.மீ: ₹1,700 (கூடுதல் கி.மீ: ₹17 | மணி: ₹200)\n` +
      `  - 8 மணிநேரம் / 80 கி.மீ: ₹2,800\n\n` +
      `• **Toyota Innova (7 சீட்டர்):**\n` +
      `  - 8 மணிநேரம் / 80 கி.மீ: ₹3,200 | Innova Crysta: ₹4,500\n\n` +
      `🛡️ **உத்தரவாதம்:** உள்ளூர் வாடகைக்கு ₹0 முன்பணம் — பயண முடிவில் முழு கட்டணம் செலுத்தலாம்!\n\n` +
      `[👉 வாட்ஸ்அப்பில் புக் செய்ய](${waUrl})`
    );
  }

  return (
    `Here are our official **Chennai City Local Rental Packages**:\n\n` +
    `• **AC Sedan (Dzire / Etios):**\n` +
    `  - 4 hrs / 40 km: ₹1,350 (Extra km: ₹15 | Extra hr: ₹150)\n` +
    `  - 8 hrs / 80 km: ₹2,200 *(Most Popular for City Shopping & Meetings)*\n` +
    `  - 10 hrs / 100 km: ₹2,600\n` +
    `  - 12 hrs / 120 km: ₹3,050\n\n` +
    `• **Maruti Ertiga / XL6 (6 Pax):**\n` +
    `  - 4 hrs / 40 km: ₹1,700 (Extra km: ₹17 | Extra hr: ₹200)\n` +
    `  - 8 hrs / 80 km: ₹2,800\n` +
    `  - 10 hrs / 100 km: ₹3,400\n\n` +
    `• **Toyota Innova / Crysta:**\n` +
    `  - Innova (8 hrs / 80 km): ₹3,200\n` +
    `  - Innova Crysta (8 hrs / 80 km): ₹4,500\n\n` +
    `🛡️ **Policy:** ₹0 advance deposit for local city rentals — pay balance smoothly after trip!\n\n` +
    `[👉 Book on WhatsApp](${waUrl})`
  );
}

function getAirportTransferQuote(state: ConversationState, isTa: boolean): string {
  const pickup = (state.pickupLocation || 'velachery').toLowerCase();
  const rates = AIRPORT_RATES[pickup] || AIRPORT_RATES['default'];
  const hubName = pickup.charAt(0).toUpperCase() + pickup.slice(1);

  const whatsappMsg = `Hi Kalidass Travels, I need Chennai Airport transfer to/from ${hubName}. Please confirm.`;
  const waUrl = generateWhatsAppLink(whatsappMsg);

  if (isTa) {
    return (
      `**சென்னை விமான நிலைய (MAA Airport) டாக்சி கட்டணங்கள் (${hubName}):**\n\n` +
      `• **AC Sedan (Dzire / Etios - 4 Pax):** ₹${rates.sedan}\n` +
      `• **Maruti Ertiga (6 Pax):** ₹${rates.ertiga}\n` +
      `• **Toyota Innova (7 Pax):** ₹${rates.innova}\n\n` +
      `✈️ **விமான நிலைய பிரத்யேக உத்தரவாதங்கள்:**\n` +
      `• **முன்கூட்டியே ஓட்டுநர் விவரங்கள்:** உங்கள் புறப்படும் விமான நிலையத்தில் நீங்கள் **விமானத்தில் ஏறும் முன்பே (Before Takeoff)** ஓட்டுநர் பெயர், எண் மற்றும் கார் விவரங்கள் வாட்ஸ்அப்பில் அனுப்பப்படும்!\n` +
      `• நேரடி விமான ரேடார் கண்காணிப்பு — விமான தாமதத்திற்கு கூடுதல் காத்திருப்பு கட்டணம் இல்லை (₹0 Waiting Charge).\n` +
      `• 24/7 டெர்மினல் வருகை வாசலில் வரவேற்பு & உடனடி பிக்கப்.\n` +
      `🛡️ **முன்பணம்:** உள்ளூர் டிராப்களுக்கு ₹0 முன்பணம் — பயண முடிவில் செலுத்தலாம்.\n\n` +
      `[👉 வாட்ஸ்அப்பில் டாக்சி புக் செய்ய](${waUrl})`
    );
  }

  return (
    `Here are our fixed **Chennai Airport (MAA) Taxi Transfer** rates to/from **${hubName}**:\n\n` +
    `• **AC Sedan (Dzire / Etios - 4 Pax):** ₹${rates.sedan}\n` +
    `• **Maruti Ertiga / XL6 (6 Pax):** ₹${rates.ertiga}\n` +
    `• **Toyota Innova (7 Pax):** ₹${rates.innova}\n\n` +
    `✈️ **Airport Operational Guarantees:**\n` +
    `• **Chauffeur Details Before Takeoff:** Driver details (chauffeur name, mobile, vehicle number) are sent on WhatsApp **before your flight takes off** from your origin airport — offering 100% peace of mind before boarding!\n` +
    `• **Live Flight Radar Tracking:** Zero waiting charge penalty for flight delays.\n` +
    `• 24/7 doorstep pickup or terminal exit greeting.\n` +
    `🛡️ **Payment:** ₹0 advance deposit for city airport drops — pay balance after drop.\n\n` +
    `[👉 Book Airport Cab on WhatsApp](${waUrl})`
  );
}

function getActingDriverQuote(state: ConversationState, isTa: boolean): string {
  const isTaQuery = isTa;
  const whatsappMsg = `Hi Kalidass Travels, I want to hire an Acting Driver for my personal car.`;
  const waUrl = generateWhatsAppLink(whatsappMsg);

  if (isTaQuery) {
    return (
      `**சொந்த காருக்கான ஆக்டிங் டிரைவர் கட்டணங்கள் (Acting Driver Service in Chennai):**\n\n` +
      `• **சென்னை நகரத்திற்குள் (City Duty):**\n` +
      `  - 4 மணிநேரம்: ₹750 (கூடுதல் மணி: ₹120)\n` +
      `  - 8 மணிநேரம்: ₹1,200 (முழு நாள் பணி)\n` +
      `  - இரவு நேர ஓட்டுநர் கட்டணம் (10:00 PM - 5:00 AM): ₹150\n\n` +
      `• **வெளியூர் பயணம் (Outstation Round Trip - உணவு பேட்டா உட்பட):**\n` +
      `  - **Hatchback & Sedan:** ₹1,700 / நாள் (₹1,400 பேட்டா + ₹300 உணவு)\n` +
      `  - **Compact SUV (Ertiga / Creta):** ₹1,800 / நாள் (₹1,500 பேட்டா + ₹300 உணவு)\n` +
      `  - **Premium SUV (Innova Crysta):** ₹1,900 / நாள் (₹1,600 பேட்டா + ₹300 உணவு)\n` +
      `  - **Luxury European (BMW / Audi):** ₹2,200 / நாள் (₹1,900 பேட்டா + ₹300 உணவு)\n\n` +
      `• **வெளியூர் ஒரு வழி டிராப் (One-Way Relocation):** தூரத்திற்கு ஏற்ப டிரைவர் பேட்டா + பேருந்து கட்டணம் + உணவு (பாண்டிச்சேரி ₹2,100 | பெங்களூரு ₹3,150 | மதுரை ₹4,200).\n\n` +
      `👮 **பாதுகாப்பு:** அனைத்து ஓட்டுநர்களும் தமிழ்நாடு போலீஸ் சரிபார்ப்பு சான்றிதழ் (PVC Verified) பெற்றவர்கள் மற்றும் Manual, Automatic (AT/DCT), EV நிபுணர்கள்.\n` +
      `🛡️ **பாலிசி:** ₹0 முன்பணம் — சேவை முடிந்த பின் கட்டணம் செலுத்தலாம்!\n\n` +
      `[👉 வாட்ஸ்அப்பில் டிரைவரை அழைக்க](${waUrl})`
    );
  }

  return (
    `Here are our verified **Acting Driver Services** for your personal car (MT / AT / EV):\n\n` +
    `• **Chennai City Duty:**\n` +
    `  - 4 Hours: ₹750 (Extra hour: ₹120)\n` +
    `  - 8 Hours: ₹1,200 *(Full Day Duty)*\n` +
    `  - Night drive allowance (10:00 PM - 5:00 AM): ₹150\n\n` +
    `• **Outstation Round Trip (Your Car - Driver meals included):**\n` +
    `  - **Hatchback & Sedan:** ₹1,700 / day (₹1,400 base bata + ₹300 food)\n` +
    `  - **Compact SUV / MPV (Ertiga, Creta, Seltos):** ₹1,800 / day (₹1,500 bata + ₹300 food)\n` +
    `  - **Premium SUV / MUV (Innova Crysta, Fortuner):** ₹1,900 / day (₹1,600 bata + ₹300 food)\n` +
    `  - **Luxury European (BMW, Mercedes-Benz, Audi):** ₹2,200 / day (₹1,900 bata + ₹300 food)\n` +
    `  - *Night Stay:* Free driver dormitory at hotels (TNCDBR rules); ₹300/night lodging allowance if private stay has no dorm.\n\n` +
    `• **Outstation One-Way Drop:** Tiered Driver Bata (1.0x–2.5x by distance) + Return AC/Sleeper Bus Ticket + Food Allowance (e.g., Pondicherry ₹2,100 | Bangalore ₹3,150 | Madurai ₹4,200).\n\n` +
    `👮 **Safety & Verification:**\n` +
    `• 100% Police Clearance Certificate (PVC Cleared) professional chauffeurs.\n` +
    `• Experienced with manual, automatic (CVT, DCT, Torque Converter), and EV vehicles.\n` +
    `🛡️ **Policy:** **₹0 advance deposit** required — pay after service completion!\n\n` +
    `[👉 Book Driver on WhatsApp](${waUrl})`
  );
}

function getCorporateQuote(isTa: boolean): string {
  const waUrl = generateWhatsAppLink('Hi Kalidass Travels, We would like to inquire about Corporate Cab Services & Monthly Car Rental.');
  if (isTa) {
    return (
      `**கார்ப்பரேட் மொபிலிட்டி & மாதாந்திர கார் வாடகை (Corporate & ETS):**\n\n` +
      `• **ஊழியர் பிக்கப் & டிராப் (ETS):** OMR, Guindy, Ambattur IT பார்க் ஊழியர்களுக்கான ஷிப்ட் போக்குவரத்து.\n` +
      `• **மாதாந்திர நிர்வாகி கார் (Monthly Retainer):** பிரத்யேக ஓட்டுநருடன் கூடிய Dzire, Etios, Innova Crysta.\n` +
      `• **100% ஜிஎஸ்டி இன்வாய்ஸ்:** முறையான பில்லிங் மற்றும் ஜிஎஸ்டி வரவு.\n\n` +
      `[👉 வாட்ஸ்அப்பில் தொடர்பு கொள்ள](${waUrl})`
    );
  }

  return (
    `**Corporate Mobility & Monthly Car Retainer Services:**\n\n` +
    `• **Employee Transport Services (ETS):** Punctual shift commute for IT corridors (OMR, Guindy, Porur).\n` +
    `• **Monthly Executive Cabs:** Dedicated chauffeur with sedan or Innova Crysta on monthly retainer.\n` +
    `• **Compliance & GST:** 100% itemized invoicing with GST compliance for seamless company expense claims.\n\n` +
    `[👉 Inquire on WhatsApp](${waUrl})`
  );
}

function getAdvancePolicyReply(isTa: boolean, destination: string | null): string {
  const destName = destination ? destination.toUpperCase() : 'your journey';
  const waUrl = generateWhatsAppLink(`Hi Kalidass Travels, I want to pay ₹500 advance and lock my cab for ${destName}.`);

  if (isTa) {
    return (
      `🛡️ **Kalidass Travels முன்பணம் கொள்கை (Advance Payment Policy):**\n\n` +
      `1. **₹500 மட்டுமே முன்பணம்:** வெளியூர் மற்றும் திருப்பதி போன்ற சுற்றுலா பயணங்களுக்கு உங்கள் காரை பிரத்யேகமாக லாக் செய்யவும், கடைசி நேர ரத்துகளைத் தவிர்க்கவும் ₹500 மட்டுமே பெறப்படுகிறது.\n` +
      `2. **பில்லில் கழித்தல் உத்தரவாதம்:** இந்த ₹500 கூடுதல் கட்டணம் அல்ல — இது உங்கள் மொத்த பயணக் கட்டணத்தில் கழிக்கப்படும் (மொத்த கட்டணம் − ₹500 முன்பணம் = மீதமுள்ள நிகரத் தொகை பயண முடிவில் டிரைவரிடம் செலுத்தலாம்).\n` +
      `3. **லோக்கல் வாடகை & ஆக்டிங் டிரைவர்:** ₹0 முன்பணம் — முற்றிலும் பயணத்திற்குப் பின்!\n` +
      `4. **100% ரீஃபண்ட்:** பயணத்திற்கு 6 மணிநேரம் முன்பு ரத்து செய்தால் ₹500 முழுமையாக திரும்ப வழங்கப்படும்.\n\n` +
      `[👉 ₹500 செலுத்தி காரை லாக் செய்ய வாட்ஸ்அப் செல்லவும்](${waUrl})`
    );
  }

  return (
    `🛡️ **Kalidass Travels Advance Payment Policy:**\n\n` +
    `1. **Nominal ₹500 Advance:** For outstation trips and tour packages (${destName}), we collect only **₹500 advance** to lock your cab and schedule your verified chauffeur. This protects against last-minute cancellations.\n` +
    `2. **100% Deducted from Final Bill:** The ₹500 advance is NOT an extra fee — it is deducted from your quoted total (e.g. Total Fare − ₹500 Advance = Net Balance payable directly to chauffeur upon trip completion).\n` +
    `3. **Local Rides & Acting Drivers:** **₹0 advance deposit** required — pay after service.\n` +
    `4. **100% Refund Guarantee:** If canceled up to 6 hours before departure, your ₹500 advance is fully refunded immediately.\n\n` +
    `[👉 Pay ₹500 Advance & Lock Cab on WhatsApp](${waUrl})`
  );
}

function getCancellationPolicyReply(isTa: boolean): string {
  const waUrl = generateWhatsAppLink('Hi Kalidass Travels, I have a question regarding trip cancellation.');
  if (isTa) {
    return (
      `🛡️ **ரத்து மற்றும் ரீஃபண்ட் கொள்கை (Cancellation & Refund Policy):**\n\n` +
      `• **வெளியூர் & கோவில் சுற்றுலா:** பயண தொடக்கத்திற்கு **6 மணிநேரம் முன்பு வரை** ரத்து செய்தால், நீங்கள் செலுத்திய ₹500 முன்பணம் 100% முழுமையாக திருப்பித் தரப்படும்.\n` +
      `• **6 மணிநேரத்திற்குள் ரத்து:** டிரைவர் ஒதுக்கீடு இழப்பீடாக ₹500 பிடிக்கப்படும்.\n` +
      `• **லோக்கல் வாடகை & ஆக்டிங் டிரைவர்:** பயணத்திற்கு 2 மணிநேரம் முன்பு வரை எந்த கட்டணமும் இன்றி இலவசமாக ரத்து செய்யலாம்.\n\n` +
      `[👉 உதவிக்கு வாட்ஸ்அப் தொடர்பு கொள்ளவும்](${waUrl})`
    );
  }

  return (
    `🛡️ **Kalidass Travels Cancellation & Refund Policy:**\n\n` +
    `• **Outstation & Tour Packages:** Cancel up to **6 hours prior to journey departure** for a **100% full refund** of your ₹500 advance deposit.\n` +
    `• **Late Cancellations (< 6 hours):** If canceled within 6 hours or upon last-minute passenger no-show, ₹500 is retained towards driver scheduling compensation.\n` +
    `• **Local City & Acting Drivers:** Free cancellation up to 2 hours before scheduled pickup time.\n\n` +
    `[👉 Contact Support on WhatsApp](${waUrl})`
  );
}

function getDriverSafetyReply(isTa: boolean): string {
  const drivers = siteContent.drivers || [];
  const driverNames = drivers.slice(0, 4).map((d: any) => d.name).join(', ');
  const waUrl = generateWhatsAppLink('Hi Kalidass Travels, I would like to know more about chauffeur safety for our family trip.');

  if (isTa) {
    return (
      `👮 **ஓட்டுநர் பாதுகாப்பு & சரிபார்ப்பு (Driver Safety Protocols):**\n\n` +
      `• **காவல்துறை சரிபார்ப்பு:** எங்கள் அனைத்து ஓட்டுநர்களும் (${driverNames} போன்ற 11+ ஓட்டுநர்கள்) தமிழ்நாடு போலீஸ் PVC சரிபார்ப்பு பெற்றவர்கள்.\n` +
      `• **அனுபவம்:** குறைந்தபட்சம் 5 முதல் 25+ ஆண்டுகள் நெடுஞ்சாலை ஓட்டுநர் அனுபவம் கொண்ட குடும்ப நட்பு ஓட்டுநர்கள்.\n` +
      `• **பன்மொழி திறன்:** தமிழ், ஆங்கிலம், மற்றும் இந்தி சரளமாக பேசக்கூடியவர்கள்.\n` +
      `• **இரவு நேர பாதுகாப்பு:** மது அருந்தாத, சோர்வு மேலாண்மை நெறிமுறைகளைப் பின்பற்றும் தொழில்முறை ஓட்டுநர்கள்.\n\n` +
      `[👉 வாட்ஸ்அப்பில் தொடர்பு கொள்ள](${waUrl})`
    );
  }

  return (
    `👮 **Kalidass Travels Chauffeur Safety & Verification Standards:**\n\n` +
    `• **Police Background Cleared (PVC):** 100% of our chauffeurs (${driverNames}, etc.) undergo rigorous background verification.\n` +
    `• **5 to 25+ Years Experience:** Disciplined highway driving with proven safety records for family & senior citizen travel.\n` +
    `• **Multilingual:** Fluent in Tamil, English, and Hindi for seamless communication.\n` +
    `• **Zero Alcohol & Night Safety:** Strict fatigue management, punctual arrival, and sanitized air-conditioned vehicles.\n\n` +
    `[👉 Speak with Us on WhatsApp](${waUrl})`
  );
}

function getInclusionPolicyReply(isTa: boolean, destination: string | null, days: number): string {
  const isTirupati1Day = destination === 'tirupati' && days === 1;

  if (isTirupati1Day) {
    if (isTa) {
      return (
        `✅ **திருப்பதி 1-நாள் பேக்கேஜ் உள்ளடக்கம் (All-Inclusive):**\n\n` +
        `• டீசல்/பெட்ரோல் எரிபொருள் கட்டணம் அடங்கும்.\n` +
        `• தேசிய நெடுஞ்சாலை சுங்க கட்டணம் (NH Tolls) அடங்கும்.\n` +
        `• ஆந்திர எல்லை நுழைவு வரி அனுமதி (AP State Permit) அடங்கும்.\n` +
        `• திருமலை மலைப்பாதை அனுமதி & கட்டணம் அடங்கும்.\n` +
        `• ஓட்டுநர் பேட்டா அடங்கும்.\n` +
        `*(தரிசன டிக்கெட்டுகள் மற்றும் உணவு பயணிகளுடையது)*`
      );
    }
    return (
      `✅ **Chennai ⇄ Tirupati 1-Day Package Inclusions (All-Inclusive):**\n\n` +
      `• Vehicle hire & round-trip fuel included.\n` +
      `• NH FASTag highway toll plaza fees included.\n` +
      `• Andhra Pradesh Interstate State Border Permit included.\n` +
      `• Tirumala Ghat Road ascent entry & driver bata included.\n` +
      `*(Darshan tickets & personal food expenses are to be arranged directly by passengers).*`
    );
  }

  if (isTa) {
    return (
      `📋 **கட்டண உள்ளடக்கம் & கூடுதல் விவரங்கள் (Tariff Inclusions):**\n\n` +
      `• **அடங்கியவை:** வாகனம் வாடகை, எரிபொருள் மற்றும் டிரைவர் தினசரி பேட்டா.\n` +
      `• **நேரடி கட்டணங்கள்:** நெடுஞ்சாலை டோல் (FASTag Plazas), பார்க்கிங் மற்றும் வெளிமாநில எல்லை அனுமதி வரி (தேவைப்படின்) அசல் ரசீது படி நேரடி கட்டணம்.\n` +
      `🛡️ ₹500 முன்பணம் செலுத்தி காரை லாக் செய்யலாம், மீதமுள்ள தொகை பயண முடிவில்.`
    );
  }

  return (
    `📋 **Tariff Inclusions & Transparent Billing:**\n\n` +
    `• **Included in Quote:** Dedicated AC cab, complete vehicle fuel, and driver daily bata.\n` +
    `• **Payable at Actuals:** Highway FASTag tolls, airport/parking charges, and interstate border entry permits (e.g. entering Kerala/Karnataka/AP) payable directly as per actual receipts.\n` +
    `🛡️ ₹500 advance locks cab, balance post-trip!`
  );
}

function getGeneralOutstationTariff(isTa: boolean): string {
  const waUrl = generateWhatsAppLink('Hi Kalidass Travels, I would like to get a quote for outstation cab booking.');
  if (isTa) {
    return (
      `Here are our official **Outstation Tariff Rates**:\n\n` +
      `• **Swift Dzire / Etios (4 Pax):** ₹14 / கி.மீ (டிரைவர் பேட்டா ₹400/நாள்)\n` +
      `• **Maruti Ertiga (6 Pax):** ₹17 / கி.மீ (டிரைவர் பேட்டா ₹500/நாள்)\n` +
      `• **Toyota Innova (7 Pax):** ₹20 / கி.மீ (டிரைவர் பேட்டா ₹600/நாள்)\n` +
      `• **Toyota Innova Crysta (7 Pax):** ₹22 / கி.மீ (டிரைவர் பேட்டா ₹700/நாள்)\n` +
      `• **Tempo Traveller (12 Pax):** ₹26 / கி.மீ (டிரைவர் பேட்டா ₹800/நாள்)\n\n` +
      `📋 ஒரு நாளைக்கு குறைந்தபட்சம் 250 கி.மீ (டெம்போ 300 கி.மீ). ₹500 முன்பணம் செலுத்தி காரை லாக் செய்யலாம்.\n\n` +
      `📲 [👉 வாட்ஸ்அப்பில் புக் செய்ய](${waUrl})`
    );
  }

  return (
    `Here are our official **Outstation & Intercity Tariff Rates**:\n\n` +
    `• **Swift Dzire / Etios (4 Pax):** ₹14 / km (Min 250 km/day, Driver Bata ₹400/day)\n` +
    `• **Maruti Ertiga / XL6 (6 Pax):** ₹17 / km (Min 250 km/day, Driver Bata ₹500/day)\n` +
    `• **Toyota Innova (7 Pax):** ₹20 / km (Min 250 km/day, Driver Bata ₹600/day)\n` +
    `• **Toyota Innova Crysta (7 Pax):** ₹22 / km (Min 250 km/day, Driver Bata ₹700/day)\n` +
    `• **Tempo Traveller (12 Pax):** ₹26 / km (Min 300 km/day, Driver Bata ₹800/day)\n\n` +
    `🛡️ **Guarantee:** ₹500 advance to confirm & lock cab (avoids last-minute cancellation). Remaining balance post-trip.\n\n` +
    `📲 [👉 Book on WhatsApp](${waUrl})`
  );
}

function getContextualHelp(state: ConversationState, isTa: boolean): string {
  const waUrl = generateWhatsAppLink('Hi Kalidass Travels, I need travel assistance.');
  if (isTa) {
    return (
      `வணக்கம்! Kalidass Travels கட்டணங்களை உடனுக்குடன் கணக்கிடலாம்:\n\n` +
      `• 🕉️ **திருப்பதி 1 அல்லது 2-நாள்:** Sedan ₹6,000 | Ertiga ₹7,500 (2-நாள்: ₹9,500 / ₹11,500)\n` +
      `• ⏱️ **சென்னை லோக்கல் 8hr:** Sedan ₹2,200 | Ertiga ₹2,800\n` +
      `• 🛣️ **வெளியூர் (Outstation):** ₹14/கி.மீ Sedan | ₹17/கி.மீ Ertiga | ₹20/கி.மீ Innova\n` +
      `• 🏖️ **பாண்டிச்சேரி:** Sedan ₹4,500 | Ertiga ₹5,800\n` +
      `• ✈️ **சென்னை ஏர்போர்ட் டாக்ஸி:** ₹500 முதல் ₹800 வரை\n\n` +
      `உங்கள் பயண இடம் அல்லது விருப்பத்தை டைப் செய்யவும் (அல்லது மைக் பட்டனைத் தட்டி குரல் மூலமாகவும் பேசலாம்)!`
    );
  }

  return (
    `I can instantly quote fares for you using Kalidass Travels' rate card:\n\n` +
    `• 🕉️ **Tirupati Balaji (1, 2 or 3 Days):** Sedan ₹6,000 / ₹9,500 | Ertiga ₹7,500 / ₹11,500\n` +
    `• ⏱️ **Local Chennai (4hr / 8hr / 10hr):** Sedan ₹2,200 | Ertiga ₹2,800 (8hr pkg)\n` +
    `• 🛣️ **Outstation Intercity:** ₹14/km Sedan | ₹17/km Ertiga | ₹20/km Innova\n` +
    `• 🏖️ **Pondicherry, Chidambaram, Navagraha, Rameswaram, etc.**\n` +
    `• ✈️ **Chennai Airport Taxi (MAA):** Fixed transfers across all localities\n` +
    `• 👮 **Acting Drivers:** For your personal car from ₹500 (city) / ₹1,100 (outstation)\n\n` +
    `Tell me your travel destination or vehicle preference to get started!`
  );
}

function getHelpMenu(lang: string): string {
  return (
    `Vanakkam! I am here to help you 24/7 with Kalidass Travels fares and bookings.\n\n` +
    `Which trip can I assist you with today?\n` +
    `• 🕉️ Tirupati Balaji (1, 2 or 3 Days)\n` +
    `• ⏱️ Local Chennai Hourly Rental\n` +
    `• 🛣️ Outstation to Bangalore, Pondy, Madurai, Coimbatore, etc.\n` +
    `• ✈️ Chennai Airport Transfers\n` +
    `• 👮 Acting Drivers for your car`
  );
}
