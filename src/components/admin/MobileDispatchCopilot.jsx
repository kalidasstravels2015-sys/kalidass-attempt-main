// src/components/admin/MobileDispatchCopilot.jsx
// 24/7 Mobile Cloud AI Dispatch Co-Pilot for Kalidass Travels
// Equipped with Google Gemini 3.8 Multi-Photo & PDF Document Vision & Live Google Search Grounding

import React, { useState, useRef, useEffect } from 'react';
import { cleanWhatsAppText } from '../../utils/cleanWhatsAppText';

// Starter prompt cards inspired by the official AI Fare Assistant
const STARTER_PROMPTS = [
  {
    icon: '📷',
    title: 'Multi-Photo & PDF Ticket Vision',
    desc: 'Extract details from multiple screenshots, IRCTC train/flight PDFs',
    prompt: 'Please read all attached photos and PDF documents carefully, extract all locations, dates, passenger count, luggage details, and calculate the verified Kalidass Travels rate.'
  },
  {
    icon: '📄',
    title: 'Analyze IRCTC / Flight PDF Ticket',
    desc: 'Extract PNR, arrival timing, train/terminal for chauffeur pickup',
    prompt: 'Please extract passenger names, train/flight number, scheduled arrival time, terminal/station, and draft an official Chauffeur Duty Slip.'
  },
  {
    icon: '🌐',
    title: 'Live Temple Darshan & Train Search',
    desc: 'Check live Tirupati tokens, temple timings & trains',
    prompt: 'Check today live darshan timings for Tirupati Balaji and explain token rules.'
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
  }
];

const QUICK_CHIPS = [
  { label: '📷 Analyze Attachments', prompt: 'Please read all attached photos and PDF tickets, extract all trip details and calculate the verified quote.' },
  { label: '📄 Read PDF Ticket', prompt: 'Extract PNR, station/terminal, scheduled arrival time, and prepare chauffeur pickup duty slip.' },
  { label: '🌐 Live Darshan Timings', prompt: 'Search Google live for today Tirupati Balaji darshan token rules and timings' },
  { label: '🚗 Ertiga 6+1 Rate', prompt: 'What is the per km rate and daily minimum for Maruti Ertiga 6+1 AC?' },
  { label: '⛰️ Tirupati 1-Day Package', prompt: 'Chennai to Tirupati 1-day package rates for Sedan and Ertiga with tolls included' },
  { label: '🚐 Tempo 12-Seater', prompt: 'Tempo Traveller 12-seater per km rate, driver bata, and minimum km per day' }
];

export default function MobileDispatchCopilot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [helplineOpen, setHelplineOpen] = useState(false);

  // Multiple attachments: array of { id, name, size, mimeType, isPdf, dataUrl, base64 }
  const [attachments, setAttachments] = useState([]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // Convert File to base64 attachment object
  const readFileAsAttachment = (file) => {
    return new Promise((resolve) => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');

      if (!isPdf && !isImage) {
        alert(`Skipped unsupported file: ${file.name}. Only photos (PNG, JPG, WEBP) and PDF documents are supported.`);
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64 = dataUrl.split(',')[1];
        resolve({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          mimeType: isPdf ? 'application/pdf' : (file.type || 'image/jpeg'),
          isPdf,
          dataUrl: isPdf ? null : dataUrl, // PDF doesn't need dataUrl for thumbnail
          base64
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments = [];
    for (const f of files) {
      const att = await readFileAsAttachment(f);
      if (att) newAttachments.push(att);
    }

    setAttachments((prev) => {
      const combined = [...prev, ...newAttachments];
      if (combined.length > 8) {
        alert('Maximum 8 attachments allowed at once. Extra files were trimmed.');
        return combined.slice(0, 8);
      }
      return combined;
    });

    e.target.value = '';
  };

  const handleRemoveAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Support clipboard paste (e.g. pasted screenshots or PDF files)
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const pastedFiles = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) pastedFiles.push(file);
      }
    }

    if (pastedFiles.length > 0) {
      const newAttachments = [];
      for (const f of pastedFiles) {
        const att = await readFileAsAttachment(f);
        if (att) newAttachments.push(att);
      }
      setAttachments((prev) => [...prev, ...newAttachments].slice(0, 8));
    }
  };

  const handleSend = async (userText) => {
    const query = (userText || input).trim();
    const filesToSend = [...attachments];

    // Must have at least text or attachments
    if ((!query && filesToSend.length === 0) || loading) return;

    setInput('');
    setAttachments([]);

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query || (filesToSend.length > 0 ? `Analyzed ${filesToSend.length} attached document(s)/photo(s)` : ''),
      attachments: filesToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      // Format payload for /api/admin/copilot
      const payloadFiles = filesToSend.map((f) => ({
        name: f.name,
        mimeType: f.mimeType,
        data: f.base64
      }));

      const res = await fetch('/api/admin/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: newHistory.map((m) => ({ role: m.role, content: m.content })),
          files: payloadFiles,
          // backwards compatibility for single image
          image: payloadFiles.length === 1 ? payloadFiles[0] : undefined
        })
      });

      let replyText = '';
      let groundingData = null;
      let usedModel = '';

      if (res.ok) {
        const data = await res.json();
        if (data?.reply) {
          replyText = data.reply;
          groundingData = data.grounding || null;
          usedModel = data.model || '';
        }
      } else {
        try {
          const errData = await res.json();
          if (errData?.error) {
            console.warn('API error from /api/admin/copilot:', errData.error);
            replyText = `Gemini response issue: ${errData.error}. Please try again or call Helpline +91 89395 39211.`;
          }
        } catch (_) {}
      }

      // Fallback to /api/ai-chat if copilot endpoint is unreachable (text-only)
      if (!replyText && payloadFiles.length === 0) {
        const fallbackRes = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
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
        replyText = 'Unable to fetch response from Gemini. Please check your internet connection or call Helpline +91 89395 39211.';
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
          grounding: groundingData,
          model: usedModel,
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
    setAttachments([]);
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
        elements.push(
          <div
            key={`veh-${idx}`}
            className="my-1.5 p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                🚗
              </span>
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                {vehMatch[1].trim()}
              </span>
            </div>
            <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 font-mono">
              {vehMatch[2].trim()}
            </span>
          </div>
        );
        return;
      }

      // Section header
      const isHeader = /^[0-9]+\.\s+[A-Za-z]/.test(trimmed) || /^[A-Z\s\(\)\:\-\—]{4,}\:?$/.test(trimmed);
      if (isHeader) {
        elements.push(
          <div
            key={`hd-${idx}`}
            className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white pt-2 pb-0.5 border-b border-slate-200/60 dark:border-white/10 mb-1"
          >
            {trimmed}
          </div>
        );
        return;
      }

      // Bullet point
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const bulletText = trimmed.replace(/^[•\-]\s*/, '');
        elements.push(
          <div key={`bl-${idx}`} className="flex items-start gap-2 py-0.5 text-xs text-slate-700 dark:text-slate-300">
            <span className="text-blue-500 font-bold shrink-0 leading-tight">•</span>
            <span className="leading-relaxed">{bulletText}</span>
          </div>
        );
        return;
      }

      // Default paragraph
      elements.push(
        <p key={`p-${idx}`} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {trimmed}
        </p>
      );
    });

    return elements;
  };

  return (
    <div
      onPaste={handlePaste}
      className="w-full h-full flex flex-col bg-white dark:bg-[#131314] text-slate-800 dark:text-[#E3E3E3] rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-white/10"
    >
      {/* Hidden File Input for Multiple Photos & PDF Documents */}
      <input
        type="file"
        id="copilot-file-upload"
        name="attachments"
        aria-label="Upload photos or PDF documents"
        ref={fileInputRef}
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={handleFilesChange}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TOP APP BAR: Google Gemini 3.8 Multi-Vision & Search Status   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-[#131314]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shrink-0 select-none z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4285F4]/20 via-[#9B72CB]/20 to-[#D96570]/20 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-2xs">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                AI Operations & Vision Co-Pilot
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Gemini 3.8 Flash
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                📷 Multi-Photo & PDF
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                🌐 Live Search
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
              <span>PDF Tickets • Multi-Screenshot Vision • Live Google Grounding</span>
            </div>
          </div>
        </div>

        {/* Top Actions: New Chat & Dispatch Helpline */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {(messages.length > 0 || attachments.length > 0) && (
            <button
              type="button"
              onClick={handleNewChat}
              className="px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
              title="Start a fresh conversation"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          {/* Quick Helpline Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setHelplineOpen(!helplineOpen)}
              className="px-2.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span>+91 89395 39211</span>
            </button>

            {helplineOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 shadow-xl p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="font-bold text-slate-900 dark:text-white mb-2">Dispatch Helplines</div>
                <div className="space-y-1.5">
                  <a
                    href="tel:+918939539211"
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                  >
                    <span>Primary Line</span>
                    <span className="font-mono font-bold text-emerald-600">89395 39211</span>
                  </a>
                  <a
                    href="tel:+919092303060"
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200"
                  >
                    <span>Dispatch Desk</span>
                    <span className="font-mono font-bold text-emerald-600">90923 03060</span>
                  </a>
                </div>
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
          /* Initial Welcome Hero State */
          <div className="py-6 px-2 flex flex-col items-center text-center select-none max-w-2xl mx-auto">
            <div className="relative mb-3 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl transform scale-150"></div>
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#4285F4]/20 via-[#9B72CB]/20 to-[#D96570]/20 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                </svg>
              </div>
            </div>

            <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight mb-1">
              Kalidass AI Operations & Vision Co-Pilot
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
              Powered by Google Gemini 3.8 Flash. Upload multiple customer WhatsApp screenshots, IRCTC / airline PDF tickets, or ask live questions with real-time Google search grounding.
            </p>

            {/* Quick Multi-Upload Feature Highlight Card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 border border-blue-500/30 flex items-center justify-between gap-3 cursor-pointer hover:border-blue-500/60 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0 text-left">
                <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                  📎
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Upload Multiple Photos or PDF Tickets
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Attach multiple WhatsApp screenshots, IRCTC e-tickets (PDF), flight vouchers, or toll receipts
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0">
                Attach Files
              </span>
            </div>

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
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

                  <div className={`max-w-[92%] sm:max-w-[82%] ${isUser ? 'ml-auto' : ''}`}>
                    <div
                      className={`p-4 rounded-2xl shadow-xs leading-normal ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-xs font-medium text-xs sm:text-sm whitespace-pre-wrap'
                          : 'bg-white dark:bg-[#1E1F20] text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {isUser ? (
                        <div>
                          {/* Attached Media Grid in User Bubble */}
                          {m.attachments && m.attachments.length > 0 && (
                            <div className="mb-2.5 flex flex-wrap gap-2">
                              {m.attachments.map((att, i) => (
                                <div key={i} className="relative group">
                                  {att.isPdf ? (
                                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/15 border border-white/25 text-white max-w-xs">
                                      <span className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                        PDF
                                      </span>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold truncate max-w-[140px] sm:max-w-[200px]">
                                          {att.name}
                                        </div>
                                        <div className="text-[10px] text-white/80">
                                          {(att.size / 1024).toFixed(0)} KB • Document
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <img
                                      src={att.dataUrl}
                                      alt={att.name || 'Attachment'}
                                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-white/30 shadow-xs hover:scale-105 transition-transform cursor-pointer"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* User Text */}
                          {m.content && <div>{m.content}</div>}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {renderMessageContent(m.content)}

                          {/* Live Google Search Grounding Badge */}
                          {m.grounding?.webQueries?.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                <span>🌐 Google Search Grounded:</span>
                                <span className="italic truncate max-w-xs">{m.grounding.webQueries.slice(0, 2).join(' • ')}</span>
                              </div>
                            </div>
                          )}

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
                                    <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  <span>Gemini 3.8 analyzing {attachments.length > 0 ? `${attachments.length} attachment(s) & ` : ''}query with live search...</span>
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

        {/* Multi-Attachment Preview Strip */}
        {attachments.length > 0 && (
          <div className="mb-2.5 p-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-blue-400/50 dark:border-blue-500/40 animate-in fade-in slide-in-from-bottom-1">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>📎 {attachments.length} File{attachments.length > 1 ? 's' : ''} Attached for Vision AI</span>
                <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                  (Photos & PDFs)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>+ Add More</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttachments([])}
                  className="text-[11px] font-semibold text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Scrollable Thumbnails / Document Badges */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group shrink-0 flex items-center gap-2 p-1.5 rounded-xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/10 shadow-2xs max-w-[190px]"
                >
                  {att.isPdf ? (
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center font-extrabold text-xs shrink-0 border border-red-500/20">
                      PDF
                    </div>
                  ) : (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-white/10 shrink-0"
                    />
                  )}
                  <div className="min-w-0 pr-5">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {att.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {(att.size / 1024).toFixed(0)} KB {att.isPdf ? '• Document' : '• Photo'}
                    </div>
                  </div>

                  {/* Individual Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-200 hover:bg-red-500 dark:bg-white/10 dark:hover:bg-red-500 text-slate-600 hover:text-white dark:text-slate-300 flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Add More Pill */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 h-13 px-3 rounded-xl border border-dashed border-slate-300 dark:border-white/20 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add file</span>
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
          {/* Photo / PDF Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
              attachments.length > 0
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
            }`}
            title="Attach multiple photos or PDF tickets"
          >
            <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {attachments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                {attachments.length}
              </span>
            )}
          </button>

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
            id="copilot-chat-input"
            name="prompt"
            aria-label="Ask anything, paste notes, or attach photos and PDFs"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              attachments.length > 0
                ? `Ask about these ${attachments.length} attachment(s) or leave blank to quote...`
                : 'Ask anything, paste notes, or attach photos/PDFs...'
            }
            className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none min-w-0"
            disabled={loading}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!input.trim() && attachments.length === 0) || loading}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              (input.trim() || attachments.length > 0) && !loading
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
