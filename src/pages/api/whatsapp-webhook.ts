import type { APIRoute } from 'astro';
import {
  getWhatsAppConfig,
  handleIncomingWhatsAppMessage,
  sendWhatsAppTextMessage,
  verifyMetaSignature,
} from '../../lib/whatsappCloudApi';

export const prerender = false;

/**
 * GET /api/whatsapp-webhook
 * Meta WhatsApp Cloud API webhook verification handshake.
 */
export const GET: APIRoute = async ({ request, url, locals }) => {
  const rawSearch = (locals as Record<string, unknown>)?.rawSearch;
  const params = new URLSearchParams(
    typeof rawSearch === 'string' && rawSearch ? rawSearch : new URL(request.url).search
  );
  const mode = params.get('hub.mode') ?? url.searchParams.get('hub.mode');
  const token = params.get('hub.verify_token') ?? url.searchParams.get('hub.verify_token');
  const challenge = params.get('hub.challenge') ?? url.searchParams.get('hub.challenge');

  const { verifyToken } = getWhatsAppConfig();

  if (mode === 'subscribe' && verifyToken && token === verifyToken && challenge) {
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new Response('Forbidden', { status: 403 });
};

/**
 * POST /api/whatsapp-webhook
 * Receives incoming customer messages from Meta WhatsApp Cloud API.
 */
export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');
  const { appSecret } = getWhatsAppConfig();

  if (!verifyMetaSignature(rawBody, signature, appSecret)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  if (payload?.object !== 'whatsapp_business_account') {
    return new Response('Ignored', { status: 200 });
  }

  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const change of changes) {
      const messages = change?.value?.messages;
      if (!Array.isArray(messages)) continue;

      for (const msg of messages) {
        const from = msg?.from;
        const messageId = msg?.id;
        if (!from || !messageId) continue;

        let text = '';
        if (msg.type === 'text') {
          text = msg.text?.body?.trim() || '';
        } else if (msg.type === 'interactive') {
          text =
            msg.interactive?.button_reply?.title ||
            msg.interactive?.list_reply?.title ||
            '';
        } else if (msg.type === 'button') {
          text = msg.button?.text || '';
        }

        if (text) {
          await handleIncomingWhatsAppMessage({ messageId, from, text });
        } else {
          await sendWhatsAppTextMessage(
            from,
            'Vanakkam! Please send your trip details as a text message (Pickup, Drop, Date & Vehicle), or call our 24/7 Dispatch Desk at +91 89395 39211.'
          );
        }
      }
    }
  }

  return new Response('EVENT_RECEIVED', { status: 200 });
};
