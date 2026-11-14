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

  // 9. Collapse multiple consecutive empty lines to maximum 2
  clean = clean.replace(/\n{3,}/g, '\n\n');

  // 10. Remove trailing whitespaces on each line
  clean = clean.split('\n').map(l => l.trimEnd()).join('\n').trim();

  return clean;
}

