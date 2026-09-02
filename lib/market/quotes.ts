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

const NEEDS_COMPLAINT_VOICE = new Set([
  "Vertex AI Search app",
  "Custom Search result",
]);

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

export function isInformativeQuote(input: {
  quote: string;
  source: string;
}) {
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
  if (/^(noise|discretion)\b/i.test(quote) && /failures|complaints|anxiety/i.test(quote)) {
    return false;
  }
  if (NEEDS_COMPLAINT_VOICE.has(input.source) && !COMMENT_SHAPE.test(quote)) {
    return false;
  }
  return true;
}

export function looksLikeSpokenComplaint(quote: string) {
  return COMMENT_SHAPE.test(cleanComplaintQuote(quote));
}

const STOP = new Set([
  "about",
  "after",
  "because",
  "being",
  "could",
  "people",
  "product",
  "products",
  "problem",
  "protection",
  "should",
  "their",
  "there",
  "these",
  "those",
  "using",
  "which",
  "would",
]);

export function topicTokens(text: string) {
  return [
    ...new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 5 && !STOP.has(word)),
    ),
  ];
}

export function matchesTopic(quote: string, tokens: string[]) {
  if (tokens.length === 0) return true;
  const haystack = quote.toLowerCase();
  return tokens.some((token) =>
    new RegExp(`\\b${escapeRegExp(token)}`).test(haystack),
  );
}

const TRUSTED_SOURCES =
  /reddit|youtube|composite of repeated public review language/i;

export function informativeQuotes(rows: ComplaintQuote[], topic?: string) {
  const tokens = topic ? topicTokens(topic) : [];
  const seen = new Set<string>();
  const kept: ComplaintQuote[] = [];
  for (const row of rows) {
    const quote = cleanComplaintQuote(row.quote);
    if (!isInformativeQuote({ quote: row.quote, source: row.source })) continue;
    if (
      tokens.length > 0 &&
      !TRUSTED_SOURCES.test(row.source) &&
      !matchesTopic(quote, tokens)
    ) {
      continue;
    }
    const key = quote.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push({ ...row, quote });
  }
  return collapseNearDuplicates(kept).sort((a, b) => scoreQuote(b) - scoreQuote(a));
}

function collapseNearDuplicates(rows: ComplaintQuote[]) {
  const longestFirst = [...rows].sort((a, b) => b.quote.length - a.quote.length);
  const kept: ComplaintQuote[] = [];
  for (const row of longestFirst) {
    const key = row.quote.toLowerCase();
    const fingerprint = key.slice(0, 72);
    if (
      kept.some((other) => {
        const otherKey = other.quote.toLowerCase();
        return otherKey.startsWith(fingerprint) || key.startsWith(otherKey.slice(0, 72));
      })
    ) {
      continue;
    }
    kept.push(row);
  }
  return kept;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreQuote(row: ComplaintQuote) {
  let score = Math.min(row.quote.length, 220);
  if (COMMENT_SHAPE.test(row.quote)) score += 80;
  if (/reddit|youtube|openai discovery|openai comment|composite/i.test(row.source)) {
    score += 40;
  }
  return score;
}
