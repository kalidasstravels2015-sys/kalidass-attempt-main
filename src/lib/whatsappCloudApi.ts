import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import tariffConfig from '../data/tariff_config.json' with { type: 'json' };
import { processAiConciergeQuery, type ChatMessage } from './aiConciergeEngine';
import { cleanWhatsAppText } from '../utils/cleanWhatsAppText';

const GRAPH_API_VERSION = 'v21.0';
const MAX_HISTORY_TURNS = 10;
const MAX_SEEN_IDS = 1000;

// In-memory deduplication & rolling conversation memory per customer phone
const processedMessageIds = new Set<string>();
const conversationHistories = new Map<string, ChatMessage[]>();

function readEnvVar(name: string): string | undefined {
  const fromImportMeta = (import.meta as any)?.env?.[name];
  if (fromImportMeta) return String(fromImportMeta).trim();
  if (process.env[name]) return String(process.env[name]).trim();

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = fs.readFileSync(envPath, 'utf8').match(new RegExp(`^${escaped}\\s*=\\s*(.+)$`, 'm'));
      if (match) return match[1].replace(/^["']|["']$/g, '').trim();
    }
  } catch (_) {}
  return undefined;
}

export function getWhatsAppConfig() {
  return {
    verifyToken: readEnvVar('WHATSAPP_VERIFY_TOKEN'),
    accessToken: readEnvVar('WHATSAPP_ACCESS_TOKEN'),
    phoneNumberId: readEnvVar('WHATSAPP_PHONE_NUMBER_ID'),
    appSecret: readEnvVar('WHATSAPP_APP_SECRET'),
    geminiApiKey: readEnvVar('GEMINI_API_KEY'),
  };
}

/**
 * Verifies Meta's X-Hub-Signature-256 header when WHATSAPP_APP_SECRET is configured.
 */
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
  const vehicleLines = Object.entries((tariffConfig as any).vehicles || {})
    .map(([name, v]: [string, any]) => {
      return `• ${name} (${v.seats} AC, ${v.category}): Round-trip ₹${v.round_trip_rate}/km (Min ${v.min_km_per_day} km/day) | One-way ₹${v.one_way_rate}/km (Min ${v.min_drop_km} km) | Bata ₹${v.driver_bata}/day | 4hr/40km ₹${v.local_4hr_pkg} | 8hr/80km ₹${v.local_8hr_pkg}`;
    })
    .join('\n');

  const permitLines = Object.entries((tariffConfig as any).state_permits || {})
    .map(([code, p]: [string, any]) => {
      const r = p.rates || {};
      return `• ${p.stateName} (${code}): Sedan ₹${r.sedan} | SUV/Ertiga ₹${r.suv} | Innova/Crysta ₹${r.muv} | Tempo ₹${r.tempo} | Coach ₹${r.coach}`;
    })
    .join('\n');

  return `KALIDASS TRAVELS CHENNAI - OFFICIAL TARIFF
Helplines: +91 89395 39211 | +91 90923 03060 | Website: https://kalidasstravels.in

FLEET RATES:
${vehicleLines}

STATE BORDER PERMITS (Multi-day / Per-km):
${permitLines}
* 1-Day fixed tour packages (Tirupati, Pondicherry, Thiruvannamalai, Kanchipuram, Vellore, Chidambaram, Mahabalipuram) include tolls & state permit upfront.`;
}

const WEBSITE_PAGES = `VERIFIED WEBSITE PAGE LINKS (Include the single most relevant link at the end of your reply):
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
- Fare Calculator: https://kalidasstravels.in/calculator/
- Full Tariff Card: https://kalidasstravels.in/tariff/

FIXED TOUR PACKAGES (1-Day packages include highway tolls & State Entry Permits upfront — ₹0 extra):
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

ACTING DRIVERS (Personal Car):
- City Duty: 4hr ₹750 | 8hr ₹1,200 (Extra hr: ₹120)`;

const WHATSAPP_SYSTEM_PROMPT = `You are the official 24/7 WhatsApp AI Travel Assistant for Kalidass Travels, Chennai.
Reply in simple, clear, friendly English (or Tamil/Tanglish if the customer writes in Tamil/Tanglish).

STRICT REPLY & FORMATTING RULES FOR WHATSAPP:
1. Reply ONLY to what the customer asked.
2. SPECIFIC VEHICLE vs. CATEGORY RULE:
   - If the customer asks for a SPECIFIC vehicle (e.g. "Innova", "14 seater tempo", "Dzire"), quote ONLY that vehicle. NEVER suggest or upsell other vehicles.
   - If the customer asks for a broad CATEGORY without a seat count (e.g. "tempo", "tempo traveller", "van"), list ALL available Tempo & Urbania options (12-Seater, 14-Seater, 17-Seater, 20-Seater, 26-Seater, Force Urbania) with their exact rates, each on its own line.
3. ROW-BY-ROW CLARITY (NEVER TRUNCATE):
   - Always list rates cleanly row by row.
   - When listing multiple vehicles (like all Tempo & Urbania options), put each vehicle on its own bullet row:
     • [Vehicle Name]: ₹[rate]/km | Min [min] km/day | Bata ₹[bata]/day
   - Put every permit, toll/parking rule, and note on its own separate bullet row:
     • Kerala State Permit: ₹[amount]
     • Tolls and parking are extra as per actual receipt.
   - NEVER combine two separate rules in parentheses on the same line.
4. FORMATTING:
   - NEVER use markdown headers (#, ##, ###) or markdown tables (| col |).
   - Use plain single-line math (e.g. 300 km × ₹20 = ₹6,000 + ₹600 bata = ₹6,600).
   - Never invent rates. Only quote verified rates from the tariff below.
   - Do NOT skip any Tempo or Urbania vehicle when asked for "tempo". List every Tempo & Urbania from the fleet list below.
5. WEBSITE LINK & PHONE NUMBER:
   - Always include the single most relevant verified website page link from the list below so the customer can view details or book online.
   - Always end with our Dispatch Desk number (+91 89395 39211) WITHOUT any exclamation mark (!) or punctuation attached to the phone number.

${WEBSITE_PAGES}

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

function appendWhatsAppLog(phone: string, userText: string, replyText: string, source: string) {
  try {
    const logPath = path.resolve(process.cwd(), 'data/whatsapp_cloud_log.csv');
    if (!fs.existsSync(path.dirname(logPath))) {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
    }
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, 'Timestamp,Phone,UserMessage,BotReply,Source\n', 'utf8');
    }
    const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const esc = (s: string) => `"${String(s).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
    fs.appendFileSync(logPath, `${esc(ts)},${esc(phone)},${esc(userText)},${esc(replyText)},${esc(source)}\n`, 'utf8');
  } catch (_) {}
}

export async function sendWhatsAppTextMessage(to: string, text: string): Promise<{ ok: boolean; error?: string }> {
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
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text.slice(0, 4096) },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return { ok: false, error: `Graph API ${res.status}: ${errText}` };
  }
  return { ok: true };
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

function sanitizeWhatsAppReply(raw: string): string {
  return cleanWhatsAppText(raw).replace(/(\+91[\s-]?\d{5}[\s-]?\d{5})\s*!/g, '$1');
}

async function generateWhatsAppReply(history: ChatMessage[], geminiApiKey?: string): Promise<{ reply: string; source: string }> {
  if (geminiApiKey) {
    const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest'];
    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: WHATSAPP_SYSTEM_PROMPT }] },
            contents: history.map((m) => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.content }],
            })),
            generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return { reply: sanitizeWhatsAppReply(text), source: `gemini:${modelName}` };
          }
        }
      } catch (_) {}
    }
  }

  // Deterministic fallback using the grounded Kalidass concierge engine
  const { reply, source } = processAiConciergeQuery(history, null);
  return { reply: sanitizeWhatsAppReply(reply), source: source || 'concierge_engine' };
}

export async function handleIncomingWhatsAppMessage(params: {
  messageId: string;
  from: string;
  text: string;
}): Promise<void> {
  const { messageId, from, text } = params;
  if (!trackSeenMessage(messageId)) return;

  await markWhatsAppMessageRead(messageId);

  const history = conversationHistories.get(from) || [];
  history.push({ role: 'user', content: text });
  const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);

  const { geminiApiKey } = getWhatsAppConfig();
  const { reply, source } = await generateWhatsAppReply(trimmedHistory, geminiApiKey);

  trimmedHistory.push({ role: 'assistant', content: reply });
  conversationHistories.set(from, trimmedHistory.slice(-MAX_HISTORY_TURNS));

  const sendResult = await sendWhatsAppTextMessage(from, reply);
  if (!sendResult.ok) {
    console.error('[WhatsApp Cloud API] Failed to send reply:', sendResult.error);
  }
  appendWhatsAppLog(from, text, reply, source);
}
