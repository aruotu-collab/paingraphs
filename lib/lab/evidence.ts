import { getJson } from "@/lib/ingest/signals";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export type EvidenceResult = {
  signalCount: number;
  quotes: string[];
  commercialLanguage: string[];
  sources: string[];
  strongEnough: boolean;
  note: string;
};

type OpenAIResponse = {
  output_text?: string;
  output?: { content?: { text?: string }[] }[];
};

export async function verifyPainEvidence(
  title: string,
  problem: string,
): Promise<EvidenceResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return {
      signalCount: 0,
      quotes: [],
      commercialLanguage: [],
      sources: [],
      strongEnough: false,
      note: "No OpenAI key — hypothesis left unvalidated.",
    };
  }

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
      input: `Search the public web for real consumer complaints about: "${title}". Context: ${problem}. Do not use reddit. Return JSON only: {"count": number, "quotes":["short real quotes"], "commercial":["how do I stop","best for"], "sources":["https://..."], "strong": true|false, "note":"one sentence"}. Quotes must be real, under 180 characters, not invented. If evidence is thin, set strong false and count low.`,
    }),
  });

  const text =
    data.output_text?.trim() ||
    data.output?.flatMap((item) => item.content ?? []).map((block) => block.text ?? "").join("\n") ||
    "";
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) {
    return {
      signalCount: 0,
      quotes: [],
      commercialLanguage: [],
      sources: [],
      strongEnough: false,
      note: "Web search did not return usable evidence.",
    };
  }
  try {
    const parsed = JSON.parse(json) as {
      count?: number;
      quotes?: string[];
      commercial?: string[];
      sources?: string[];
      strong?: boolean;
      note?: string;
    };
    const quotes = (parsed.quotes ?? []).map((item) => String(item).slice(0, 180)).slice(0, 5);
    const count = Number(parsed.count) || quotes.length;
    const strong = Boolean(parsed.strong) && count >= 3 && quotes.length >= 2;
    return {
      signalCount: count,
      quotes,
      commercialLanguage: (parsed.commercial ?? []).map(String).slice(0, 6),
      sources: (parsed.sources ?? []).map(String).slice(0, 6),
      strongEnough: strong,
      note: String(parsed.note || (strong ? "Enough independent complaints to score." : "Too little evidence to score.")).slice(0, 240),
    };
  } catch {
    return {
      signalCount: 0,
      quotes: [],
      commercialLanguage: [],
      sources: [],
      strongEnough: false,
      note: "Could not parse evidence search.",
    };
  }
}

export type ProgrammeLead = {
  name: string;
  network: string;
  commission: string;
  cookie: string;
  price: string;
  fit: number;
  evidence: string;
  sources: string[];
};

export async function researchProgrammes(painTitle: string, problem: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return [] as ProgrammeLead[];
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
      input: `Find real affiliate programmes or merchant products that could solve this consumer pain: "${painTitle}". ${problem}. Return JSON {"programmes":[{"name":"","network":"ClickBank|Awin|Amazon|direct|unknown","commission":"only if verified on a public page","cookie":"only if verified","price":"","fit":0-100,"evidence":"why it fits","sources":["https://..."]}]}. 3 to 6 items. Never invent an affiliate tracking/HopLink URL. If commission is unknown, say "unverified". Prefer programmes with a public affiliate signup page.`,
    }),
  });
  const text =
    data.output_text?.trim() ||
    data.output?.flatMap((item) => item.content ?? []).map((block) => block.text ?? "").join("\n") ||
    "";
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as { programmes?: ProgrammeLead[] };
    return (parsed.programmes ?? []).slice(0, 6).map((row) => ({
      name: String(row.name || "").slice(0, 120),
      network: String(row.network || "unknown").slice(0, 40),
      commission: String(row.commission || "unverified").slice(0, 80),
      cookie: String(row.cookie || "unverified").slice(0, 40),
      price: String(row.price || "unverified").slice(0, 40),
      fit: Math.max(0, Math.min(100, Number(row.fit) || 0)),
      evidence: String(row.evidence || "").slice(0, 280),
      sources: Array.isArray(row.sources) ? row.sources.map(String).slice(0, 4) : [],
    }));
  } catch {
    return [];
  }
}
