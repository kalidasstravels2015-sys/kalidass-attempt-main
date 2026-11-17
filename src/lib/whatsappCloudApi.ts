import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import tariffConfig from '../data/tariff_config.json' with { type: 'json' };
import { processAiConciergeQuery, type ChatMessage } from './aiConciergeEngine';
import { cleanWhatsAppText } from '../utils/cleanWhatsAppText';

const GRAPH_API_VERSION = 'v21.0';
const MAX_HISTORY_TURNS = 10;
const MAX_SEEN_IDS = 1000;

const processedMessageIds = new Set<string>();
const conversationHistories = new Map<string, ChatMessage[]>();

export interface InteractiveOption {
  id: string;
  title: string;
  description?: string;
}

export interface BotAction {
  replyText: string;
  interactive?: {
    type: 'buttons' | 'list';
    buttonLabel?: string;
    options: InteractiveOption[];
  } | null;
  leadStatus?: 'browsing' | 'quoted' | 'hot_lead';
  leadSummary?: string;
}

function readEnvVar(name: string): string | undefined {
  const fromImportMeta = (import.meta as any)?.env?.[name];
  if (fromImportMeta) return String(fromImportMeta).trim();
  if (process.env[name]) return String(process.env[name]).trim();

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const content = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
      const match = content.match(new RegExp(`^${escaped}\\s*=\\s*(.+)$`, 'm'));
      if (match) return match[1].replace(/^["']|["']$/g, '').trim();
    }
  } catch (_) {}
  return undefined;
}

export function getWhatsAppConfig() {
  const alertRaw = readEnvVar('WHATSAPP_ALERT_NUMBERS') || '';
  const alertNumbers = alertRaw
    .split(',')
    .map((s) => s.replace(/[^0-9]/g, ''))
    .filter((s) => s.length >= 10);

  return {
    verifyToken: readEnvVar('WHATSAPP_VERIFY_TOKEN'),
    accessToken: readEnvVar('WHATSAPP_ACCESS_TOKEN'),
    phoneNumberId: readEnvVar('WHATSAPP_PHONE_NUMBER_ID'),
    appSecret: readEnvVar('WHATSAPP_APP_SECRET'),
    geminiApiKey: readEnvVar('GEMINI_API_KEY'),
    alertNumbers,
  };
}

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret?: string): boolean {
  if (!appSecret) return true;
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(signatureHeader, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function buildTariffSummary(): string {
  const t = tariffConfig as any;

  const vehicleLines = Object.entries(t.vehicles || {})
    .map(([name, v]: [string, any]) => {
      return `• ${name} (${v.seats} AC, ${v.category}): Round-trip ₹${v.round_trip_rate}/km (Min ${v.min_km_per_day} km/day) | One-way ₹${v.one_way_rate}/km (Min ${v.min_drop_km} km) | Bata ₹${v.driver_bata}/day | Local 4hr/40km ₹${v.local_4hr_pkg} | 5hr/50km ₹${v.local_5hr_pkg} | 8hr/80km ₹${v.local_8hr_pkg} | 10hr/100km ₹${v.local_10hr_pkg} | 12hr/120km ₹${v.local_12hr_pkg} | Extra km ₹${v.extra_km_rate}, Extra hr ₹${v.extra_hr_rate}`;
    })
    .join('\n');

  const tempoLines = Object.entries(t.tempo_fleet || {})
    .map(([name, v]: [string, any]) => {
      return `• ${name} (${v.seats} AC): Round-trip ₹${v.round_trip_rate}/km (Min ${v.min_km_per_day} km/day) | One-way ₹${v.one_way_rate}/km | Bata ₹${v.driver_bata}/day | Local 8hr/80km ₹${v.local_8hr_pkg}`;
    })
    .join('\n');

  const permitLines = Object.entries(t.state_permits || {})
    .map(([code, p]: [string, any]) => {
      const r = p.rates || {};
      return `• ${p.stateName} (${code}): Sedan ₹${r.sedan} | SUV/Ertiga ₹${r.suv} | Innova/Crysta ₹${r.muv} | Tempo (12-14S) ₹${r.tempo} | Coach/Urbania ₹${r.coach}`;
    })
    .join('\n');

  const airportZones = Object.values(t.airport_tariffs?.city_zones || {})
    .map((z: any) => `• ${z.label}: Sedan ₹${z.sedan_base}`)
    .join('\n');

  const actingVehicles = (t.acting_drivers?.vehicles || [])
    .map((v: any) => `• ${v.label} (${v.models}): Outstation ₹${v.bata}/day (+ food ₹${t.acting_drivers?.food_per_day || 300}/day, stay ₹${t.acting_drivers?.stay_per_night || 300}/night if needed)`)
    .join('\n');

  return `KALIDASS TRAVELS CHENNAI - INTERNAL TARIFF REFERENCE (DO NOT DUMP THIS WHOLE TABLE TO CUSTOMERS)
Helplines: +91 89395 39211 | +91 63819 39769 | +91 90923 03060
Website: https://kalidasstravels.in

1. CABS & SUVs:
${vehicleLines}

2. TEMPO TRAVELLER & FORCE URBANIA FLEET:
${tempoLines}

3. STATE BORDER PERMITS (Multi-day / Per-km):
${permitLines}
* 1-Day fixed tour packages (Tirupati, Pondicherry, Thiruvannamalai, Kanchipuram, Vellore, Chidambaram, Mahabalipuram) include highway tolls & State Entry Permits upfront (₹0 extra).

4. CHENNAI AIRPORT (MAA) TRANSFERS:
${airportZones}
* Ertiga: +₹250 over Sedan | Innova: +₹500 over Sedan | Zero waiting charges for flight delays.

5. ACTING DRIVERS (Personal Car):
• City Duty: 4hr ₹750 | 8hr ₹1,200 (Extra hr: ₹120)
${actingVehicles}
• One-Way Car Relocation: Pondicherry ₹1,900 | Bangalore ₹2,820 | Trichy ₹2,770 | Madurai ₹3,750 | Coimbatore ₹3,800`;
}

const WEBSITE_AND_PACKAGES = `VERIFIED WEBSITE PAGE LINKS:
- Tirupati Package: https://kalidasstravels.in/services/tirupati-package/
- Sabarimala Pilgrimage: https://kalidasstravels.in/services/sabarimala-trip/
- Pondicherry Tour: https://kalidasstravels.in/services/pondicherry-one-day-trip/
- Rameswaram 2-Day Yatra: https://kalidasstravels.in/services/rameswaram-2-days/
- Tiruchendur Temple Tour: https://kalidasstravels.in/services/tiruchendur-temple-tour/
- Thiruvannamalai Girivalam: https://kalidasstravels.in/services/thiruvannamalai-girivalam-trip/
- Kanchipuram Temple Trip: https://kalidasstravels.in/services/kanchipuram-temple-trip/
- Chidambaram Temple Trip: https://kalidasstravels.in/services/chidambaram-temple-trip/
- Navagraha Tour: https://kalidasstravels.in/services/navagraha-tour/
- Vellore Golden Temple: https://kalidasstravels.in/services/vellore-golden-temple/
- Chennai Local / Sightseeing: https://kalidasstravels.in/services/local-hourly-cabs/
- Chennai Airport Taxi: https://kalidasstravels.in/services/chennai-airport-taxi/
- Tempo Traveller & Urbania: https://kalidasstravels.in/services/tempo-traveller-rental-chennai/
- Outstation Cabs: https://kalidasstravels.in/services/outstation-cabs/
- Acting Drivers: https://kalidasstravels.in/services/acting-drivers/
- Corporate Mobility: https://kalidasstravels.in/services/corporate/
- Fare Calculator: https://kalidasstravels.in/calculator/
- Full Tariff Card: https://kalidasstravels.in/tariff/

FIXED TOUR PACKAGES (1-Day packages include tolls & State Permits upfront — ₹0 extra):
- Tirupati:
  • 1-Day: Sedan ₹6,000 | Ertiga ₹7,500 | Innova ₹8,500 | Crysta ₹10,000 | Tempo 12S ₹12,500
  • 2-Day: Sedan ₹9,500 | Ertiga ₹11,500 | Innova ₹12,500 | Crysta ₹16,000 | Tempo 12S ₹19,500
  • 3-Day: Sedan ₹13,200 | Ertiga ₹15,800 | Innova ₹17,500 | Crysta ₹22,500 | Tempo 12S ₹27,000
  • 4-Day: Sedan ₹16,700 | Ertiga ₹19,800 | Innova ₹21,500 | Crysta ₹28,500 | Tempo 12S ₹34,000
  • 5-Day: Sedan ₹20,200 | Ertiga ₹23,800 | Innova ₹25,500 | Crysta ₹34,500 | Tempo 12S ₹41,000
- Pondicherry: 1-Day (Sedan ₹4,500-₹5,000 | Ertiga ₹5,800-₹6,200 | Innova ₹7,000), 2-Day (Sedan ₹7,500 | Ertiga ₹9,200)
- Thiruvannamalai Girivalam: 1-Day (Sedan ₹6,500 | Ertiga ₹7,900 | Innova ₹9,300), 2-Day (Sedan ₹8,900 | Ertiga ₹10,900)
- Kanchipuram: 1-Day (Sedan ₹3,800 | Ertiga ₹4,800 | Innova ₹5,800)
- Chidambaram & Pichavaram: 1-Day (Sedan ₹7,400 | Ertiga ₹9,200 | Innova ₹11,000), 2-Day (Sedan ₹9,800 | Ertiga ₹12,000)
- Navagraha (Kumbakonam): 2-Day (Sedan ₹14,500 | Ertiga ₹18,500 | Innova ₹22,500), 3-Day (Sedan ₹19,500 | Ertiga ₹24,500)
- Rameswaram & Dhanushkodi: 2-Day (Sedan ₹18,500 | Ertiga ₹23,500 | Innova ₹27,500), 3-Day (Sedan ₹24,500 | Ertiga ₹30,500)
- Tiruchendur & Nava Tirupathi: 2-Day Express (Sedan ₹19,500 | Ertiga ₹23,500 | Innova ₹26,500 | Crysta ₹31,500 | Tempo ₹37,000), 3-Day (Sedan ₹23,000 | Ertiga ₹27,500 | Innova ₹31,000), 4-Day (Sedan ₹26,500 | Innova ₹35,500)

BOOKING & REFUND POLICY:
- Booking Advance: ₹500 to lock any cab (₹2,000 for Tempo/Urbania), 100% deducted from final bill.
- Balance: Paid directly to chauffeur at trip end.
- Cancellation: 100% full refund if cancelled 6 hours before trip start.`;

const WHATSAPP_SYSTEM_PROMPT = `You are a smart, consultative WhatsApp Travel Advisor for Kalidass Travels, Chennai.
You are NOT a tariff-sheet printer. Act like an experienced human travel consultant: qualify first, then give ONE crisp, exact quotation.

CRITICAL OUTPUT FORMAT:
Always return valid JSON matching this exact schema:
{
  "replyText": "string (MAX 8 short lines, plain WhatsApp text, NO # headers, NO | tables, NO ! after phone numbers)",
  "interactive": {
    "type": "buttons" | "list",
    "buttonLabel": "string (ONLY for list, max 20 chars, e.g. 'Select Vehicle')",
    "options": [
      { "id": "short_id", "title": "max 20 chars for buttons / max 24 chars for list", "description": "optional short rate/seat hint, max 60 chars" }
    ]
  } | null,
  "leadStatus": "browsing" | "quoted" | "hot_lead",
  "leadSummary": "optional 1-line summary when leadStatus is quoted or hot_lead"
}

CONSULTATIVE CONVERSATION RULES:
1. GREETINGS ("hi", "hello", "vanakkam"):
   - replyText: 2 warm lines ("Vanakkam! Welcome to Kalidass Travels, Chennai. How can we help with your trip today?")
   - interactive: 3 buttons:
     • Outstation / Temple
     • Airport / Local Cab
     • Acting Driver

2. QUALIFY BEFORE QUOTING (BROKEN OR PARTIAL QUERIES WITHOUT VEHICLE/PAX):
   - If the customer asks for a trip WITHOUT stating passengers or vehicle (e.g. "chennai to kanyakumari round trip 5 days" or "tirupati" or "pondy 2 days"):
   - NEVER dump all 5 vehicles' per-km rates, bata, and permits in text!
   - replyText: 2 short warm lines acknowledging the trip and asking how many passengers / which vehicle they prefer.
   - interactive: "list" with buttonLabel "Select Vehicle" and options:
     • Swift Dzire / Etios (4+1 AC Sedan)
     • Maruti Ertiga (6+1 AC SUV)
     • Toyota Innova (7+1 AC)
     • Innova Crysta (7+1 VIP)
     • Tempo / Urbania (12-26 Seats)
   - If they specifically said "tempo" or "van" without seat count, send interactive "list" with buttonLabel "Select Tempo Size" and options: 12-Seater Tempo, 14-Seater Tempo, 17-Seater Tempo, 20-Seater Tempo, 26-Seater Mini Bus, Force Urbania VIP.

3. SINGLE-VEHICLE EXACT QUOTATION (ONCE VEHICLE IS KNOWN):
   - Quote ONLY the vehicle they selected/asked for—NEVER suggest or list other vehicles.
   - Show an itemized, easy-to-read estimate in MAX 7–8 lines:
     • Route & Vehicle heading
     • Estimated km × rate/km = Base Fare (or Fixed Package Fare)
     • Driver Bata (days × ₹bata)
     • State Permit (₹amount)
     • Estimated Total: ₹total
     • Tolls and parking are extra as per actual receipt. (unless 1-day fixed tour where tolls/permits are included)
     • 1 short question: "Any en-route stops (like Madurai/Rameswaram), and what is your travel date?"
     • Relevant https://kalidasstravels.in/.../ link.
   - Set leadStatus: "quoted".

4. BARGAINING / DISCOUNT REQUESTS:
   - Hold firm on official rates (no hidden charges, police-verified chauffeurs, ₹500 advance with 100% refund 6 hrs prior).
   - Invite them to speak with our team on +91 89395 39211, +91 63819 39769, or +91 90923 03060 for multi-day/group plans.
   - Do NOT put "!" after any phone number.

5. BOOKING CONFIRMATION / CALLBACK ("book", "confirm", "call me", or gave Date + Pickup):
   - Set leadStatus: "hot_lead" and fill leadSummary (e.g. "Chennai-Kanyakumari 5d Innova | Nov 25 | Adyar").
   - State ₹500 advance (₹2,000 for Tempo), 100% deducted from final bill, 100% refund 6 hrs before start.
   - Ask only for any missing item (Name, Pickup Address, Travel Date/Time).
   - End cleanly with: Dispatch & Booking: +91 89395 39211 | +91 63819 39769 | +91 90923 03060

6. TONE & LANGUAGE:
   - Warm South Indian hospitality ("Vanakkam!").
   - Simple 4th-grade English, or Tamil/Tanglish if the customer writes or speaks in Tamil/Tanglish.
   - STRICTLY max 8 lines in replyText so it NEVER hits WhatsApp's "Read more" fold.

${WEBSITE_AND_PACKAGES}

${buildTariffSummary()}`;

function trackSeenMessage(messageId: string): boolean {
  if (processedMessageIds.has(messageId)) return false;
  if (processedMessageIds.size >= MAX_SEEN_IDS) {
    const oldest = processedMessageIds.values().next().value;
    if (oldest) processedMessageIds.delete(oldest);
  }
  processedMessageIds.add(messageId);
  return true;
}

function appendCsvRow(filename: string, header: string, cols: string[]) {
  try {
    const logPath = path.resolve(process.cwd(), 'data', filename);
    if (!fs.existsSync(path.dirname(logPath))) {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
    }
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, header + '\n', 'utf8');
    }
    const esc = (s: string) => `"${String(s).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
    fs.appendFileSync(logPath, cols.map(esc).join(',') + '\n', 'utf8');
  } catch (_) {}
}

function sanitizeWhatsAppReply(raw: string): string {
  return cleanWhatsAppText(raw).replace(/(\+91[\s-]?\d{5}[\s-]?\d{5})\s*[!.,]+(?=\s|$)/g, '$1');
}

async function postGraphMessage(payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const { accessToken, phoneNumberId } = getWhatsAppConfig();
  if (!accessToken || !phoneNumberId) {
    return { ok: false, error: 'Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID' };
  }

  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return { ok: false, error: `Graph API ${res.status}: ${errText}` };
  }
  return { ok: true };
}

export async function sendWhatsAppTextMessage(to: string, text: string): Promise<{ ok: boolean; error?: string }> {
  return postGraphMessage({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text.slice(0, 4096) },
  });
}

export async function sendWhatsAppInteractiveButtons(
  to: string,
  bodyText: string,
  options: InteractiveOption[]
): Promise<{ ok: boolean; error?: string }> {
  const buttons = options.slice(0, 3).map((opt, idx) => ({
    type: 'reply',
    reply: {
      id: (opt.id || `btn_${idx + 1}`).slice(0, 256),
      title: opt.title.slice(0, 20),
    },
  }));

  return postGraphMessage({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText.slice(0, 1024) },
      action: { buttons },
    },
  });
}

export async function sendWhatsAppInteractiveList(
  to: string,
  bodyText: string,
  buttonLabel: string,
  options: InteractiveOption[]
): Promise<{ ok: boolean; error?: string }> {
  const rows = options.slice(0, 10).map((opt, idx) => ({
    id: (opt.id || `opt_${idx + 1}`).slice(0, 200),
    title: opt.title.slice(0, 24),
    ...(opt.description ? { description: opt.description.slice(0, 72) } : {}),
  }));

  return postGraphMessage({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText.slice(0, 1024) },
      action: {
        button: (buttonLabel || 'Select Option').slice(0, 20),
        sections: [
          {
            title: 'Options',
            rows,
          },
        ],
      },
    },
  });
}

export async function markWhatsAppMessageRead(messageId: string): Promise<void> {
  const { accessToken, phoneNumberId } = getWhatsAppConfig();
  if (!accessToken || !phoneNumberId) return;

  try {
    await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });
  } catch (_) {}
}

export async function downloadWhatsAppMedia(mediaId: string): Promise<{ base64: string; mimeType: string } | null> {
  const { accessToken } = getWhatsAppConfig();
  if (!accessToken || !mediaId) return null;

  try {
    const metaRes = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!metaRes.ok) return null;
    const meta = (await metaRes.json()) as { url?: string; mime_type?: string };
    if (!meta.url) return null;

    const fileRes = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!fileRes.ok) return null;

    const buf = Buffer.from(await fileRes.arrayBuffer());
    const cleanMime = (meta.mime_type || 'audio/ogg').split(';')[0].trim();
    return { base64: buf.toString('base64'), mimeType: cleanMime };
  } catch (_) {
    return null;
  }
}

async function generateBotAction(
  history: ChatMessage[],
  geminiApiKey?: string,
  audioAttachment?: { base64: string; mimeType: string } | null
): Promise<{ action: BotAction; source: string }> {
  if (geminiApiKey) {
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest'];
    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
        const contents = history.map((m, idx) => {
          const isLastUser = idx === history.length - 1 && m.role === 'user';
          const parts: any[] = [{ text: m.content }];
          if (isLastUser && audioAttachment) {
            parts.push({
              inlineData: {
                mimeType: audioAttachment.mimeType,
                data: audioAttachment.base64,
              },
            });
          }
          return {
            role: m.role === 'user' ? 'user' : 'model',
            parts,
          };
        });

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: WHATSAPP_SYSTEM_PROMPT }] },
            contents,
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            try {
              const parsed = JSON.parse(rawText) as BotAction;
              if (parsed?.replyText) {
                parsed.replyText = sanitizeWhatsAppReply(parsed.replyText);
                return { action: parsed, source: `gemini:${modelName}` };
              }
            } catch {
              return {
                action: { replyText: sanitizeWhatsAppReply(rawText), interactive: null },
                source: `gemini:${modelName}`,
              };
            }
          }
        } else {
          console.error('[Gemini API error]', modelName, res.status, await res.text().catch(() => ''));
        }
      } catch (err) {
        console.error('[Gemini fetch error]', modelName, err);
      }
    }
  }

  const { reply, source } = processAiConciergeQuery(history, null);
  return {
    action: { replyText: sanitizeWhatsAppReply(reply), interactive: null },
    source: source || 'concierge_engine',
  };
}

export async function handleIncomingWhatsAppMessage(params: {
  messageId: string;
  from: string;
  text: string;
  audioMediaId?: string;
}): Promise<void> {
  const { messageId, from, text, audioMediaId } = params;
  if (!trackSeenMessage(messageId)) return;

  await markWhatsAppMessageRead(messageId);

  let audioAttachment: { base64: string; mimeType: string } | null = null;
  let userContent = text;
  if (audioMediaId) {
    audioAttachment = await downloadWhatsAppMedia(audioMediaId);
    if (!audioAttachment) {
      await sendWhatsAppTextMessage(
        from,
        'Vanakkam! Could not load your voice note. Please type your trip details or call +91 89395 39211'
      );
      return;
    }
    userContent = text || '[Customer sent a WhatsApp voice note in Tamil/English. Listen carefully and reply to their travel request.]';
  }

  const history = conversationHistories.get(from) || [];
  history.push({ role: 'user', content: userContent });
  const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);

  const { geminiApiKey, alertNumbers } = getWhatsAppConfig();
  const { action, source } = await generateBotAction(trimmedHistory, geminiApiKey, audioAttachment);

  trimmedHistory.push({ role: 'assistant', content: action.replyText });
  conversationHistories.set(from, trimmedHistory.slice(-MAX_HISTORY_TURNS));

  let sendResult: { ok: boolean; error?: string };
  if (action.interactive && Array.isArray(action.interactive.options) && action.interactive.options.length > 0) {
    if (action.interactive.type === 'buttons' && action.interactive.options.length <= 3) {
      sendResult = await sendWhatsAppInteractiveButtons(from, action.replyText, action.interactive.options);
    } else {
      sendResult = await sendWhatsAppInteractiveList(
        from,
        action.replyText,
        action.interactive.buttonLabel || 'Select Option',
        action.interactive.options
      );
    }
    if (!sendResult.ok) {
      console.error('[WhatsApp Cloud API] Interactive send failed, falling back to text:', sendResult.error);
      sendResult = await sendWhatsAppTextMessage(from, action.replyText);
    }
  } else {
    sendResult = await sendWhatsAppTextMessage(from, action.replyText);
  }

  if (!sendResult.ok) {
    console.error('[WhatsApp Cloud API] Failed to send reply:', sendResult.error);
  }

  const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const interactiveNote = action.interactive ? ` [${action.interactive.type}: ${action.interactive.options.map((o) => o.title).join(', ')}]` : '';
  appendCsvRow('whatsapp_cloud_log.csv', 'Timestamp,Phone,UserMessage,BotReply,Source', [
    ts,
    from,
    audioMediaId ? `[VOICE NOTE] ${userContent}` : userContent,
    action.replyText + interactiveNote,
    source,
  ]);

  const isHotLead = action.leadStatus === 'hot_lead' || /\b(book|confirm|reserve|advance|lock)\b/i.test(userContent);
  if (isHotLead) {
    appendCsvRow('whatsapp_booking_leads.csv', 'Timestamp,Phone,CustomerMessage,BotReply', [
      ts,
      from,
      userContent,
      action.leadSummary || action.replyText,
    ]);

    const alertText =
      `NEW KALIDASS BOOKING LEAD\n` +
      `Customer: +${from}\n` +
      `Request: ${action.leadSummary || userContent}\n` +
      `Time: ${ts}`;

    for (const num of alertNumbers) {
      if (num && num !== from) {
        await sendWhatsAppTextMessage(num, alertText);
      }
    }
  }
}

export async function dispatchWebhookPayload(payload: any): Promise<void> {
  if (payload?.object !== 'whatsapp_business_account') return;

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      for (const msg of change?.value?.messages || []) {
        const from = msg?.from;
        const messageId = msg?.id;
        if (!from || !messageId) continue;

        let text = '';
        let audioMediaId: string | undefined;

        if (msg.type === 'text') {
          text = msg.text?.body?.trim() || '';
        } else if (msg.type === 'interactive') {
          text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
        } else if (msg.type === 'button') {
          text = msg.button?.text || '';
        } else if (msg.type === 'audio' && msg.audio?.id) {
          audioMediaId = msg.audio.id;
        } else if (msg.type === 'location' && msg.location) {
          const loc = msg.location;
          const label = [loc.name, loc.address].filter(Boolean).join(', ');
          text = label
            ? `My pickup location is: ${label} (GPS: ${loc.latitude}, ${loc.longitude})`
            : `My pickup GPS location is: ${loc.latitude}, ${loc.longitude}`;
        }

        if (text || audioMediaId) {
          await handleIncomingWhatsAppMessage({ messageId, from, text, audioMediaId });
        } else {
          await sendWhatsAppTextMessage(
            from,
            'Vanakkam! Please send your trip details as a text or voice message, or call +91 89395 39211'
          );
        }
      }
    }
  }
}
