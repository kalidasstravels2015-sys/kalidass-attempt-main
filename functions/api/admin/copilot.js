// Cloudflare Pages Function: /api/admin/copilot
// 24/7 Operations Co-Pilot & Dispatch Partner for Kalidass Travels
// Equipped with Google Gemini 3.8 Multi-Photo & PDF Document Vision & Live Google Search Grounding

const SYSTEM_PROMPT = `You are the official 24/7 AI Operations Partner, Dispatch Genius, and Business Co-Pilot for Kalidass Travels, Chennai.
Owner: Saravanan | Primary Helpline: +91 89395 39211 | Dispatch Desk: +91 90923 03060.
You are assisting the owner/operator on mobile when they are in the office, outstation, or on the road.

======================================================================
CORE MULTIMODAL & WEB CAPABILITIES (MULTI-PHOTO & PDF VISION + SEARCH):
======================================================================
1. FULL MULTI-PHOTO & PDF DOCUMENT VISION:
   - You can read and analyze MULTIPLE photos and PDF files attached in a single request.
   - When the user attaches files:
     • PDF Documents (IRCTC Train Tickets, Airline Flight Tickets, Hotel Vouchers, Corporate Quotations, Parivahan Permits):
       Extract passenger names, PNR/booking reference, flight/train numbers, departure & arrival dates/times, boarding terminals/railway stations, and seat numbers. Draft a complete chauffeur pickup duty slip or transfer quotation.
     • Multiple WhatsApp Chat Screenshots: Read across all images sequentially. Piece together the complete conversation, pickup/drop addresses, dates, luggage, and passenger count.
     • Visiting Cards & Business Leads: Extract company name, contact person, phone number, and draft a professional greeting.
     • Toll Plaza / Fuel Receipts: Read toll plaza names, vehicle registration numbers, dates, times, and amounts for driver khata settlement.
     • Driver Licenses & Vehicle RC Books: Extract driver name, license validity, vehicle number, fitness, and state permit expiry.

2. LIVE GOOGLE WEB SEARCH GROUNDING:
   - You have live Google Search. Whenever the user asks about live timings, train schedules, flight arrival status, temple darshan rules (e.g. Tirupati SSD/SED tokens, Girivalam dates, Sabarimala virtual q), highway toll costs, or general inquiries:
     • Search Google live and provide 100% verified, real-world facts.
     • Never say "I don't know" or "I cannot browse the web" — you have real-time search.

3. BROAD INTELLIGENCE & BUSINESS OPERATIONS:
   - Answer ANY operational, travel, fleet management, client negotiation, or route planning question.
   - You are Saravanan's most capable business partner. Help him calculate profits, advise on vehicle choices for tricky luggage requirements (e.g. Ertiga rooftop carrier for 5 adults + suitcases), and craft respectful, persuasive customer replies.

======================================================================
CORE OPERATIONAL RULES:
======================================================================
0. ZERO IRRITATING MARKDOWN (#, ###) & ZERO EXCESS ASTERISKS (*):
   - NEVER use markdown headers (#, ##, ###, ####). WhatsApp does NOT render hashtags; it displays ugly raw "###" symbols!
   - Use clean plain headers and clean bullet points (•).
   - Text must be 100% human-friendly, polite, and pleasant to read on WhatsApp.

1. ACCURATE FARE QUOTATION (WEBSITE RATE SUMMARY FORMAT):
   Whenever user asks for quote or pastes an enquiry:
   - Swift Dzire / Toyota Etios (4+1): Outstation ₹14/km (min 250km/day) + ₹500 driver bata/day | Local 8hr/80km ₹2,600 (extra ₹15/km, ₹150/hr).
   - Maruti Ertiga (6+1): Outstation ₹17/km (min 250km/day) + ₹500 driver bata/day | Local 8hr/80km ₹3,400.
   - Innova Crysta (7+1): Outstation ₹22/km (min 250km/day) + ₹700 driver bata/day | Local 8hr/80km ₹5,400.
   - Tempo 12S: Outstation ₹24/km (min 300km/day) + ₹800 driver bata/day | Local 8hr/80km ₹6,600.
   - Fixed 1-Day Packages (Tolls included upfront):
     • Tirupati: Sedan ₹6,000 | Ertiga ₹7,500 | Crysta ₹10,000 | Tempo ₹12,500
     • Pondicherry: Sedan ₹4,500 | Ertiga ₹5,800 | Crysta ₹7,500 | Tempo ₹8,500
     • Kanchipuram: Sedan ₹3,800 | Ertiga ₹4,800 | Crysta ₹6,500 | Tempo ₹7,800
     • Thiruvannamalai: Sedan ₹6,500 | Ertiga ₹7,900 | Crysta ₹10,500 | Tempo ₹12,500

2. Dispatch Helpline: +91 89395 39211 | Dispatch Desk: +91 90923 03060.
3. ZERO WHATSAPP SELF-LINKS:
   - NEVER output phrases like "Send route on WhatsApp for quick quote" or "WhatsApp us for instant booking".`;

function cleanText(text) {
  if (!text) return '';
  let clean = String(text);
  clean = clean.replace(/^#{1,6}\s*(?:\*)?([^*\n]+)(?:\*)?/gm, '$1');
  clean = clean.replace(/^#{1,6}\s+/gm, '');
  clean = clean.replace(/\*{3,}/g, '');
  clean = clean.replace(/^\s*([•\-\*]?\s*)\*([^*:\n]+)\*:\s*/gm, '$1$2: ');
  clean = clean.replace(/^\s*\*([0-9]+\.[^*\n]+)\*\s*$/gm, '$1');
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '*$1*');
  clean = clean.replace(/^\s*[\-\*]\s+/gm, '• ');
  clean = clean.replace(/\[(?:[^\]]*?(?:WhatsApp|quote|booking|route)[^\]]*?)\]\((?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)[^\)]*\)/gi, '');
  clean = clean.replace(/^[•\s\-\*📲👉]*.*?(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)[^\r\n]*(?:\r?\n|$)/gmi, '');
  clean = clean.replace(/\(https?:\/\/(?:wa\.me|api\.whatsapp\.com)[^)]*\)/gi, '');
  clean = clean.replace(/^[•\s\-\*📲👉]*(?:Send route on WhatsApp[^\r\n]*|WhatsApp us for[^\r\n]*|Confirm (?:this tour|booking) on WhatsApp[^\r\n]*|Book on WhatsApp[^\r\n]*)(?:\r?\n|$)/gmi, '');
  clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, title, rawUrl) => {
    const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';
    if (!url || url.startsWith('/')) return title;
    return `${title} (${url})`;
  });
  clean = clean.replace(/```[a-z]*\n([\s\S]*?)```/g, '$1');
  clean = clean.replace(/`([^`]+)`/g, '$1');
  clean = clean.replace(/^[━─\-_=]{3,}$/gm, '--------------------------------');
  clean = clean.replace(/\n{3,}/g, '\n\n');
  return clean.split('\n').map(l => l.trimEnd()).join('\n').trim();
}

export async function onRequestPost({ request, env }) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      try {
        const text = await request.text();
        body = JSON.parse(text);
      } catch (e) {}
    }

    const promptText = (body.message || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];

    // Consolidate attachments: files, images, or legacy single image
    const allAttachments = [];
    if (Array.isArray(body.files)) allAttachments.push(...body.files);
    if (Array.isArray(body.images)) allAttachments.push(...body.images);
    if (body.image && body.image.data) allAttachments.push(body.image);

    if (!promptText && allAttachments.length === 0) {
      return new Response(JSON.stringify({ error: 'Message or at least one photo/PDF is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const apiKey = (env && env.GEMINI_API_KEY) || (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY);

    if (apiKey) {
      const contents = [];
      for (const h of history.slice(-6)) {
        if (h.role && h.content) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          });
        }
      }

      const userParts = [];
      for (const att of allAttachments) {
        if (att && att.data) {
          const cleanBase64 = att.data.replace(/^data:[^;]+;base64,/, '');
          const mimeType = att.mimeType || (att.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
          userParts.push({
            inlineData: {
              mimeType,
              data: cleanBase64
            }
          });
        }
      }

      const effectivePrompt = promptText || (allAttachments.length > 0
        ? `Please carefully analyze the ${allAttachments.length} attached document(s)/photo(s). Extract all details (passenger names, numbers, dates, timings, locations) and provide the required quote or answer.`
        : '');

      userParts.push({ text: effectivePrompt });

      contents.push({
        role: 'user',
        parts: userParts
      });

      // Try modern Gemini models: gemini-3.8-flash first, then gemini-3.5-flash
      for (const model of ['gemini-3.8-flash', 'gemini-3.5-flash']) {
        // 1. Try with Google Search Grounding
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents,
              tools: [{ googleSearch: {} }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 4000 }
            })
          });

          if (res.ok) {
            const data = await res.json();
            const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
              const meta = data.candidates?.[0]?.groundingMetadata;
              const grounding = meta ? {
                webQueries: meta.webSearchQueries || [],
                sources: meta.groundingChunks?.map(c => c.web?.title).filter(Boolean) || []
              } : null;

              return new Response(JSON.stringify({
                success: true,
                reply: cleanText(candidateText),
                source: 'gemini',
                model,
                grounding
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
              });
            }
          }
        } catch (_) {}

        // 2. Try without tools if search request was rejected
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents,
              generationConfig: { temperature: 0.2, maxOutputTokens: 4000 }
            })
          });

          if (res.ok) {
            const data = await res.json();
            const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText) {
              return new Response(JSON.stringify({
                success: true,
                reply: cleanText(candidateText),
                source: 'gemini',
                model
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
              });
            }
          }
        } catch (_) {}
      }
    }

    // Default fast reply fallback
    const fallback = `• Car: AC Sedan (Dzire / Etios 4+1)\n• Rate: ₹14/km outstation (min 250 km/day) + ₹500 bata\n• Local 8hr/80km: ₹2,600\n• Dispatch Helpline: +91 89395 39211`;
    return new Response(JSON.stringify({
      success: true,
      reply: cleanText(fallback),
      source: 'local_fallback'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
