import { CLUSTER_TEMPLATES } from "./taxonomy";
import { decodeEntities, firstSentences } from "./text";
import type { ExtractedSignal, FetchedDoc } from "./types";

const JOB_NOISE =
  /who is hiring|who wants to be hired|what are you working on|job board|hiring thread/i;

const SUPPLY_NOISE =
  /^(show hn|tell hn|launch hn|how hn):/i;

const ASK_DEMAND =
  /looking for|is there (a|an|any)|anyone (use|know|recommend)|alternative to|recommend (a|an)|how do(es)? you|tool for|app for|saas|i wish|need a (tool|app|way)|does anyone/i;

const SOFTWARE_SHAPE =
  /tool|app\b|saas|software|automat|invoice|crm\b|api\b|cli\b|spreadsheet|excel|dashboard|workflow|notif|schedul|quote|freelancer|agency|report|script|mcp\b|ide\b/i;

const SEEKING_CUSTOMERS =
  /looking for testers|looking for users|looking for beta|who'?s building|what are you working on/i;

const PAIN_PATTERNS = [
  /looking for (a |an )?(tool|app|software|saas|script|way|alternative)/i,
  /is there (a |an |any )?(tool|app|software|saas|way)/i,
  /does anyone (know|use|recommend|have)/i,
  /i wish (there was|i could|it would|there were)/i,
  /why is(n't| there no)/i,
  /hate (having to|that i have to|manually)/i,
  /(spend|spending|wastes?|wasting) (so much |too much )?(time|hours)/i,
  /manual(ly)? (process|work|copy|export|entry)/i,
  /(excel|google sheets|spreadsheet)s? (to |for )/i,
  /i('ll| will| would) pay/i,
  /sick of|fed up|so frustrating|nightmare to/i,
  /no good (tool|software|solution)/i,
  /how do you (handle|manage|deal with|chase)/i,
  /need a (tool|app|system) (to|for)/i,
  /chase(ing)? (invoices|payments|quotes|leads)/i,
];

const INTENT_RE =
  /i('ll| will| would) pay|happy to pay|budget|subscribe|looking to buy|recommend a paid|priced? at|\$\d+/i;

const HIGH_PAIN_RE =
  /hate|nightmare|hours (a|every|per) (day|week)|losing (money|jobs|clients)|fed up|sick of|overdue|going cold/i;

function detectCountry(text: string): "UK" | "US" | "GLOBAL" {
  const uk = /(uk\b|u\.k\.|britain|british|london|hmrc|vat\b|nhs\b|estate agent)/i;
  const us = /(\bus\b|u\.s\.|usa\b|american|irs\b|nyc\b|airbnb)/i;
  const hasUk = uk.test(text);
  const hasUs = us.test(text);
  if (hasUk && !hasUs) return "UK";
  if (hasUs && !hasUk) return "US";
  return "GLOBAL";
}

function detectWorkaround(text: string) {
  const hits = [
    "Excel",
    "Google Sheets",
    "spreadsheets",
    "WhatsApp",
    "Notion",
    "Airtable",
    "Zapier",
    "manual emails",
    "QuickBooks",
    "Xero",
    "Obsidian",
  ].filter((name) => new RegExp(`\\b${name}\\b`, "i").test(text));
  return hits[0] ?? null;
}

function detectPersona(text: string) {
  if (/agency|agencies/i.test(text)) return "Agency owner";
  if (/freelancer|contractor/i.test(text)) return "Freelancer";
  if (/trades|plumber|electrician|builder/i.test(text)) return "Owner-operator";
  if (/host|airbnb|cleaner/i.test(text)) return "Property manager";
  if (/estate agent|realtor/i.test(text)) return "Branch manager";
  if (/accountant|bookkeep/i.test(text)) return "Accountant";
  if (/founder|indie hacker/i.test(text)) return "Founder";
  if (/developer|engineer|cli|api/i.test(text)) return "Developer";
  return null;
}

function detectIndustry(text: string) {
  if (/agency|consultant|professional services/i.test(text)) return "Professional services";
  if (/freelancer|contractor/i.test(text)) return "Freelance";
  if (/trades|construction|plumber/i.test(text)) return "Construction";
  if (/airbnb|host|rental/i.test(text)) return "Hospitality";
  if (/estate agent|real estate|realtor/i.test(text)) return "Real estate";
  if (/invoice|vat|tax|bookkeep|account/i.test(text)) return "Finance";
  if (/developer|saas|cli|api|code/i.test(text)) return "Software";
  return null;
}

function detectNiche(text: string) {
  if (/agency/i.test(text)) return "Agencies";
  if (/freelancer|contractor/i.test(text)) return "Independent contractors";
  if (/trades|plumber|electrician/i.test(text)) return "Independent trades";
  if (/airbnb|host/i.test(text)) return "Short-term rental hosts";
  if (/estate agent|realtor/i.test(text)) return "Estate agents";
  if (/accountant/i.test(text)) return "Accountants";
  if (/developer|engineer/i.test(text)) return "Developers";
  if (/founder/i.test(text)) return "Founders";
  return null;
}

function matchTemplate(text: string) {
  let best: { slug: string; score: number } | null = null;
  const hay = text.toLowerCase();
  for (const template of CLUSTER_TEMPLATES) {
    let score = 0;
    for (const phrase of template.phrases) {
      if (hay.includes(phrase)) score += 3;
    }
    for (const keyword of template.keywords) {
      if (new RegExp(`\\b${keyword}\\b`, "i").test(hay)) score += 1;
    }
    if (!best || score > best.score) best = { slug: template.slug, score };
  }
  if (best && best.score >= 2) return best.slug;
  return null;
}

function isAskHn(doc: FetchedDoc) {
  return doc.sourceSlug === "hn" && /^ask hn:/i.test(doc.title);
}

function looksLikePain(doc: FetchedDoc) {
  const text = `${doc.title}\n${doc.body}`;
  if (JOB_NOISE.test(text) || SUPPLY_NOISE.test(doc.title) || SEEKING_CUSTOMERS.test(text)) {
    return false;
  }
  if (isAskHn(doc)) {
    return (
      ASK_DEMAND.test(text) &&
      text.replace(/\s+/g, " ").length > 32 &&
      (SOFTWARE_SHAPE.test(text) || Boolean(matchTemplate(text)))
    );
  }
  return PAIN_PATTERNS.some((pattern) => pattern.test(text));
}

function titleFromDoc(doc: FetchedDoc) {
  return decodeEntities(doc.title)
    .replace(/^ask hn:\s*/i, "")
    .replace(/^tell hn:\s*/i, "")
    .trim();
}

function heuristicExtract(doc: FetchedDoc): ExtractedSignal | null {
  if (!looksLikePain(doc)) return null;
  const text = `${doc.title}\n${doc.body}`;
  const quote =
    firstSentences(doc.body, 2) ||
    firstSentences(doc.title, 1) ||
    titleFromDoc(doc);
  if (quote.length < 24) return null;

  const intensity = HIGH_PAIN_RE.test(text) ? 0.86 : isAskHn(doc) ? 0.62 : 0.7;
  const purchaseIntent = INTENT_RE.test(text) ? 0.88 : ASK_DEMAND.test(text) ? 0.74 : 0.48;

  return {
    quote: quote.slice(0, 420),
    problemTitle: titleFromDoc(doc).slice(0, 120) || "Unmet software demand",
    summary: firstSentences(doc.body, 1).slice(0, 240) || quote.slice(0, 240),
    personaGuess: detectPersona(text),
    workaround: detectWorkaround(text),
    intensity,
    purchaseIntent,
    industryHint: detectIndustry(text),
    nicheHint: detectNiche(text),
    countryHint: detectCountry(text),
    templateSlug: matchTemplate(text),
  };
}

type LlmPayload = {
  isPain?: boolean;
  quote?: string;
  problemTitle?: string;
  summary?: string;
  persona?: string | null;
  workaround?: string | null;
  intensity?: number;
  purchaseIntent?: number;
  industry?: string | null;
  niche?: string | null;
  country?: "UK" | "US" | "GLOBAL" | null;
};

async function llmExtract(doc: FetchedDoc): Promise<ExtractedSignal | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract unmet demand from a public post. Return JSON only. If it is not a real pain or buying-intent software problem, set isPain=false.",
        },
        {
          role: "user",
          content: JSON.stringify({
            title: doc.title,
            body: doc.body.slice(0, 1600),
            schema: {
              isPain: "boolean",
              quote: "short verbatim quote",
              problemTitle: "3-8 word problem name",
              summary: "one sentence",
              persona: "string|null",
              workaround: "string|null",
              intensity: "0-1",
              purchaseIntent: "0-1",
              industry: "string|null",
              niche: "string|null",
              country: "UK|US|GLOBAL|null",
            },
          }),
        },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = JSON.parse(raw) as LlmPayload;
  if (!parsed.isPain || !parsed.quote || !parsed.problemTitle) return null;
  const text = `${doc.title}\n${doc.body}`;
  return {
    quote: String(parsed.quote).slice(0, 420),
    problemTitle: String(parsed.problemTitle).slice(0, 120),
    summary: String(parsed.summary ?? parsed.quote).slice(0, 240),
    personaGuess: parsed.persona ?? detectPersona(text),
    workaround: parsed.workaround ?? detectWorkaround(text),
    intensity: clamp01(parsed.intensity ?? 0.65),
    purchaseIntent: clamp01(parsed.purchaseIntent ?? 0.55),
    industryHint: parsed.industry ?? detectIndustry(text),
    nicheHint: parsed.niche ?? detectNiche(text),
    countryHint: parsed.country ?? detectCountry(text),
    templateSlug: matchTemplate(`${parsed.problemTitle} ${text}`),
  };
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

export async function extractSignal(doc: FetchedDoc): Promise<ExtractedSignal | null> {
  try {
    const llm = await llmExtract(doc);
    if (llm) return llm;
  } catch (error) {
    console.warn("LLM extract failed, using heuristic:", error);
  }
  return heuristicExtract(doc);
}
