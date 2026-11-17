import {
  WHATSAPP_SYSTEM_PROMPT,
  sanitizeWhatsAppReply,
  type BotAction,
  type InteractiveOption,
} from '../../src/lib/whatsappPrompts';

const GRAPH_API_VERSION = 'v21.0';
const MAX_HISTORY_TURNS = 10;
const MAX_SEEN_IDS = 1000;

// Warm-isolate deduplication and conversation memory
const processedMessageIds = new Set<string>();
const conversationHistories = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

interface Env {
  WHATSAPP_VERIFY_TOKEN?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_APP_SECRET?: string;
  WHATSAPP_ALERT_NUMBERS?: string;
  GEMINI_API_KEY?: string;
  GOOGLE_SHEET_WEBHOOK_URL?: string;
}

async function verifyMetaSignatureWeb(
  rawBody: string,
  signatureHeader: string | null,
  appSecret?: string
): Promise<boolean> {
  if (!appSecret) return true;
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  const hex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const expected = `sha256=${hex}`;

  if (expected.length !== signatureHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return diff === 0;
}

function trackSeenMessage(messageId: string): boolean {
  if (processedMessageIds.has(messageId)) return false;
  if (processedMessageIds.size >= MAX_SEEN_IDS) {
    const oldest = processedMessageIds.values().next().value;
    if (oldest) processedMessageIds.delete(oldest);
  }
  processedMessageIds.add(messageId);
  return true;
}

async function postGraphMessage(env: Env, payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return { ok: false, error: 'Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID' };
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return { ok: false, error: `Graph API ${res.status}: ${errText}` };
  }
  return { ok: true };
}

function sendText(env: Env, to: string, body: string) {
  return postGraphMessage(env, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: body.slice(0, 4096) },
  });
}

function sendButtons(env: Env, to: string, bodyText: string, options: InteractiveOption[]) {
  return postGraphMessage(env, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText.slice(0, 1024) },
      action: {
        buttons: options.slice(0, 3).map((opt, idx) => ({
          type: 'reply',
          reply: { id: (opt.id || `btn_${idx + 1}`).slice(0, 256), title: opt.title.slice(0, 20) },
        })),
      },
    },
  });
}

function sendList(env: Env, to: string, bodyText: string, buttonLabel: string, options: InteractiveOption[]) {
  return postGraphMessage(env, {
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
            rows: options.slice(0, 10).map((opt, idx) => ({
              id: (opt.id || `opt_${idx + 1}`).slice(0, 200),
              title: opt.title.slice(0, 24),
              ...(opt.description ? { description: opt.description.slice(0, 72) } : {}),
            })),
          },
        ],
      },
    },
  });
}

async function downloadMediaBase64(env: Env, mediaId: string): Promise<{ base64: string; mimeType: string } | null> {
  if (!env.WHATSAPP_ACCESS_TOKEN || !mediaId) return null;
  try {
    const metaRes = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`, {
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
    });
    if (!metaRes.ok) return null;
    const meta = (await metaRes.json()) as { url?: string; mime_type?: string };
    if (!meta.url) return null;

    const fileRes = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` },
    });
    if (!fileRes.ok) return null;

    const bytes = new Uint8Array(await fileRes.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const cleanMime = (meta.mime_type || 'audio/ogg').split(';')[0].trim();
    return { base64: btoa(binary), mimeType: cleanMime };
  } catch {
    return null;
  }
}

async function generateBotAction(
  env: Env,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  audioAttachment?: { base64: string; mimeType: string } | null
): Promise<BotAction> {
  if (env.GEMINI_API_KEY) {
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest'];
    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${env.GEMINI_API_KEY}`;
        const contents = history.map((m, idx) => {
          const isLastUser = idx === history.length - 1 && m.role === 'user';
          const parts: any[] = [{ text: m.content }];
          if (isLastUser && audioAttachment) {
            parts.push({
              inlineData: { mimeType: audioAttachment.mimeType, data: audioAttachment.base64 },
            });
          }
          return { role: m.role === 'user' ? 'user' : 'model', parts };
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
          const data = (await res.json()) as any;
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            try {
              const parsed = JSON.parse(rawText) as BotAction;
              if (parsed?.replyText) {
                parsed.replyText = sanitizeWhatsAppReply(parsed.replyText);
                return parsed;
              }
            } catch {
              return { replyText: sanitizeWhatsAppReply(rawText), interactive: null };
            }
          }
        }
      } catch {}
    }
  }

  return {
    replyText:
      'Vanakkam! Welcome to Kalidass Travels, Chennai. Please share your Pickup, Drop, Date & Vehicle, or call +91 89395 39211 | +91 63819 39769',
    interactive: null,
  };
}

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const params = new URL(context.request.url).searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && context.env.WHATSAPP_VERIFY_TOKEN && token === context.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!(await verifyMetaSignatureWeb(rawBody, signature, env.WHATSAPP_APP_SECRET))) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  if (payload?.object === 'whatsapp_business_account') {
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        for (const msg of change?.value?.messages || []) {
          const from = msg?.from;
          const messageId = msg?.id;
          if (!from || !messageId || !trackSeenMessage(messageId)) continue;

          // Mark message as read
          await postGraphMessage(env, {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
          });

          let text = '';
          let audioAttachment: { base64: string; mimeType: string } | null = null;

          if (msg.type === 'text') {
            text = msg.text?.body?.trim() || '';
          } else if (msg.type === 'interactive') {
            text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
          } else if (msg.type === 'button') {
            text = msg.button?.text || '';
          } else if (msg.type === 'audio' && msg.audio?.id) {
            audioAttachment = await downloadMediaBase64(env, msg.audio.id);
            text = '[Customer sent a WhatsApp voice note in Tamil/English. Listen carefully and reply to their travel request.]';
          } else if (msg.type === 'location' && msg.location) {
            const loc = msg.location;
            const label = [loc.name, loc.address].filter(Boolean).join(', ');
            text = label
              ? `My pickup location is: ${label} (GPS: ${loc.latitude}, ${loc.longitude})`
              : `My pickup GPS location is: ${loc.latitude}, ${loc.longitude}`;
          }

          if (!text && !audioAttachment) {
            await sendText(
              env,
              from,
              'Vanakkam! Please send your trip details as a text or voice message, or call +91 89395 39211'
            );
            continue;
          }

          const history = conversationHistories.get(from) || [];
          history.push({ role: 'user', content: text });
          const trimmed = history.slice(-MAX_HISTORY_TURNS);

          const action = await generateBotAction(env, trimmed, audioAttachment);
          trimmed.push({ role: 'assistant', content: action.replyText });
          conversationHistories.set(from, trimmed.slice(-MAX_HISTORY_TURNS));

          let res: { ok: boolean; error?: string };
          if (action.interactive && Array.isArray(action.interactive.options) && action.interactive.options.length > 0) {
            if (action.interactive.type === 'buttons' && action.interactive.options.length <= 3) {
              res = await sendButtons(env, from, action.replyText, action.interactive.options);
            } else {
              res = await sendList(
                env,
                from,
                action.replyText,
                action.interactive.buttonLabel || 'Select Option',
                action.interactive.options
              );
            }
            if (!res.ok) {
              res = await sendText(env, from, action.replyText);
            }
          } else {
            res = await sendText(env, from, action.replyText);
          }

          const isHotLead = action.leadStatus === 'hot_lead' || /\b(book|confirm|reserve|advance|lock)\b/i.test(text);
          if (isHotLead) {
            const alertNumbers = (env.WHATSAPP_ALERT_NUMBERS || '')
              .split(',')
              .map((s) => s.replace(/[^0-9]/g, ''))
              .filter((s) => s.length >= 10);

            const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            const alertText =
              `NEW KALIDASS BOOKING LEAD\n` +
              `Customer: +${from}\n` +
              `Request: ${action.leadSummary || text}\n` +
              `Time: ${ts}`;

            for (const num of alertNumbers) {
              if (num && num !== from) {
                await sendText(env, num, alertText);
              }
            }

            if (env.GOOGLE_SHEET_WEBHOOK_URL) {
              try {
                await fetch(env.GOOGLE_SHEET_WEBHOOK_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    source: 'WhatsApp Cloud AI',
                    phone: from,
                    message: text,
                    summary: action.leadSummary || action.replyText,
                    timestamp: ts,
                  }),
                });
              } catch {}
            }
          }
        }
      }
    }
  }

  return new Response('EVENT_RECEIVED', { status: 200 });
}
