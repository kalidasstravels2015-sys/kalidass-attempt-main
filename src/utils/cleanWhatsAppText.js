/**
 * cleanWhatsAppText.js
 * Converts AI-generated text or markdown into clean, natural, human-friendly WhatsApp text.
 * Strictly removes irritating markdown headers (###, ##, #) while preserving single-asterisk WhatsApp *bold*
 * and structured quote tags (:::QUOTE_OPTION_1:::, :::QUOTE_OPTION_2:::, :::BOOKING_META:::).
 */
export function cleanWhatsAppText(text) {
  if (!text) return '';

  let clean = String(text);

  // 1. Remove markdown headers (### Heading, ## Heading, # Heading) -> clean title
  clean = clean.replace(/^#{1,6}\s*(?:\*\*)?([^*\n]+)(?:\*\*)?/gm, '$1');
  clean = clean.replace(/^#{1,6}\s+/gm, '');

  // 2. Remove triple+ asterisks (***text*** -> *text*)
  clean = clean.replace(/\*{3,}([^*\n]+)\*{3,}/g, '*$1*');

  // 3. Convert standard markdown **bold** to WhatsApp single *bold*
  clean = clean.replace(/\*\*([^*\n]+)\*\*/g, '*$1*');

  // 4. Clean up markdown list bullets ('- ' or '* ' at start of line) to clean bullet '• '
  // (Only when followed by a space so we NEVER break *KALIDASS TRAVELS* bold lines!)
  clean = clean.replace(/^\s*[\-\*]\s+/gm, '• ');

  // 5. Strip out any WhatsApp click-to-chat links (wa.me or api.whatsapp.com) and associated CTA text
  clean = clean.replace(/\[(?:[^\]]*?(?:WhatsApp|quote|booking|route)[^\]]*?)\]\((?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)[^\)]*\)/gi, '');
  clean = clean.replace(/^[•\s\-\*📲👉]*.*?(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)[^\r\n]*(?:\r?\n|$)/gmi, '');
  clean = clean.replace(/\(https?:\/\/(?:wa\.me|api\.whatsapp\.com)[^)]*\)/gi, '');
  clean = clean.replace(/^[•\s\-\*📲👉]*(?:Send route on WhatsApp[^\r\n]*|WhatsApp us for[^\r\n]*|Confirm (?:this tour|booking) on WhatsApp[^\r\n]*|Book on WhatsApp[^\r\n]*)(?:\r?\n|$)/gmi, '');

  // 6. Remove markdown links [Text](url) -> Text (url) or just Text if anchor
  clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, title, rawUrl) => {
    const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';
    if (!url || url.startsWith('/') || url.startsWith('#')) return title;
    return `${title} (${url})`;
  });

  // 7. Clean up code fences (```text ... ```) without stripping structured :::QUOTE_OPTION_1::: tags
  clean = clean.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, '$1');
  clean = clean.replace(/`([^`\n]+)`/g, '$1');

  // 8. Clean up separator lines (like ━━━━━━━━ or ──────) into standard 37-dash WhatsApp divider
  clean = clean.replace(/^[━─_=]{3,}$/gm, '-------------------------------------');

  // 9. Prevent WhatsApp from turning numeric DD-MM-YYYY or DD/MM/YYYY dates into green phone links
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  clean = clean.replace(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](20\d{2})\b/g, (_, d, m, y) => {
    const mIdx = parseInt(m, 10) - 1;
    return `${String(d).padStart(2, '0')} ${months[mIdx] || m} ${y}`;
  });

  // 10. Convert numeric Q-DDMMYY-X ref IDs into non-clickable KT/DDMMM/XX and strip first-line (Ref: ...)
  clean = clean.replace(/^\*KALIDASS TRAVELS\*\s*\(Ref:\s*[^)]+\)/im, '*KALIDASS TRAVELS*');
  clean = clean.replace(/\bQ-(\d{2})(\d{2})\d{2}-(\d+)\b/gi, (_, dd, mm, seq) => {
    const mIdx = Math.max(0, Math.min(11, parseInt(mm, 10) - 1));
    const mUpper = (months[mIdx] || 'NOV').toUpperCase();
    return `KT/${dd}${mUpper}/${String(seq).padStart(2, '0')}`;
  });

  // 10b. Strip all emojis and icon characters from WhatsApp messages
  clean = clean.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0E}\u{FE0F}\u{200D}]/gu, '');
  clean = clean.replace(/^[ \t]+/gm, '');

  // 11. Collapse multiple consecutive empty lines to maximum 2
  clean = clean.replace(/\n{3,}/g, '\n\n');

  // 12. Remove trailing whitespaces on each line
  clean = clean.split('\n').map(l => l.trimEnd()).join('\n').trim();

  return clean;
}

