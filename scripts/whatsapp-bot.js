import { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage, jidNormalizedUser } from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'node:fs';
import path from 'node:path';
import { processWhatsAppMessage } from '../src/lib/whatsappBotEngine.js';

const SESSION_DIR = path.resolve(process.cwd(), 'data/whatsapp_session');
const STATUS_FILE = path.resolve(process.cwd(), 'data/whatsapp_status.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(STATUS_FILE))) {
  fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
}

function updateStatus(data) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
  } catch (_) {}
}

// Track sent messages to avoid any self-echo loops
const sentMessageIds = new Set();

async function startWhatsAppBot() {
  console.log('\n======================================================');
  console.log('🚀 KALIDASS TRAVELS — WHATSAPP OPERATIONS BOT');
  console.log('======================================================\n');

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Kalidass Travels Ops', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Scan this QR Code with WhatsApp (Linked Devices > Link a Device):\n');
      qrcodeTerminal.generate(qr, { small: true });

      try {
        const qrBase64 = await QRCode.toDataURL(qr);
        updateStatus({ status: 'waiting_for_qr', qr: qrBase64 });
      } catch (_) {
        updateStatus({ status: 'waiting_for_qr', rawQr: qr });
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`⚠️ Connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
      updateStatus({ status: 'disconnected', code: statusCode });

      if (shouldReconnect) {
        setTimeout(startWhatsAppBot, 3000);
      } else {
        console.log('🛑 Logged out. Delete data/whatsapp_session and scan QR again.');
      }
    } else if (connection === 'open') {
      const userPhone = sock.user?.id?.split(':')[0] || 'Linked Device';
      console.log(`\n✅ WHATSAPP BOT CONNECTED SUCCESSFULLY!`);
      console.log(`📱 Active on Account: +${userPhone}`);
      console.log(`🤖 Listening in your 'Message Yourself' chat and Dispatch groups.`);
      console.log(`💬 Try sending a message or voice note to yourself in WhatsApp!\n`);

      updateStatus({
        status: 'connected',
        phone: userPhone,
        name: sock.user?.name || 'Kalidass Travels Dispatch'
      });
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    // Process messages regardless of type ('notify' or 'append' for self-messages)
    for (const m of messages) {
      if (!m.message) continue;

      // Skip messages sent by this bot instance
      if (m.key?.id && sentMessageIds.has(m.key.id)) continue;

      const myRawId = sock.user?.id || '';
      const myJid = jidNormalizedUser(myRawId);
      const myRawLid = sock.user?.lid || '';
      const myLid = jidNormalizedUser(myRawLid);

      const rawRemoteJid = m.key.remoteJid || '';
      const remoteJid = jidNormalizedUser(rawRemoteJid);

      // Never respond to status stories
      if (rawRemoteJid === 'status@broadcast') continue;

      const isGroup = rawRemoteJid.endsWith('@g.us');

      // Check if this is 'Message Yourself' (matches either normal JID, LID, or fromMe in private chat)
      const isSelfChat = Boolean(
        (myJid && remoteJid === myJid) ||
        (myLid && remoteJid === myLid) ||
        (m.key.fromMe && !isGroup && rawRemoteJid.endsWith('@lid')) ||
        (m.key.fromMe && !isGroup && (rawRemoteJid === myRawId || remoteJid === myJid))
      );

      // Filter: Only process in 'Message Yourself' OR groups matching 'dispatch', 'kalidass', or 'ops'
      let isAllowedChat = false;

      if (isSelfChat) {
        isAllowedChat = true;
      } else if (isGroup) {
        try {
          const groupMeta = await sock.groupMetadata(rawRemoteJid).catch(() => null);
          const groupName = (groupMeta?.subject || '').toLowerCase();
          if (
            groupName.includes('kalidass') ||
            groupName.includes('dispatch') ||
            groupName.includes('ops') ||
            groupName.includes('operation') ||
            groupName.includes('trip')
          ) {
            isAllowedChat = true;
          }
        } catch (_) {}
      }

      if (!isAllowedChat) continue;

      // Extract message content safely
      const msgObj = m.message?.ephemeralMessage?.message || m.message?.viewOnceMessage?.message || m.message;
      let text = msgObj?.conversation ||
                 msgObj?.extendedTextMessage?.text ||
                 msgObj?.imageMessage?.caption ||
                 '';

      // Anti-loop safeguard: Ignore bot's own output messages
      if (
        text.includes('KALIDASS TRAVELS —') ||
        text.includes('KALIDASS TRAVELS -') ||
        text.includes('Office Helpline: 99406 29716') ||
        text.includes('24/7 Dispatch Helpline') ||
        text.includes('Kalidass AI Ops Desk is live') ||
        text.includes('Primary Helpline: +91 89395 39211') ||
        text.startsWith('⚠️ Could not read message') ||
        text.startsWith('⚠️ AI Service Error')
      ) {
        continue;
      }

      // Check for voice notes (audio messages)
      let audioBuffer = null;
      if (msgObj?.audioMessage) {
        try {
          audioBuffer = await downloadMediaMessage(m, 'buffer', {});
        } catch (err) {
          console.error('Error downloading voice message:', err);
        }
      }

      if (!text && !audioBuffer) continue;

      console.log(`\n📩 Inbound Ops Message (${isSelfChat ? 'Message Yourself' : rawRemoteJid}): "${text ? text.slice(0, 60).replace(/\n/g, ' ') + '...' : '[Voice Note]'}"`);

      try {
        // Show typing indicator in WhatsApp
        await sock.sendPresenceUpdate('composing', rawRemoteJid);

        const reply = await processWhatsAppMessage(text, audioBuffer, rawRemoteJid);

        let sent = null;
        try {
          sent = await sock.sendMessage(rawRemoteJid, { text: reply }, { quoted: m });
        } catch (_) {
          try {
            sent = await sock.sendMessage(rawRemoteJid, { text: reply });
          } catch (lidErr) {
            if (myJid) {
              sent = await sock.sendMessage(myJid, { text: reply });
            }
          }
        }

        if (sent?.key?.id) {
          sentMessageIds.add(sent.key.id);
          if (sentMessageIds.size > 1000) sentMessageIds.clear();
        }

        console.log(`✅ Replied successfully to WhatsApp!`);
      } catch (err) {
        console.error('Error processing WhatsApp message:', err);
      }
    }
  });
}

startWhatsAppBot().catch(err => {
  console.error('Fatal Bot Error:', err);
});
