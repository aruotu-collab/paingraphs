import { PAINS } from "@/lib/catalog/data";
import { getJson, hash, storeSignal } from "./signals";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const COMMENT_SHAPE =
  /\b(i|i'm|i've|my|me|we|don't|doesn't|hurt|pain|too |wish|hate|annoying)\b/i;

type OpenAIResponse = {
  output?: {
    type?: string;
    content?: {
      type?: string;
      text?: string;
      annotations?: { type?: string; url?: string; title?: string }[];
    }[];
    action?: { sources?: { url?: string }[] };
  }[];
  output_text?: string;
  error?: { message?: string };
};

type PainHit = {
  quote?: string;
  title?: string;
  url?: string;
};

type SearchPass = {
  input: string;
  idPrefix: string;
  quoteLabel: string;
  commentsOnly: boolean;
};

export async function ingestOpenAISearch() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return 0;

  let stored = 0;
  for (const pain of PAINS) {
    const query = pain.searchPhrases[0];
    if (!query) continue;
    const commentQuery = pain.youtubeQueries[0] ?? query;

    stored += await runPass(key, pain.id, {
      idPrefix: "openai",
      quoteLabel: "OpenAI web search",
      commentsOnly: false,
      input: `Search the public web for recent consumer complaints and product-fit problems about: "${query}". Return JSON only: {"pains":[{"quote":"short real-world pain language","title":"page title","url":"https://..."}]}. 3 to 5 items. Quotes must be real, under 240 characters, and not invented. Skip reddit.`,
    });

    stored += await runPass(key, pain.id, {
      idPrefix: "openai-cmt",
      quoteLabel: "OpenAI comment",
      commentsOnly: true,
      input: `Search public comment threads for first-person complaints about: "${commentQuery}". Prefer YouTube comments, Amazon/Trustpilot/Which reviews, Head-Fi, Hacker News, and product Q&A. Do not use reddit. Return JSON only: {"pains":[{"quote":"verbatim first-person comment","title":"thread or video title","url":"https://..."}]}. 4 to 6 items. Quotes must be real comments, under 240 characters, and not invented.`,
    });
  }
  return stored;
}

async function runPass(key: string, painId: string, pass: SearchPass) {
  const data = await getJson<OpenAIResponse>("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      model: MODEL,
      tool_choice: "required",
      tools: [{ type: "web_search" }],
      include: ["web_search_call.action.sources"],
      input: pass.input,
    }),
  });

  let stored = 0;
  const hits = parseHits(outputText(data));

  for (const hit of hits.slice(0, pass.commentsOnly ? 6 : 5)) {
    const quote = cleanQuote(hit.quote ?? "");
    const url = safeUrl(hit.url);
    if (quote.length < 24) continue;
    if (pass.commentsOnly && !COMMENT_SHAPE.test(quote)) continue;
    const added = await storeSignal({
      id: `${pass.idPrefix}-${painId}-${hash(quote)}`,
      painId,
      rawQuote: quote,
      sourceKind: "openai",
      sourceLabel: pass.quoteLabel,
      sourceUrl: url,
    });
    if (added) stored += 1;
  }

  return stored;
}

function outputText(data: OpenAIResponse) {
  if (data.output_text?.trim()) return data.output_text;
  const parts: string[] = [];
  for (const item of data.output ?? []) {
    for (const block of item.content ?? []) {
      if (block.text) parts.push(block.text);
    }
  }
  return parts.join("\n");
}

function parseHits(text: string): PainHit[] {
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as { pains?: PainHit[] } | PainHit[];
    return Array.isArray(parsed) ? parsed : (parsed.pains ?? []);
  } catch {
    return [];
  }
}

function cleanQuote(value: string) {
  return value
    .replace(/^#+\s+/gm, "")
    .replace(/^\*\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function safeUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname.replace(/^www\./, "");
    if (host === "reddit.com" || host.endsWith(".reddit.com")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

