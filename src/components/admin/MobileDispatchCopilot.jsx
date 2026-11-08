import React, { useState, useEffect, useRef } from 'react';

const COPILOT_SYSTEM_PROMPT = `You are the official 24/7 AI Operations Co-Pilot & Dispatch Partner for Kalidass Travels, Chennai.
Owner: Saravanan | Primary Helpline: +91 89395 39211 | Alt: +91 99406 29716.
You are assisting the owner/operator on mobile when they are outstation or on the road.

CORE RULES:
1. NEVER INVENT FAKE DATA: Never mention dummy names, fake hotels (NO 'Green Park Hotel' or 'Kapaleeshwarar Temple' unless explicitly provided in query).
2. WEBSITE RATE SUMMARY FORMAT:
   When user asks for rate summary or quote, strictly follow official Kalidass Travels rate card format:
   KALIDASS TRAVELS — TRIP QUOTATION
   ──────────────────────────────────────────
   Route: [Origin] ⇄ [Destination]
   [Schedule if known] • [Trip Type] • ~[Distance] km
   ──────────────────────────────────────────
   RATE SUMMARY:
   • [Vehicle] ([Billed km] km @ ₹[Rate]/km or Package): ₹[Cost]
   • Driver Bata: ₹[Bata]
   • Tolls / Parking / Interstate Entry Tax: Extra as per slip
   Estimated Total Fare: ₹[Total] + Extras
   ──────────────────────────────────────────
   PAYMENT & BILLING RULES:
   • ₹500 advance to reserve cab (deducted in final billing)
   • Pay balance to chauffeur at trip end (UPI / Cash)
   • Doorstep odometer reading
   Dispatch Helpline: +91 89395 39211
3. MULTI-DAY ITINERARIES:
   If user pastes complex itinerary (e.g. 11 Nov Chennai Airport to Train, 12-18 Nov Madurai -> Rameshwaram -> Kanyakumari -> Trivandrum):
   Break down day by day with real temple darshan timings, senior citizen ease, and separate Part A (Chennai local) & Part B (Outstation) Ertiga 6+1 AC + rooftop carrier.
4. TARIFF RATES:
   - Sedan (Dzire/Etios 4+1): Outstation ₹14/km (min 250km/day) + ₹500 bata | Local 4hr ₹1600, 8hr ₹2600, 10hr ₹3100
   - Ertiga (6+1): Outstation ₹17/km (min 250km/day) + ₹500 bata | Local 4hr ₹2000, 8hr ₹3400, 10hr ₹4100
   - Crysta (7+1): Outstation ₹22/km (min 250km/day) + ₹700 bata | Local 4hr ₹3400, 8hr ₹5400, 10hr ₹6200
   - Tempo (12+1): Outstation ₹24/km (min 300km/day) + ₹800 bata | Local 4hr ₹4200, 8hr ₹6600, 10hr ₹7800
   - Fixed 1-Day: Mahabalipuram ₹2500 | Kanchipuram ₹3800 | Pondicherry ₹4500 | Tirupati ₹6000 | Thiruvannamalai ₹6500`;

async function callDirectGemini(text, history) {
  const apiKey = (typeof window !== 'undefined' && localStorage.getItem('kalidass_gemini_key')) ||
    import.meta.env.PUBLIC_GEMINI_API_KEY ||
    '';

  const contents = [];
  for (const h of history.slice(-6)) {
    if (h.role && h.content) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      });
    }
  }
  contents.push({ role: 'user', parts: [{ text }] });

  for (const model of ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest']) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: COPILOT_SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.2, maxOutputTokens: 4000 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const cand = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (cand) return { reply: cand, model };
      }
    } catch (_) {}
  }
  throw new Error('AI generation offline. Please check your data connection.');
}

export default function MobileDispatchCopilot() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `🚗 *KALIDASS TRAVELS — MOBILE AI CO-PILOT*
━━━━━━━━━━━━━━━━━━━━━━━━━
வணக்கம் Saravanan! I am your 24/7 cloud co-pilot.
I work directly on your mobile data — zero PC required!

*What you can do right now:*
1️⃣ *Paste raw customer notes* from WhatsApp (I extract the itinerary & rates).
2️⃣ *Ask for quotes:* e.g. _"airport to kancheepuram sedan"_ or _"rate summary for ertiga"_.
3️⃣ *Generate driver duty slips:* e.g. _"duty Saravanan TN 01 AB 1234"_.

Tap any quick chip below or type/speak your request:`,
      isQuote: false,
      isDutySlip: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [targetPhone, setTargetPhone] = useState('');
  const [phoneModalMsg, setPhoneModalMsg] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initialize Speech Recognition for mobile voice-to-text
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN'; // Works for Indian English and Tamil-English terms

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };

        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is supported on Chrome, Safari, and modern mobile browsers.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (_) {
        setIsRecording(false);
      }
    }
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput('');
    const userMsgId = 'u-' + Date.now();
    const newHistory = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(newHistory);
    setLoading(true);

    try {
      // Build previous turns for context
      const historyPayload = newHistory
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content
        }));

      let reply = '';
      let isQuote = false;
      let isDutySlip = false;
      let customerPhone = '';
      let driverPhone = '';

      // Primary: Call Server Copilot Endpoint
      try {
        const res = await fetch('/api/admin/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: historyPayload
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.reply) {
            reply = data.reply;
            isQuote = Boolean(data.isQuote);
            isDutySlip = Boolean(data.isDutySlip);
            customerPhone = data.customerPhone || '';
            driverPhone = data.driverPhone || '';
          }
        }
      } catch (_) {}

      // Resilient Fallback: Direct Client-Side Gemini Call (Zero PC, Zero Server, 100% Mobile Browser Uptime)
      if (!reply) {
        const directResult = await callDirectGemini(text, historyPayload);
        reply = directResult.reply;
        isDutySlip = reply.includes('DUTY SLIP');
        isQuote = reply.includes('RATE SUMMARY:') || reply.includes('QUOTATION');
      }

      // Extract phone if present anywhere in text or reply
      if (!customerPhone) {
        const phoneMatch = (text + ' ' + reply).match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
        if (phoneMatch) {
          customerPhone = phoneMatch[0].replace(/[\s-]/g, '');
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'a-' + Date.now(),
          role: 'assistant',
          content: reply,
          isQuote,
          isDutySlip,
          customerPhone,
          driverPhone,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: `⚠️ ${err?.message || 'Network connection error. Please retry.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content, id) => {
    try {
      navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (_) {}
  };

  const openWhatsApp = (content, phone = '') => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(content);
    if (cleanPhone) {
      const formatted = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
      window.open(`https://wa.me/${formatted}?text=${encoded}`, '_blank');
    } else {
      // General share to WhatsApp (lets user select any chat in their WhatsApp)
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    }
  };

  const quickPrompts = [
    { label: '🚖 Sedan Rate Summary', text: 'give me rate summary for sedan' },
    { label: '🚙 Ertiga Rate Summary', text: 'give me rate summary for ertiga' },
    { label: '🚘 Crysta Rate Summary', text: 'give me rate summary for innova crysta' },
    { label: '🚐 Tempo Traveller Rate', text: 'give me rate summary for tempo traveller' },
    { label: '📍 Airport to Kanchipuram', text: 'airport to kancheepuram rate summary' },
    { label: '📝 Driver Duty Slip', text: 'create driver duty slip for driver Saravanan vehicle TN 01 AB 1234' }
  ];

  return (
    <div className="flex flex-col h-[100dvh] max-w-2xl mx-auto bg-slate-950 text-slate-100 antialiased font-sans select-none sm:border-x sm:border-slate-800">
      {/* Top Mobile App Bar */}
      <header className="flex-none bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-sm">
            KT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm text-white tracking-wide">KALIDASS AI CO-PILOT</h1>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                24/7 Cloud
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Mobile Operational Dispatch • Zero PC Required</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/admin/"
            className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1"
          >
            <span>Operations Desk</span>
            <span>➔</span>
          </a>
        </div>
      </header>

      {/* Quick Action Chips Horizontal Bar */}
      <div className="flex-none bg-slate-900/40 border-b border-slate-800/60 px-3 py-2 overflow-x-auto no-scrollbar flex items-center gap-2">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q.text)}
            className="flex-none whitespace-nowrap text-[11px] font-semibold text-slate-300 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/70 hover:border-slate-600 px-2.5 py-1 rounded-full active:scale-95 transition-all"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Message Chat Feed */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                m.role === 'user'
                  ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed break-words font-normal">
                {m.content}
              </div>

              <div
                className={`mt-1.5 text-[10px] flex items-center justify-between gap-3 ${
                  m.role === 'user' ? 'text-amber-950/70' : 'text-slate-500'
                }`}
              >
                <span>{m.timestamp}</span>
                {m.role === 'user' && <span>✓✓</span>}
              </div>
            </div>

            {/* Quick 1-Tap Action Buttons below AI messages */}
            {m.role === 'assistant' && m.id !== 'welcome' && (
              <div className="flex flex-wrap items-center gap-2 mt-2 ml-1">
                {/* 1-Tap Direct WhatsApp Share */}
                <button
                  type="button"
                  onClick={() => {
                    if (m.customerPhone) {
                      openWhatsApp(m.content, m.customerPhone);
                    } else {
                      setPhoneModalMsg(m.content);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-3 py-1.5 rounded-lg shadow-md shadow-emerald-950/40 transition-all"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                  <span>
                    {m.customerPhone ? `Send to Customer (${m.customerPhone})` : 'Send via WhatsApp'}
                  </span>
                </button>

                {/* Forward Duty Slip to Driver */}
                {m.isDutySlip && (
                  <button
                    type="button"
                    onClick={() => openWhatsApp(m.content, m.driverPhone || '918939539211')}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 active:scale-95 px-3 py-1.5 rounded-lg shadow-md transition-all"
                  >
                    <span>🚗 Send to Driver</span>
                  </button>
                )}

                {/* 1-Tap Copy */}
                <button
                  type="button"
                  onClick={() => handleCopy(m.content, m.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                >
                  <span>{copiedId === m.id ? '✓ Copied!' : '📋 Copy'}</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400 bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl w-fit">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Calculating rate & itinerary with master tariff...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Target Phone Modal (Optional popup if customer phone was not in text) */}
      {phoneModalMsg && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white">Send Quote via WhatsApp</h3>
            <p className="text-xs text-slate-400">
              Enter the customer phone number or tap 'Open WhatsApp' to pick a contact:
            </p>
            <input
              type="tel"
              placeholder="+91 or 10-digit customer mobile"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  openWhatsApp(phoneModalMsg, targetPhone);
                  setPhoneModalMsg(null);
                  setTargetPhone('');
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white py-2.5 rounded-xl transition-all"
              >
                Open in WhatsApp ➔
              </button>
              <button
                type="button"
                onClick={() => setPhoneModalMsg(null)}
                className="bg-slate-800 text-slate-300 font-semibold text-xs px-3 py-2.5 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Input Bar */}
      <footer className="flex-none bg-slate-900 border-t border-slate-800 p-2 sm:p-3 sticky bottom-0 z-30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2"
        >
          {/* Voice Mic Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`flex-none w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95'
            }`}
            title="Tap to speak"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>

          {/* Text Input Area */}
          <div className="flex-1 min-w-0 bg-slate-950 border border-slate-800 focus-within:border-amber-400 rounded-xl px-3 py-1.5 transition-all">
            <textarea
              rows={input.includes('\n') ? 3 : 1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isRecording ? 'Listening... Speak now...' : 'Paste WhatsApp notes or ask a quote...'}
              className="w-full bg-transparent text-[13px] text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex-none w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-slate-950 font-bold flex items-center justify-center active:scale-95 transition-all shadow-md shadow-amber-500/20"
          >
            <svg className="w-5 h-5 fill-current rotate-45 -mt-0.5" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}

