const JUNK_SOURCES = new Set([
  "Vertex AI Search source",
  "OpenAI web search source",
  "OpenAI comment source",
  "Search Console",
  "Keyword Planner",
  "Custom Search index size",
]);

const HOST_OR_URL =
  /^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s]*)?\.?$/i;
const COMMENT_SHAPE =
  /\b(i|i'm|i've|i’d|id|my|me|we|don't|doesn't|didn't|hurt|pain|too |wish|hate|annoying|leak|sting|rub|gap|smell|chafe|dig)\b/i;

export type ComplaintQuote = {
  quote: string;
  source: string;
  url: string | null;
};

export function cleanComplaintQuote(value: string) {
  return value
    .replace(/""+/g, "")
    .replace(/^#+\s+\*?\*?[^\n]*\*?\*?/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\s*\*\s*["“]/g, ". ")
    .replace(/\*\s*/g, " ")
    .replace(/^["“”'\s.]+|["“”'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isInformativeQuote(input: { quote: string; source: string }) {
  if (JUNK_SOURCES.has(input.source)) return false;
  if (/#{1,6}|discretion (failures|complaints|anxiety)/i.test(input.quote)) {
    return false;
  }
  const quote = cleanComplaintQuote(input.quote);
  if (quote.length < 28) return false;
  if (quote.split(/\s+/).length < 5) return false;
  if (HOST_OR_URL.test(quote)) return false;
  if (!/[a-z]/i.test(quote)) return false;
  if (/web index for|impressions,|monthly searches/i.test(quote)) return false;
  return true;
}

export function informativeQuotes(rows: ComplaintQuote[]) {
  const seen = new Set<string>();
  const kept: ComplaintQuote[] = [];
  for (const row of rows) {
    const quote = cleanComplaintQuote(row.quote);
    if (!isInformativeQuote({ quote: row.quote, source: row.source })) continue;
    const key = quote.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push({ ...row, quote });
  }
  return kept.sort((a, b) => b.quote.length - a.quote.length);
}
