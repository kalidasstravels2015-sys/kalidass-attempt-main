// Shared in-memory buffer of recent calculations for Cloudflare Pages edge worker instances
export const recentQuotes = [];

export function addQuoteToBuffer(quote) {
  if (!quote || !quote.quoteId) return;
  const existingIdx = recentQuotes.findIndex(q => q.quoteId === quote.quoteId);
  if (existingIdx >= 0) {
    recentQuotes[existingIdx] = { ...recentQuotes[existingIdx], ...quote };
  } else {
    recentQuotes.unshift(quote);
    if (recentQuotes.length > 100) {
      recentQuotes.pop();
    }
  }
}

export function getRecentQuotes() {
  return [...recentQuotes];
}
