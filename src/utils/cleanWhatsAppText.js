/**
 * cleanWhatsAppText.js
 * Converts AI-generated text or markdown into clean, natural, human-friendly WhatsApp text.
 * Strictly removes irritating markdown headers (###, ##, #) and excessive asterisks (*Car:*, *Luggage:*).
 */
export function cleanWhatsAppText(text) {
  if (!text) return '';

  let clean = String(text);

  // 1. Remove markdown headers (### Heading, ## Heading, # Heading) -> clean title
  clean = clean.replace(/^#{1,6}\s*(?:\*)?([^*\n]+)(?:\*)?/gm, '$1');
  clean = clean.replace(/^#{1,6}\s+/gm, '');

  // 2. Remove multiple asterisks (***text*** or ****)
  clean = clean.replace(/\*{3,}/g, '');

  // 3. Remove annoying bold around bullet labels: e.g. "• *Car:* " -> "• Car: " or "*Luggage:* " -> "Luggage: "
  clean = clean.replace(/^\s*([•\-\*]?\s*)\*([^*:\n]+)\*:\s*/gm, '$1$2: ');

  // 4. Remove bold around section numbers: e.g. "*1. Title*" -> "1. Title"
  clean = clean.replace(/^\s*\*([0-9]+\.[^*\n]+)\*\s*$/gm, '$1');

  // 5. Convert standard markdown **bold** to WhatsApp single *bold* (only for entire important terms, not labels)
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '*$1*');

  // 6. Clean up bullets: normalize '-', '*' at start of line to clean bullet '• '
  clean = clean.replace(/^\s*[\-\*]\s+/gm, '• ');

  // 7. Strip out any WhatsApp click-to-chat links (wa.me or api.whatsapp.com) and associated CTA text
  // e.g. "📲 Send route on WhatsApp for quick quote (https://wa.me/...)"
  // e.g. "📲 WhatsApp us for instant booking (https://wa.me/...)"
  // e.g. "[👉 Confirm Booking on WhatsApp](https://wa.me/...)"
  clean = clean.replace(/\[(?:[^\]]*?(?:WhatsApp|quote|booking|route)[^\]]*?)\]\((?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)[^\)]*\)/gi, '');
  clean = clean.replace(/^[•\s\-\*📲👉]*.*?(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)[^\r\n]*(?:\r?\n|$)/gmi, '');
  clean = clean.replace(/\(https?:\/\/(?:wa\.me|api\.whatsapp\.com)[^)]*\)/gi, '');
  clean = clean.replace(/^[•\s\-\*📲👉]*(?:Send route on WhatsApp[^\r\n]*|WhatsApp us for[^\r\n]*|Confirm (?:this tour|booking) on WhatsApp[^\r\n]*|Book on WhatsApp[^\r\n]*)(?:\r?\n|$)/gmi, '');

  // 8. Remove markdown links [Text](url) -> Text (url) or just Text if anchor
  clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, title, rawUrl) => {
    const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';
    if (!url || url.startsWith('/') || url.startsWith('#')) return title;
    return `${title} (${url})`;
  });

  // 8. Clean up LaTeX formulas or code blocks
  clean = clean.replace(/```[a-z]*\n([\s\S]*?)```/g, '$1');
  clean = clean.replace(/`([^`]+)`/g, '$1');

  // 9. Clean up separator lines (like ━━━━━━━━ or ────── or ---) into a neat clean divider
  clean = clean.replace(/^[━─\-_=]{3,}$/gm, '--------------------------------');

  // 10. Collapse multiple consecutive empty lines to maximum 2
  clean = clean.replace(/\n{3,}/g, '\n\n');

  // 11. Remove trailing/leading whitespaces on each line
  clean = clean.split('\n').map(l => l.trimEnd()).join('\n').trim();

  return clean;
}
