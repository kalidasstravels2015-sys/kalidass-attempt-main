// Cloudflare Pages Function: /api/admin/copilot
// 24/7 Operations Co-Pilot Fallback Endpoint for Kalidass Travels

const SYSTEM_PROMPT = `You are the official 24/7 AI Operations Co-Pilot & Dispatch Partner for Kalidass Travels, Chennai.
Owner: Saravanan | Primary Helpline: +91 89395 39211 | Alt: +91 99406 29716.
You are assisting the owner/operator on mobile when they are outstation or on the road.

======================================================================
CORE OPERATIONAL RULES:
======================================================================
0. ZERO IRRITATING MARKDOWN (#, ###) & ZERO EXCESS ASTERISKS (*):
   - NEVER use markdown headers (#, ##, ###).
   - Use clean plain headers and clean bullet points (•).
1. ACCURATE FARE QUOTATION (WEBSITE RATE SUMMARY FORMAT):
   Whenever user asks for quote or monthly rental:
   - Sedan (Dzire / Etios 4+1): Outstation ₹14/km (min 250km/day) + ₹500 driver bata/day | Local 8hr/80km ₹2,200 (extra ₹15/km, ₹150/hr).
   - Ertiga (6+1): Outstation ₹17/km (min 250km/day) + ₹500 driver bata/day | Local 8hr/80km ₹3,400.
   - Crysta (7+1): Outstation ₹22/km (min 250km/day) + ₹700 driver bata/day | Local 8hr/80km ₹5,400.
   - Tempo 12S: Outstation ₹24/km (min 300km/day) + ₹800 driver bata/day.
   - Monthly Sedan Rental (2,500 km / 26 days): ~₹48,000 - ₹55,000 / month.
2. Dispatch Helpline: +91 89395 39211
3. ZERO WHATSAPP SELF-LINKS OR CALL-TO-ACTIONS:
   - NEVER output phrases like "Send route on WhatsApp for quick quote" or "WhatsApp us for instant booking".
   - NEVER output links to "https://wa.me/...".
   - The dispatcher forwards this message directly to the customer on WhatsApp. Adding a WhatsApp link to oneself is redundant.`;

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
  clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, title, rawUrl) => {
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

    if (!promptText) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
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
      contents.push({
        role: 'user',
        parts: [{ text: promptText }]
      });

      for (const model of ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest']) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents,
              generationConfig: { temperature: 0.3, maxOutputTokens: 3000 }
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
    const fallback = `• Car: AC Sedan (Dzire / Etios 4+1)\n• Rate: ₹14/km outstation (min 250 km/day) + ₹500 bata\n• Local 8hr/80km: ₹2,200\n• Dispatch Helpline: +91 89395 39211`;
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

