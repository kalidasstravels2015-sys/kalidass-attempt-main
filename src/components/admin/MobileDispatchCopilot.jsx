import React, { useState, useEffect, useRef } from 'react';
import { cleanWhatsAppText } from '../../utils/cleanWhatsAppText';

// Helper to sanitize HTML
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Starter prompt cards inspired by the official AI Fare Assistant
const STARTER_PROMPTS = [
  {
    icon: '🗺️',
    title: 'Multiple Places & Outstation Tour',
    desc: 'Calculate 2 or 3-day car cost with driver',
    prompt: 'We are going to multiple places. How do you calculate the outstation car cost for 2 or 3 days?'
  },
  {
    icon: '📋',
    title: 'Paste Customer WhatsApp Enquiry',
    desc: 'Extract dates, temples, luggage & get exact Ertiga plan',
    prompt: 'Landing chennai 11nov 10:15 am, 11 nov night train to madurai. Return 18nov from trv 8:50 am. 5 adults 1 child, 2 senior citizens. Main temples and sightseeing. Ertiga vehicle required. Please calculate simple, clean plan and cost.'
  },
  {
    icon: '⛰️',
    title: 'Tirupati Balaji Darshan Package',
    desc: '1-day & 2-day rates, ghat road permit included',
    prompt: 'How much for Chennai to Tirupati 1-day or 2-day package in Sedan and Ertiga?'
  },
  {
    icon: '🕉️',
    title: 'Kumbakonam Navagraha 9 Temples',
    desc: '3-day temple circuit in Ertiga & Innova',
    prompt: 'How much for Chennai to Kumbakonam 9 temples 3-day package in Ertiga and Innova?'
  },
  {
    icon: '🚐',
    title: 'Tempo Traveller & Force Urbania',
    desc: '12, 14, 20 & 26-seater group tariffs',
    prompt: 'What is the outstation per km rate for Tempo Traveller 12, 14, 20 seater and Force Urbania?'
  },
  {
    icon: '✈️',
    title: 'Chennai Airport Pickup / Drop',
    desc: 'Fixed transfer rates for Sedan, Ertiga & Innova',
    prompt: 'What are the Chennai Airport taxi rates for Sedan, Ertiga, and Innova Crysta?'
  }
];

const QUICK_CHIPS = [
  { label: '🗺️ Multiple Places Outstation', prompt: 'We are going to multiple places. How do you calculate the outstation car cost for 2 or 3 days?' },
  { label: '🚗 Ertiga 6+1 Rate', prompt: 'What is the per km rate and daily minimum for Maruti Ertiga 6+1 AC?' },
  { label: '⛰️ Tirupati 1-Day Package', prompt: 'Chennai to Tirupati 1-day package rates for Sedan and Ertiga with tolls included' },
  { label: '🚐 Tempo 12-Seater', prompt: 'Tempo Traveller 12-seater per km rate, driver bata, and minimum km per day' },
  { label: '✈️ Airport Drop', prompt: 'Chennai Airport transfer rates for Sedan and Ertiga' },
  { label: '🧑‍✈️ Acting Driver Rate', prompt: 'What are the acting driver charges for local city and outstation personal car?' }
];

export default function MobileDispatchCopilot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [helplineOpen, setHelplineOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Mobile voice recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

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

  const handleSend = async (userText) => {
    const query = (userText || input).trim();
    if (!query || loading) return;

    setInput('');
    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      // 1. Try dedicated Mobile Dispatch Copilot endpoint (/api/admin/copilot)
      const res = await fetch('/api/admin/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: newHistory.map(m => ({ role: m.role, content: m.content }))
        })
      });

      let replyText = '';
      if (res.ok) {
        const data = await res.json();
        if (data?.reply) {
          replyText = data.reply;
        }
      }

      // 2. Fallback to /api/ai-chat if copilot endpoint is unreachable
      if (!replyText) {
        const fallbackRes = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newHistory.map(m => ({ role: m.role, content: m.content })),
            sessionId: `OPS-COPILOT-${Date.now()}`,
            sourcePage: '/admin/copilot'
          })
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData?.reply) {
            replyText = fallbackData.reply;
          }
        }
      }

      if (!replyText) {
        replyText = 'Unable to fetch response. Please check your internet connection or call Helpline +91 89395 39211.';
      }

      // Strictly clean text for WhatsApp: NO ###, NO excess asterisks!
      let cleanReply = replyText;
      try {
        cleanReply = cleanWhatsAppText(replyText);
      } catch (e) {
        console.warn('cleanWhatsAppText error:', e);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: cleanReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Co-Pilot dispatch error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: 'Connection error. Please try again or call +91 89395 39211.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id, text) => {
    const clean = cleanWhatsAppText(text);
    navigator.clipboard.writeText(clean);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenWhatsApp = (text) => {
    const clean = cleanWhatsAppText(text);
    const url = `https://wa.me/?text=${encodeURIComponent(clean)}`;
    window.open(url, '_blank');
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

  // Render text cleanly: detect vehicle cards and style paragraphs/bullets nicely
  const renderMessageContent = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Empty line -> space
      if (!trimmed) {
        elements.push(<div key={`sp-${idx}`} className="h-2" />);
        return;
      }

      // Filter out redundant WhatsApp click-to-chat lines
      if (/(?:wa\.me|api\.whatsapp\.com|send route on whatsapp|whatsapp us for|confirm on whatsapp|book on whatsapp)/i.test(trimmed)) {
        return;
      }

      // Check if line looks like vehicle tariff: e.g. "Sedan: ₹14/km" or "• Maruti Ertiga: ₹17/km"
      const vehMatch = trimmed.match(/^(?:•\s*)?([A-Za-z0-9\s\+\(\)\/]+?)\s*:\s*(₹[0-9,\.\/A-Za-z\s\+\-]+)$/);
      const isVehicleLine = vehMatch && /(?:sedan|dzire|etios|ertiga|crysta|innova|tempo|urbania|car|suv)/i.test(vehMatch[1]);

      if (isVehicleLine) {
        const vName = vehMatch[1].trim();
        const vRate = vehMatch[2].trim();
        elements.push(
          <div
            key={`veh-${idx}`}
            className="my-1.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold shrink-0">
                🚗
              </span>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{vName}</div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{vRate}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenWhatsApp(`Kalidass Travels Quote:\n${vName} - ${vRate}\nHelpline: +91 89395 39211`)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              Share
            </button>
          </div>
        );
        return;
      }

      // Check if line is a clean section header (e.g. "1. Cab & Luggage Details" or "TOUR PLAN (DAY-BY-DAY):")
      const isHeader = /^[0-9]+\.\s+[A-Za-z]/.test(trimmed) || /^[A-Z\s\(\)\:\-\—]{4,}\:?$/.test(trimmed);

      if (isHeader) {
        elements.push(
          <div key={`h-${idx}`} className="font-bold text-xs sm:text-sm text-slate-900 dark:text-amber-400 mt-2 mb-1 tracking-tight">
            {trimmed}
          </div>
        );
        return;
      }

      // Clean bullet point line
      if (trimmed.startsWith('•')) {
        elements.push(
          <div key={`b-${idx}`} className="flex items-start gap-2 my-0.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            <span className="text-amber-500 dark:text-amber-400 shrink-0 font-bold">•</span>
            <span>{trimmed.substring(1).trim()}</span>
          </div>
        );
        return;
      }

      // Regular line
      elements.push(
        <div key={`p-${idx}`} className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          {trimmed}
        </div>
      );
    });

    return elements;
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#131314] text-slate-800 dark:text-[#E3E3E3] rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-white/10">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* TOP APP BAR: Google Ask Gemini & M3 Minimal Header            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-[#131314]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shrink-0 select-none z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 rounded-full bg-[#D97706]/10 dark:bg-amber-500/20 border border-[#D97706]/30 dark:border-amber-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-4 h-4 text-[#D97706] dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                AI Fare & Dispatch Assistant
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                24/7 Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              Clean WhatsApp replies • Zero irritating symbols • 100% human-readable
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Start fresh conversation"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {/* Helpline Call Button with Multi-Helpline Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setHelplineOpen(!helplineOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#006D3B] hover:bg-[#00532B] active:scale-95 text-xs font-semibold text-white transition-all shadow-xs cursor-pointer"
              title="Call 24/7 Helplines"
            >
              <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span>+91 89395 39211</span>
              <svg className={`w-2.5 h-2.5 transition-transform ${helplineOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {helplineOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#1E1F20] text-slate-800 dark:text-white rounded-2xl shadow-xl border border-slate-200 dark:border-white/15 p-2 space-y-1 z-50 animate-fadeIn">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  24/7 Dispatch Helplines
                </div>
                <a
                  href="tel:+918939539211"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <span>+91 89395 39211</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Primary</span>
                </a>
                <a
                  href="tel:+916381939769"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <span>+91 63819 39769</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Line 2</span>
                </a>
                <a
                  href="tel:+919092303060"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <span>+91 90923 03060</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Line 3</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN THREAD: Welcome Hero OR Active Chat Bubbles              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-sm bg-slate-50/60 dark:bg-[#131314] scroll-smooth">
        {messages.length === 0 ? (
          /* Initial Welcome Hero State matching AiFareAssistantModal */
          <div className="py-6 px-2 flex flex-col items-center text-center select-none max-w-2xl mx-auto">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-[#D97706]/10 dark:bg-amber-950/40 border border-[#D97706]/25 dark:border-amber-500/30 shadow-md flex items-center justify-center">
                <svg className="w-7 h-7 text-[#D97706] dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.2" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1.5">
              Plan Your Journey with Kalidass
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed mb-6">
              Instant tariff calculations, verified outstation rates, and clean WhatsApp replies without messy symbols.
            </p>

            {/* Vertically Stacked Prompt Starter Cards */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {STARTER_PROMPTS.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(sp.prompt)}
                  className="w-full p-3 rounded-2xl bg-white dark:bg-[#1E1F20] hover:bg-blue-50/60 dark:hover:bg-[#28292D] border border-slate-200 dark:border-white/10 hover:border-blue-400/60 transition-all duration-200 cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3 shadow-xs hover:shadow-md group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                      {sp.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {sp.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {sp.desc}
                      </div>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-6 max-w-sm leading-normal">
              100% verified rates follow the official Kalidass Travels rate card. Output is formatted for direct WhatsApp sharing.
            </p>
          </div>
        ) : (
          /* Active Chat Thread */
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4285F4]/20 via-[#9B72CB]/20 to-[#D96570]/20 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                      </svg>
                    </div>
                  )}

                  <div className={`max-w-[88%] sm:max-w-[80%] ${isUser ? 'ml-auto' : ''}`}>
                    <div
                      className={`p-4 rounded-2xl shadow-xs leading-normal ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-xs font-medium text-xs sm:text-sm whitespace-pre-wrap'
                          : 'bg-white dark:bg-[#1E1F20] text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {isUser ? (
                        m.content
                      ) : (
                        <div className="space-y-1">
                          {renderMessageContent(m.content)}

                          {/* Action Buttons under every Assistant Message */}
                          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {/* Open in WhatsApp */}
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsApp(m.content)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                                title="Open this clean message in WhatsApp"
                              >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.761.882 2.796.883h.005c3.179 0 5.767-2.587 5.767-5.766.001-3.187-2.575-5.77-5.772-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.353.101.173.449.741.964 1.201.663.591 1.221.774 1.394.86.173.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.203c.044.072.044.419-.1.824z" />
                                </svg>
                                <span>Send via WhatsApp</span>
                              </button>

                              {/* Copy Clean WhatsApp Text */}
                              <button
                                type="button"
                                onClick={() => handleCopy(m.id, m.content)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                                title="Copy clean plain text without any markdown or hashtags"
                              >
                                {copiedId === m.id ? (
                                  <>
                                    <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    <span>Copy Clean Text</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <span className="text-[10px] text-slate-400">{m.timestamp}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-3 w-full animate-pulse">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                </div>
                <div className="bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl rounded-tl-xs shadow-xs text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span>Calculating verified tariff & clean WhatsApp format...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* BOTTOM ACTION & INPUT BAR (Google Ask Gemini Design)           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <footer className="p-3 sm:p-4 bg-white dark:bg-[#131314] border-t border-slate-200 dark:border-white/10 shrink-0">
        {/* Voice Listening Status Banner */}
        {isRecording && (
          <div className="mb-2 px-3 py-1.5 rounded-2xl bg-red-500/10 dark:bg-red-500/15 border border-red-500/30 flex items-center justify-between text-xs text-red-600 dark:text-red-400 shadow-xs transition-all">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span className="font-semibold text-xs">Listening... Speak your trip query</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  recognitionRef.current?.stop();
                  setIsRecording(false);
                  if (input.trim()) handleSend(input.trim());
                }}
                className="px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => {
                  recognitionRef.current?.stop();
                  setIsRecording(false);
                }}
                className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-[10px] font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 select-none">
          {QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip.prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 text-[11px] font-semibold whitespace-nowrap transition-all active:scale-95 shrink-0 cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-white/20"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Capsule Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center bg-slate-100 dark:bg-[#1E1F20] rounded-full border border-slate-200 dark:border-white/10 focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-1.5 shadow-2xs"
        >
          {/* Voice Microphone Toggle */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isRecording
                ? 'bg-red-600 text-white animate-pulse'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
            }`}
            title="Speak your query"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about rates, outstation plans, or paste WhatsApp notes..."
            className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none min-w-0"
            disabled={loading}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              input.trim() && !loading
                ? 'bg-[#D97706] hover:bg-[#B45309] text-white shadow-xs active:scale-95'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Send query"
          >
            <svg className="w-4 h-4 fill-current rotate-90" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
