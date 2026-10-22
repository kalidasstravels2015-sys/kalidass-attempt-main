import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import compress from '@playform/compress';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Trigger Vite dependency re-optimization (v4)
export default defineConfig({
  site: 'https://kalidasstravels.in',
  trailingSlash: 'always',
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  redirects: {
    '/outstation': '/services/outstation-cabs/',
    '/services/outstation': '/services/outstation-cabs/',
    '/services/popular-destinations': '/services/outstation-cabs/',
    '/services/weekend-packages': '/services/outstation-cabs/',
    '/services/tours/weekend-packages': '/services/outstation-cabs/',
    '/services/tours': '/services/tours/temple-tours/',
    '/services/temple-tours': '/services/tours/temple-tours/',
    '/services/chennai-airport-taxi-transfers': '/services/chennai-airport-taxi/',
    '/services/airport-transfer': '/services/chennai-airport-taxi/',
    '/services/chennai-to-tirupati-one-day-package': '/services/tirupati-package/',
    '/services/chennai-to-pondicherry-taxi': '/services/pondicherry-one-day-trip/',
    '/services/chennai-to-mahabalipuram-taxi': '/services/mahabalipuram-ecr-temple-route/',
    '/smart-travel-solution': '/',
    '/driver-cards': '/drivers/',
    '/ta': '/',
  },
  integrations: [
    tailwind(),
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/driver-cards/') &&
        !page.includes('/404') &&
        !page.includes('/og/') &&
        !page.includes('/admin') &&
        !page.includes('/ops') &&
        !page.includes('/trip') &&
        !page.endsWith('/services/popular-destinations/') &&
        !page.endsWith('/services/temple-tours/') &&
        !page.endsWith('/services/weekend-packages/') &&
        !page.endsWith('/services/tours/weekend-packages/') &&
        !page.endsWith('/services/tours/') &&
        !page.endsWith('/services/chennai-airport-taxi-transfers/') &&
        !page.endsWith('/services/chennai-to-tirupati-one-day-package/') &&
        !page.endsWith('/services/chennai-to-pondicherry-taxi/') &&
        !page.endsWith('/services/chennai-to-mahabalipuram-taxi/'),
      serialize(item) {
        const url = item.url;
        item.lastmod = new Date();
        if (url === 'https://kalidasstravels.in/') {
          item.changefreq = 'daily';
          item.priority = 1.0;
        } else if (
          url.includes('/services/chennai-airport-taxi/') ||
          url.includes('/services/outstation-cabs/') ||
          url.includes('/services/tirupati-package/') ||
          url.includes('/tariff/')
        ) {
          item.changefreq = 'daily';
          item.priority = 0.9;
        } else if (
          url.includes('/services/tours/') ||
          url.includes('/services/navagraha-tour/') ||
          url.includes('/services/thiruvannamalai-girivalam-trip/') ||
          url.includes('/services/sabarimala-trip/') ||
          url.includes('/services/rameswaram-2-days/') ||
          url.includes('/services/acting-drivers/') ||
          url.includes('/services/corporate/') ||
          url.includes('/careers/')
        ) {
          item.changefreq = 'weekly';
          item.priority = 0.85;
        } else if (
          url.includes('/services/') ||
          url.includes('/fleet/') ||
          url.includes('/calculator/') ||
          url.includes('/sitemap/')
        ) {
          item.changefreq = 'weekly';
          item.priority = 0.8;
        } else if (url.includes('/drivers/')) {
          item.changefreq = 'monthly';
          item.priority = 0.7;
        } else {
          item.changefreq = 'monthly';
          item.priority = 0.5;
        }
        return item;
      },
    }),
    {
      name: 'sitemap-sync',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          const destDir = fileURLToPath(dir);
          const sitemapIndex = path.join(destDir, 'sitemap-index.xml');
          const sitemapTarget = path.join(destDir, 'sitemap.xml');
          if (fs.existsSync(sitemapIndex)) {
            fs.copyFileSync(sitemapIndex, sitemapTarget);
          }
        },
      },
    },
    compress({
      CSS: true,
      HTML: false,
      JavaScript: false,
    }),
  ],
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react', '@astrojs/react/client.js']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
          },
        },
      },
    },
    plugins: [
      {
        name: 'utf8-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url?.split('?')[0] || '';

            if (req.method === 'POST' && (url === '/api/ai-chat' || url === '/api/ai-chat/')) {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const data = JSON.parse(body || '{}');
                  const { processAiConciergeQuery } = await import('./src/lib/aiConciergeEngine.ts?t=' + Date.now());
                  const messages = data.messages || [];
                  const pageContext = data.pageContext || null;
                  let result = null;

                  let apiKey = process.env.GEMINI_API_KEY;
                  if (!apiKey) {
                    try {
                      const envPath = path.resolve(process.cwd(), '.env');
                      if (fs.existsSync(envPath)) {
                        const m = fs.readFileSync(envPath, 'utf8').match(/GEMINI_API_KEY\s*=\s*(.+)/);
                        if (m) apiKey = m[1].trim();
                      }
                    } catch (_) {}
                  }

                  if (apiKey) {
                    try {
                      let promptCtx = '';
                      if (pageContext && pageContext.totalFare) {
                        promptCtx = `\nACTIVE ON-SCREEN BOOKING SELECTION: Destination: ${pageContext.destination || ''}, Vehicle: ${pageContext.vehicleName || ''}, Schedule: ${pageContext.pickupFormatted || ''} to ${pageContext.returnFormatted || ''}, Duration: ${pageContext.durationLabel || ''} (${pageContext.durationHours || 0} hrs, ${pageContext.durationSubText || ''}), Quoted Fare: ${pageContext.formattedFare || ''}, Pro-Rata: ${pageContext.isProRata ? 'YES' : 'NO'}. If customer asks 'for 2 days' or about price, explicitly clarify that their on-screen quote is pro-rata for ${pageContext.durationHours} hrs (saving them ₹${pageContext.savings || 1750} vs full 2-day package).`;
                      }

                      const systemPrompt = `You are the intelligent, warm, and highly capable 24/7 AI Travel & Fare Concierge ("Let me Help You") for Kalidass Travels, Chennai (Helpline & WhatsApp: +91 89395 39211).
Your mission is to assist customers naturally and conversationally, understanding their exact questions and providing 100% accurate quotes strictly following Kalidass Travels' rate card.

CONVERSATIONAL INTELLIGENCE GUIDELINES:
1. Speak naturally like an experienced, polite human travel advisor (like modern ChatGPT / Gemini).
2. MULTI-TURN CONTEXT AWARENESS:
   - When a user asks a short follow-up like "for 2 days", "what about ertiga?", "how much?", or "can we halt at vellore?", DO NOT just regurgitate a rigid, repetitive wall of bullet points!
   - Directly answer their specific follow-up in a natural, friendly tone, acknowledging what vehicle or trip they were previously discussing.
   - For example, if they previously asked for a Tirupati 1-day package and now ask "for 2 days", answer warmly: "For a relaxed 2-day Tirupati trip, our package rate is ₹9,500 for Swift Dzire (4 pax) and ₹11,500 for Maruti Ertiga (6 pax). This includes dedicated cab with chauffeur for both days, tolls, and driver bata. Would you like me to book this for you?"
3. MULTILINGUAL & NATURAL:
   - If the user writes in Tamil (தமிழ்), reply warmly in Tamil.
   - If the user writes in Tanglish (e.g. "2 days ku evlo aagum", "car booking iruka"), reply warmly in Tanglish / natural Tamil-English.
   - If in English, reply in polished, warm English.
4. HONEST, FIXED PRICING:
   - Mention our transparent policy: Only ₹500 advance to confirm and lock cab assignment (avoids last-minute cancellation). The remaining balance is paid directly after trip completion.
   - Never invent arbitrary discounts or fictional rates.
5. WHATSAPP BOOKING CALL-TO-ACTION:
   - When quoting a specific trip, include a clean markdown link: [👉 Confirm Booking on WhatsApp](https://wa.me/918939539211?text=...) with a pre-filled message.

OFFICIAL TARIFF RATE CARD & PACKAGES:
- CHENNAI ⇄ TIRUPATI / TIRUMALA PACKAGES (Round trip ~320 km, dedicated cab for all days):
  * MANDATORY: If customer asks about Tirupati for ANY number of days (1 to 7+ days), quote the official Tirupati Multi-Day Package Rates. NEVER use outstation per-km rates for Tirupati!
  * 1-Day: Swift Dzire / Etios: ₹6,000 | Maruti Ertiga: ₹7,500 | Innova: ₹8,500 | Innova Crysta: ₹10,000 | Tempo 12: ₹12,500. (All-inclusive of Fuel, FASTag Tolls, AP Border Permit, Tirumala Ghat Road ascent & Driver Bata).
  * 2-Day Package: Swift Dzire / Etios: ₹9,500 | Maruti Ertiga / XL6: ₹11,500 | Innova: ₹12,500 | Innova Crysta: ₹16,000 | Tempo 12: ₹19,500.
  * 3-Day Package: Swift Dzire / Etios: ₹13,200 | Maruti Ertiga: ₹15,800 | Innova: ₹17,500 | Innova Crysta: ₹22,500 | Tempo 12: ₹27,000.
  * 4-Day Package: Swift Dzire / Etios: ₹16,700 | Maruti Ertiga: ₹19,800 | Innova: ₹21,500 | Innova Crysta: ₹28,500 | Tempo 12: ₹34,000.
  * 5-Day Package: Swift Dzire / Etios: ₹20,200 | Maruti Ertiga: ₹23,800 | Innova: ₹25,500 | Innova Crysta: ₹34,500 | Tempo 12: ₹41,000.
    (Multi-day formula for N days >= 4: Base 3-Day Rate + ((N - 3) × (Day 2 Rate - Day 1 Rate))). Dedicated cab stays with customer for all days, hill climb to Tirumala and driver bata included.
  * ACTION PROTOCOL & DEEP-LINKING (MANDATORY): Always provide the direct calculator action link:
    [👉 Open Tirupati {N}-Day Booking Engine & View Live Quote](/services/tirupati-package/?days={N})
    If customer asks to 'open', 'launch', or 'calculate' the page, provide: [🚀 Launch Tirupati 5-Day Booking Engine Now](/services/tirupati-package/?days=5)
- POPULAR TOUR PACKAGES:
  * Pondicherry: 1-Day Sedan ₹4,500 - ₹5,000 | Ertiga ₹5,800 - ₹6,200 | Innova ₹7,000. 2-Day Sedan ₹7,500 | Ertiga ₹9,200. Link: [👉 Open Pondicherry Calculator](/services/pondicherry-one-day-trip/?days={N})
  * Chidambaram & Pichavaram: 1-Day Sedan ₹7,400 | Ertiga ₹9,200 | Innova ₹11,000. 2-Day Sedan ₹9,800 | Ertiga ₹12,000. Link: [👉 Open Chidambaram Calculator](/services/chidambaram-temple-trip/?days={N})
  * Thiruvannamalai Girivalam: 1-Day Sedan ₹6,500 | Ertiga ₹7,900 | Innova ₹9,300. 2-Day Sedan ₹8,900 | Ertiga ₹10,900. Link: [👉 Open Thiruvannamalai Calculator](/services/thiruvannamalai-girivalam-trip/?days={N})
  * Kanchipuram: 1-Day Sedan ₹3,800 | Ertiga ₹4,800 | Innova ₹5,800. Link: [👉 Open Kanchipuram Calculator](/services/kanchipuram-temple-trip/?days={N})
  * Navagraha (Kumbakonam): 2-Day Sedan ₹14,500 | Ertiga ₹18,500. 3-Day Sedan ₹19,500 | Ertiga ₹24,500. Link: [👉 Open Navagraha Calculator](/services/navagraha-tour/?days={N})
  * Rameswaram & Dhanushkodi: 2-Day Sedan ₹18,500 | Ertiga ₹23,500. 3-Day Sedan ₹24,500 | Ertiga ₹30,500. Link: [👉 Open Rameswaram Calculator](/services/rameswaram-2-days/?days={N})
- OUTSTATION PER-KM TARIFFS (General outstation city trips and one-way drops):
  * Swift Dzire / Etios: Round trip ₹14/km | One-way drop ₹16/km (Min drop 130 km) | Driver Bata ₹400/day | Min round trip 250 km/day.
  * Maruti Ertiga / XL6: Round trip ₹17/km | One-way drop ₹19/km (Min drop 130 km) | Driver Bata ₹500/day | Min round trip 250 km/day.
  * Toyota Innova: Round trip ₹20/km | One-way drop ₹22/km (Min drop 130 km) | Driver Bata ₹600/day | Min round trip 250 km/day.
  * Innova Crysta: Round trip ₹22/km | One-way drop ₹25/km (Min drop 130 km) | Driver Bata ₹700/day | Min round trip 250 km/day.
  * Tempo Traveller (12 Seater): Round trip ₹26/km | One-way drop ₹29/km (Min drop 250 km) | Driver Bata ₹800/day | Min round trip 300 km/day.
  * Tolls, state entry permits & parking at actuals.
- LOCAL CHENNAI HOURLY PACKAGES:
  * Sedan: 4hr/40km ₹1,350 | 8hr/80km ₹2,200 (Extra km: ₹15, hr: ₹150)
  * Ertiga: 4hr/40km ₹1,700 | 8hr/80km ₹2,800 (Extra km: ₹17, hr: ₹200)
  * Innova: 8hr/80km ₹3,200 | Crysta: 8hr/80km ₹4,500
- ACTING DRIVERS FOR PERSONAL CAR:
  * City: 4hr ₹500 | 8hr ₹800 (Night charge 10 PM - 6 AM ₹150)
  * Outstation: ₹1,100/day (+ ₹300 food/stay bata if not provided)
${promptCtx}`;

                      for (const model of ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3-flash', 'gemini-flash-latest']) {
                        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            systemInstruction: { parts: [{ text: systemPrompt }] },
                            contents: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
                            generationConfig: { temperature: 0.3, maxOutputTokens: 3000 }
                          })
                        });
                        if (gRes.ok) {
                          const gData = await gRes.json();
                          const cand = gData.candidates?.[0]?.content?.parts?.[0]?.text;
                          if (cand) {
                            result = { reply: cand, source: 'gemini_' + model, meta: { model } };
                            break;
                          }
                        }
                      }
                    } catch (_) {}
                  }

                  if (!result) {
                    result = processAiConciergeQuery(messages, pageContext);
                  }

                  // Telemetry: Persistent Logging of User Questions
                  try {
                    const rawUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
                    if (rawUserMsg) {
                      const chatCsvPath = path.resolve(process.cwd(), 'Kalidass_Ai_Chat_Queries_2026.csv');
                      const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                      let rowCount = 0;
                      if (fs.existsSync(chatCsvPath)) {
                        try {
                          rowCount = fs.readFileSync(chatCsvPath, 'utf8').trim().split(/\r?\n/).filter(Boolean).length;
                        } catch (_) {}
                      }
                      const sessionId = (data.sessionId || `KT-SES-${100 + rowCount + 1}`).replace(/,/g, ' ');
                      const sourcePage = (data.sourcePage || '/').replace(/,/g, ' ');
                      const cleanUserQuery = rawUserMsg.replace(/"/g, '""').replace(/\r?\n/g, ' ');
                      const cleanAiReply = (result.reply || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');

                      // Detect Query Intent
                      const qLow = rawUserMsg.toLowerCase();
                      let intent = 'General Inquiry';
                      if (qLow.includes('tirupati') || qLow.includes('tirumala') || qLow.includes('balaji')) intent = 'Tirupati Package';
                      else if (qLow.includes('airport') || qLow.includes('flight') || qLow.includes('terminal')) intent = 'Airport Transfer';
                      else if (qLow.includes('pondy') || qLow.includes('pondicherry')) intent = 'Pondicherry Tour';
                      else if (qLow.includes('local') || qLow.includes('hourly') || qLow.includes('4hr') || qLow.includes('8hr') || qLow.includes('city')) intent = 'Local Rental';
                      else if (qLow.includes('outstation') || qLow.includes('per km') || qLow.includes('km rate')) intent = 'Outstation Tariff';
                      else if (qLow.includes('temple') || qLow.includes('navagraha') || qLow.includes('kumbakonam') || qLow.includes('girivalam')) intent = 'Temple Tour';
                      else if (qLow.includes('acting') || qLow.includes('call driver') || qLow.includes('personal car')) intent = 'Acting Driver';

                      // Extract Phone if provided
                      const phoneMatch = rawUserMsg.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/);
                      const contact = phoneMatch ? phoneMatch[0].replace(/[^0-9]/g, '').slice(-10) : 'None';
                      const sourceEngine = (result.source || 'AI Engine').replace(/,/g, ' ');

                      if (fs.existsSync(chatCsvPath)) {
                        const content = fs.readFileSync(chatCsvPath, 'utf8');
                        const lines = content.trim().split(/\r?\n/).filter(Boolean);
                        const rowNum = lines.length;
                        const queryId = `#CHAT-${100 + rowNum}`;
                        const newRow = `${queryId},"${timestamp}","${sessionId}","${sourcePage}","${cleanUserQuery}","${cleanAiReply}","${intent}","${contact}","${sourceEngine}"\n`;
                        fs.appendFileSync(chatCsvPath, newRow, 'utf8');
                      }

                      // Forward to Google Apps Script Webhook
                      fetch('https://script.google.com/macros/s/AKfycbwoEpKqa3Qg-DIvMe06pGUgGLlC_0vJQev61nzIh9ssh1-uHZ5VtYkGzpMVwhEyi7tvEQ/exec', {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain' },
                        body: JSON.stringify({
                          type: 'ai_chat_query',
                          date: timestamp,
                          sessionId,
                          sourcePage,
                          userQuery: rawUserMsg,
                          aiReply: result.reply,
                          intent,
                          contact,
                          engine: result.source || 'AI Engine'
                        })
                      }).catch(() => {});
                    }
                  } catch (logErr) {
                    console.error('Chat logging notice:', logErr.message);
                  }

                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: true, reply: result.reply, source: result.source, meta: result.meta }));
                } catch (err) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.statusCode = 500;
                  res.end(JSON.stringify({ success: false, error: err.message }));
                }
              });
              return;
            }

            if (req.method === 'POST' && url === '/api/record-booking') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body || '{}');
                  const csvPath = path.resolve(process.cwd(), 'Kalidass_Operations_Control_2026.csv');
                  let bookingId = data.bookingId;
                  if (fs.existsSync(csvPath)) {
                    const content = fs.readFileSync(csvPath, 'utf8');
                    const lines = content.trim().split(/\r?\n/).filter(Boolean);
                    const rowNum = lines.length;

                    if (!bookingId) {
                      bookingId = `#KT-BK-${100 + rowNum}`;
                    }

                    const guestNamePhone = `${data.name || 'Guest'} (+91 ${data.phone || '9840100000'})`;
                    const pickupTimeAndDate = `${data.pickupDate || 'Tomorrow'} @ ${data.pickupTime || '04:30 AM'}`;
                    const cleanAddress = (data.pickupAddress || 'Chennai').replace(/"/g, '""');

                    // Vehicle normalization
                    const vLow = (data.vehicle || '').toLowerCase();
                    let vehCat = 'Sedan';
                    if (vLow.includes('tempo') || vLow.includes('traveller')) vehCat = 'Tempo';
                    else if (vLow.includes('crysta')) vehCat = 'Crysta';
                    else if (vLow.includes('innova')) vehCat = 'Innova';
                    else if (vLow.includes('ertiga') || vLow.includes('xl6')) vehCat = 'Ertiga';

                    const partySize = data.passengers || '4 Pax';
                    const fareNum = parseInt(String(data.fare || '').replace(/[^0-9]/g, ''), 10) || 6000;
                    const payoutNum = Math.round(fareNum * 0.8);

                    const newRow = `${bookingId},${guestNamePhone},${pickupTimeAndDate},"${cleanAddress}",${vehCat},${partySize},Pending,Pending,Unassigned,Pending,${fareNum},${payoutNum},=K${rowNum}-L${rowNum},Unreconciled\n`;
                    fs.appendFileSync(csvPath, newRow, 'utf8');
                  }
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: true, bookingId }));
                } catch (err) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            if (url === '/api/admin/bookings' || url === '/api/admin/bookings/') {
              const fullParsedUrl = new URL(req.url, 'http://localhost');
              const actionQuery = (req.headers['x-action'] || fullParsedUrl.searchParams.get('action') || '').trim().toLowerCase();
              const bookingIdQuery = (req.headers['x-booking-id'] || fullParsedUrl.searchParams.get('bookingId') || fullParsedUrl.searchParams.get('id') || fullParsedUrl.searchParams.get('ref') || '').trim();
              const customWebhook = fullParsedUrl.searchParams.get('webhook') || process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL || '';

              const csvPath = path.resolve(process.cwd(), 'Kalidass_Operations_Control_2026.csv');
              const slipsPath = path.resolve(process.cwd(), 'Kalidass_Duty_Slips_2026.json');

              const handleDeleteBooking = async (targetBookingId) => {
                if (!targetBookingId) return;
                const targetLower = targetBookingId.toLowerCase();

                // 1. Remove from local CSV
                if (fs.existsSync(csvPath)) {
                  try {
                    const content = fs.readFileSync(csvPath, 'utf8');
                    const lines = content.trim().split(/\r?\n/).filter(Boolean);
                    if (lines.length > 0) {
                      const header = lines[0];
                      const remaining = [header];
                      for (let i = 1; i < lines.length; i++) {
                        const m = lines[i].match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g);
                        const row0 = m ? m[0].replace(/^,/, '').replace(/^"|"$/g, '').trim().toLowerCase() : '';
                        if (row0 !== targetLower) {
                          remaining.push(lines[i]);
                        }
                      }
                      fs.writeFileSync(csvPath, remaining.join('\n') + '\n', 'utf8');
                    }
                  } catch (_) {}
                }

                // 2. Remove duty slip
                if (fs.existsSync(slipsPath)) {
                  try {
                    const parsed = JSON.parse(fs.readFileSync(slipsPath, 'utf8') || '[]');
                    if (Array.isArray(parsed)) {
                      const rem = parsed.filter(s => (s?.bookingId || '').trim().toLowerCase() !== targetLower);
                      fs.writeFileSync(slipsPath, JSON.stringify(rem, null, 2), 'utf8');
                    }
                  } catch (_) {}
                }

                // 3. Forward delete & cancel to Google Sheets Webhook
                if (customWebhook && customWebhook.startsWith('http')) {
                  try {
                    await fetch(customWebhook, {
                      method: 'POST',
                      headers: { 'Content-Type': 'text/plain' },
                      body: JSON.stringify({
                        type: 'admin_booking_sync',
                        action: 'delete',
                        bookingId: targetBookingId,
                        manifestStatus: 'Cancelled'
                      })
                    });
                  } catch (_) {}
                }
              };

              if (req.method === 'GET') {
                if (actionQuery === 'delete' || actionQuery === 'cancel') {
                  handleDeleteBooking(bookingIdQuery).then(() => {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ success: true, bookingId: bookingIdQuery, action: 'deleted' }));
                  }).catch(err => {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: err.message }));
                  });
                  return;
                }

                (async () => {
                  try {
                    let remoteBookings = [];
                    if (customWebhook && customWebhook.startsWith('http')) {
                      try {
                        const rRes = await fetch(customWebhook, { method: 'GET', redirect: 'follow', headers: { 'Accept': 'application/json' } });
                        if (rRes.ok) {
                          const rJson = await rRes.json();
                          if (rJson && rJson.success && Array.isArray(rJson.bookings)) {
                            remoteBookings = rJson.bookings.filter(b => b && b.manifestStatus !== 'Cancelled');
                          }
                        }
                      } catch (_) {}
                    }

                    const bookings = [...remoteBookings];
                    if (fs.existsSync(csvPath)) {
                      const content = fs.readFileSync(csvPath, 'utf8');
                      const lines = content.trim().split(/\r?\n/).filter(Boolean);
                      for (let i = 1; i < lines.length; i++) {
                        const matches = lines[i].match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g);
                        if (matches) {
                          const row = matches.map(m => {
                            let s = m.replace(/^,/, '').trim();
                            if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1).replace(/""/g, '"');
                            return s;
                          });
                          const bId = row[0] || '';
                          const mStatus = row[9] || 'Pending';
                          if (mStatus === 'Cancelled') continue;
                          if (!bookings.some(b => (b.bookingId || '').toLowerCase() === bId.toLowerCase())) {
                            bookings.push({
                              bookingId: bId,
                              guestNamePhone: row[1] || '',
                              travelDateTime: row[2] || '',
                              pickupAddress: row[3] || '',
                              vehicleCategory: row[4] || 'Sedan',
                              partySize: row[5] || '4 Pax',
                              kycStatus: row[6] || 'Pending',
                              darshanStatus: row[7] || 'Unassigned',
                              assignedChauffeur: row[8] || 'Unassigned',
                              manifestStatus: mStatus,
                              terminalFare: parseInt(row[10] || '0', 10) || 0,
                              chauffeurPayout: parseInt(row[11] || '0', 10) || 0,
                              companyMargin: parseInt(row[12] || '0', 10) || 0,
                              financialClosure: row[13] || 'Unreconciled',
                              reviewStatus: row[14] || 'Pending',
                              dutySlip: null
                            });
                          }
                        }
                      }
                    }

                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ success: true, count: bookings.length, bookings }));
                  } catch (err) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: err.message }));
                  }
                })();
                return;
              }

              if (req.method === 'POST') {
                let body = '';
                req.on('data', c => { body += c; });
                req.on('end', async () => {
                  try {
                    const data = JSON.parse(body || '{}');
                    if (data.action === 'delete' || data.action === 'cancel' || data.manifestStatus === 'Cancelled') {
                      await handleDeleteBooking(data.bookingId || bookingIdQuery);
                      res.setHeader('Content-Type', 'application/json; charset=utf-8');
                      res.end(JSON.stringify({ success: true, bookingId: data.bookingId || bookingIdQuery, action: 'deleted' }));
                      return;
                    }

                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ success: true, bookingId: data.bookingId }));
                  } catch (err) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: err.message }));
                  }
                });
                return;
              }
            }

            if (url === '/api/admin/sheet-config') {
              if (req.method === 'GET') {
                const currentUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL || '';
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: true, webhookUrl: currentUrl }));
                return;
              }
              if (req.method === 'POST') {
                let body = '';
                req.on('data', (c) => { body += c; });
                req.on('end', () => {
                  try {
                    const data = JSON.parse(body || '{}');
                    const clean = (data.webhookUrl || '').trim();
                    process.env.GOOGLE_SHEET_WEBHOOK_URL = clean;
                    process.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL = clean;
                    const envPath = path.resolve(process.cwd(), '.env');
                    if (fs.existsSync(envPath)) {
                      let envContent = fs.readFileSync(envPath, 'utf8');
                      if (envContent.includes('GOOGLE_SHEET_WEBHOOK_URL=')) {
                        envContent = envContent.replace(/GOOGLE_SHEET_WEBHOOK_URL=.*(\r?\n|$)/, `GOOGLE_SHEET_WEBHOOK_URL=${clean}\n`);
                      } else {
                        envContent += `\nGOOGLE_SHEET_WEBHOOK_URL=${clean}\n`;
                      }
                      if (envContent.includes('PUBLIC_GOOGLE_SHEET_WEBHOOK_URL=')) {
                        envContent = envContent.replace(/PUBLIC_GOOGLE_SHEET_WEBHOOK_URL=.*(\r?\n|$)/, `PUBLIC_GOOGLE_SHEET_WEBHOOK_URL=${clean}\n`);
                      } else {
                        envContent += `PUBLIC_GOOGLE_SHEET_WEBHOOK_URL=${clean}\n`;
                      }
                      fs.writeFileSync(envPath, envContent, 'utf8');
                    }
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.end(JSON.stringify({ success: true, webhookUrl: clean }));
                  } catch (e) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: e.message }));
                  }
                });
                return;
              }
            }

            if (req.method === 'POST' && url === '/api/record-calculation') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body || '{}');
                  const csvPath = path.resolve(process.cwd(), 'Kalidass_Calculations_Log_2026.csv');
                  let quoteId = data.quoteId;
                  const timestamp = data.timestamp || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                  const sourcePage = (data.sourcePage || '/').replace(/,/g, ' ');
                  const calculatorEngine = (data.calculatorEngine || 'Fare Calculator').replace(/,/g, ' ');
                  const tripType = (data.tripType || 'Standard').replace(/,/g, ' ');
                  const pickup = (data.pickup || 'Chennai').replace(/,/g, ' ').replace(/"/g, '""');
                  const drop = (data.drop || 'N/A').replace(/,/g, ' ').replace(/"/g, '""');
                  const vehicle = (data.vehicle || 'Standard').replace(/,/g, ' ');
                  const distanceKm = data.distanceKm || (data.distance ? String(data.distance) : 'N/A');
                  const fareNum = parseInt(String(data.estimatedFare || data.estimate || '0').replace(/[^0-9]/g, ''), 10) || 0;
                  const status = data.status || 'Browsed';
                  const metadata = (data.meta ? JSON.stringify(data.meta).replace(/,/g, ';').replace(/"/g, '') : 'None');
                  const CALC_HEADER = 'Quote ID,Timestamp,Source Page,Calculator Engine,Trip Type,Pickup Location,Drop Location,Vehicle,Distance (km),Calculated Fare (INR),Status,Metadata\n';

                  if (!fs.existsSync(csvPath)) {
                    try {
                      fs.writeFileSync(csvPath, CALC_HEADER, 'utf8');
                    } catch (_) {}
                  }

                  if (fs.existsSync(csvPath)) {
                    const content = fs.readFileSync(csvPath, 'utf8');
                    const lines = content.trim().split(/\r?\n/).filter(Boolean);
                    const rowNum = lines.length;
                    const isEnquiry = data.type === 'enquiry' || data.leadType === 'enquiry';
                    const defaultPrefix = isEnquiry ? '#ENQ-' : '#QT-';
                    let candidateId = quoteId || (data.meta && data.meta.quoteRefId);
                    let validSeq = false;
                    if (candidateId) {
                      const match = String(candidateId).match(/(?:QT|ENQ|KT|CALC|CALL|WA)-?(\d+)/i);
                      const n = match ? parseInt(match[1], 10) : 0;
                      if (n >= 101 && n <= (100 + rowNum + 50)) {
                        validSeq = true;
                      }
                    }
                    if (!candidateId || !validSeq) {
                      quoteId = `${defaultPrefix}${100 + rowNum}`;
                    } else {
                      quoteId = String(candidateId);
                    }

                    const newRow = `${quoteId},"${timestamp}","${sourcePage}","${calculatorEngine}","${tripType}","${pickup}","${drop}","${vehicle}",${distanceKm},${fareNum},"${status}","${metadata}"\n`;
                    fs.appendFileSync(csvPath, newRow, 'utf8');
                  }

                  // Backup Forward to Google Apps Script Webhook
                  const webhookUrl = data.webhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.PUBLIC_GOOGLE_SHEET_WEBHOOK_URL;
                  if (webhookUrl && webhookUrl.startsWith('http')) {
                    try {
                      fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain' },
                        body: JSON.stringify({
                          type: 'calculator_activity',
                          quoteId,
                          date: timestamp,
                          sourcePage,
                          calculatorEngine,
                          tripType,
                          pickup,
                          drop,
                          vehicle,
                          distance: distanceKm,
                          estimate: fareNum,
                          status: status || 'Rate Locked'
                        })
                      }).catch(() => {});
                    } catch (_) {}
                  }

                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: true, quoteId }));
                } catch (err) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            if (req.method === 'GET' && (url === '/api/calculations' || url === '/api/calculations.json')) {
              try {
                const csvPath = path.resolve(process.cwd(), 'Kalidass_Calculations_Log_2026.csv');
                if (!fs.existsSync(csvPath)) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: true, count: 0, calculations: [] }));
                  return;
                }
                const content = fs.readFileSync(csvPath, 'utf8');
                const lines = content.trim().split(/\r?\n/).filter(Boolean);
                const calculations = [];
                for (let i = 1; i < lines.length; i++) {
                  const line = lines[i];
                  const matches = line.match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g);
                  if (matches) {
                    const row = matches.map(m => {
                      let s = m.replace(/^,/, '').trim();
                      if (s.startsWith('"') && s.endsWith('"')) {
                        s = s.slice(1, -1).replace(/""/g, '"');
                      }
                      return s;
                    });
                    calculations.push({
                      quoteId: row[0] || '',
                      timestamp: row[1] || '',
                      sourcePage: row[2] || '',
                      calculatorEngine: row[3] || '',
                      tripType: row[4] || '',
                      pickup: row[5] || '',
                      drop: row[6] || '',
                      vehicle: row[7] || '',
                      distanceKm: row[8] || '',
                      estimatedFare: parseInt(row[9] || '0', 10) || 0,
                      status: row[10] || 'Browsed',
                      metadata: row[11] || ''
                    });
                  }
                }
                calculations.reverse();
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: true, count: calculations.length, calculations }));
              } catch (err) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }

            if (req.method === 'GET' && (url === '/api/admin/chat-logs' || url === '/api/chat-queries.json')) {
              try {
                const csvPath = path.resolve(process.cwd(), 'Kalidass_Ai_Chat_Queries_2026.csv');
                if (!fs.existsSync(csvPath)) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ success: true, count: 0, queries: [] }));
                  return;
                }
                const content = fs.readFileSync(csvPath, 'utf8');
                const lines = content.trim().split(/\r?\n/).filter(Boolean);
                const queries = [];
                for (let i = 1; i < lines.length; i++) {
                  const line = lines[i];
                  const matches = line.match(/(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g);
                  if (matches) {
                    const row = matches.map(m => {
                      let s = m.replace(/^,/, '').trim();
                      if (s.startsWith('"') && s.endsWith('"')) {
                        s = s.slice(1, -1).replace(/""/g, '"');
                      }
                      return s;
                    });
                    queries.push({
                      queryId: row[0] || '',
                      timestamp: row[1] || '',
                      sessionId: row[2] || '',
                      sourcePage: row[3] || '',
                      userQuery: row[4] || '',
                      aiResponse: row[5] || '',
                      detectedIntent: row[6] || 'General Inquiry',
                      customerContact: row[7] || 'None',
                      sourceEngine: row[8] || 'AI Engine'
                    });
                  }
                }
                queries.reverse();
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ success: true, count: queries.length, queries }));
              } catch (err) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }

            if (url.startsWith('/api/admin/reset-data')) {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                try {
                  let parsed = {};
                  try { parsed = JSON.parse(body || '{}'); } catch (_) {}
                  const queryPin = new URL(req.url, 'http://localhost').searchParams.get('pin');
                  const pin = String(parsed.pin || queryPin || '').trim();

                  if (pin !== '2015') {
                    res.setHeader('Content-Type', 'application/json; charset=utf-8');
                    res.statusCode = 401;
                    res.end(JSON.stringify({ success: false, error: 'Unauthorized: Invalid Admin PIN' }));
                    return;
                  }

                  const cwd = process.cwd();
                  const CALC_HEADER = 'Quote ID,Timestamp,Source Page,Calculator Engine,Trip Type,Pickup Location,Drop Location,Vehicle,Distance (km),Calculated Fare (INR),Status,Metadata\n';
                  const OPS_HEADER = 'Booking ID,Guest Name & Phone,Travel Date & Pickup Time,Pickup Address,Vehicle Category,Pilgrim Party Size,KYC Status,Darshan Ticket Status,Assigned Chauffeur & Plate,Chauffeur Manifest,Terminal Fare (Guest),Chauffeur Payout,Company Margin,Financial Closure,Review Status\n';
                  const AI_HEADER = 'QueryId,Timestamp,SessionId,SourcePage,UserQuery,AiResponse,DetectedIntent,CustomerContact,SourceEngine\n';

                  fs.writeFileSync(path.resolve(cwd, 'Kalidass_Calculations_Log_2026.csv'), CALC_HEADER, 'utf8');
                  fs.writeFileSync(path.resolve(cwd, 'Kalidass_Operations_Control_2026.csv'), OPS_HEADER, 'utf8');
                  fs.writeFileSync(path.resolve(cwd, 'Kalidass_Ai_Chat_Queries_2026.csv'), AI_HEADER, 'utf8');

                  const slipsPath = path.resolve(cwd, 'Kalidass_Duty_Slips_2026.json');
                  if (fs.existsSync(slipsPath)) {
                    try { fs.unlinkSync(slipsPath); } catch (_) {}
                  }

                  const settlePath = path.resolve(cwd, 'Kalidass_Driver_Settlements_2026.json');
                  if (fs.existsSync(settlePath)) {
                    try { fs.unlinkSync(settlePath); } catch (_) {}
                  }

                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({
                    success: true,
                    message: 'All admin data logs and operations files have been reset to a clean slate.'
                  }));
                } catch (err) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.statusCode = 500;
                  res.end(JSON.stringify({ success: false, error: err.message }));
                }
              });
              return;
            }

            next();
          });
        },
      },
    ],
  },
});
