import { CLUSTER_TEMPLATES } from "@/lib/ingest/taxonomy";
import { firstSentences, tokens } from "@/lib/ingest/text";
import type { PageExtract, ProblemDna } from "./types";

const UNKNOWN = "Not stated on the page";

const PERSONAS: [RegExp, string][] = [
  [/agenc(y|ies)|consultant/i, "Agency owners"],
  [/freelancer|contractor|indie hacker/i, "Freelancers"],
  [/founder|startup/i, "Founders"],
  [/developer|engineer|programmer/i, "Developers"],
  [/estate agent|realtor/i, "Estate agents"],
  [/accountant|bookkeep/i, "Accountants"],
  [/tradespeople|\bplumber|\belectrician|\btrades\b/i, "Owner-operators"],
  [/airbnb|property manager|short-stay|short-term rental/i, "Property managers"],
  [/sales team|\bcrm\b|pipeline|lead follow/i, "Sales teams"],
];

const TOOLS = [
  "Excel",
  "Google Sheets",
  "Salesforce",
  "HubSpot",
  "Notion",
  "Airtable",
  "Zapier",
  "Slack",
  "Jira",
  "Linear",
  "Monday",
  "Asana",
  "Trello",
  "QuickBooks",
  "Xero",
  "Mailchimp",
  "Pipedrive",
  "WhatsApp",
  "spreadsheets",
];

export async function extractProblemDna(page: PageExtract): Promise<ProblemDna> {
  try {
    const llm = await llmDna(page);
    if (llm) return llm;
  } catch (error) {
    console.warn("LLM Problem DNA failed, using page text:", error);
  }
  return heuristicDna(page);
}

function heuristicDna(page: PageExtract): ProblemDna {
  const blob = `${page.title}\n${page.description}\n${page.headings.join("\n")}\n${page.text}`;
  const solves =
    firstSentences(page.description || page.headings[0] || page.title, 1) ||
    UNKNOWN;
  const forWho = PERSONAS.find(([pattern]) => pattern.test(blob))?.[1] ?? UNKNOWN;
  const when = detectWhen(blob);
  const competingAgainst = detectCompetitors(blob);
  const keywords = [
    ...tokens(page.description),
    ...tokens(page.headings.join(" ")),
    ...tokens(competingAgainst === UNKNOWN ? "" : competingAgainst),
    ...tokens(page.title),
  ].filter((word, index, all) => all.indexOf(word) === index);
  for (const template of CLUSTER_TEMPLATES) {
    if (template.keywords.some((word) => new RegExp(`\\b${word}\\b`, "i").test(blob))) {
      for (const word of template.keywords) {
        if (!keywords.includes(word)) keywords.push(word);
      }
    }
  }

  return {
    name: page.siteName || hostnameFallback(page.url),
    solves: solves.slice(0, 220),
    forWho,
    when,
    competingAgainst,
    keywords: keywords.slice(0, 18),
    summary: firstSentences(page.description || page.text, 2).slice(0, 280) || solves,
  };
}

function detectWhen(text: string) {
  const sentence = text
    .split(/(?<=[.!?])\s+/)
    .find((part) =>
      /when |after |before |every (day|week|month)|manually|follow-?up|report|invoice|lead/i.test(
        part,
      ),
    );
  if (sentence) return firstSentences(sentence, 1).slice(0, 180);
  return UNKNOWN;
}

function detectCompetitors(text: string) {
  const hits = TOOLS.filter((name) => new RegExp(`\\b${name}\\b`, "i").test(text));
  return hits.slice(0, 4).join(", ") || UNKNOWN;
}

function hostnameFallback(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type LlmDna = {
  name?: string;
  solves?: string;
  forWho?: string;
  when?: string;
  competingAgainst?: string;
  keywords?: string[];
  summary?: string;
};

async function llmDna(page: PageExtract): Promise<ProblemDna | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const fallback = heuristicDna(page);
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
            "Extract Problem DNA from a product page. Use only facts stated on the page. If a field is not stated, use \"Not stated on the page\". Return JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            url: page.url,
            title: page.title,
            description: page.description,
            headings: page.headings,
            text: page.text.slice(0, 2500),
            schema: {
              name: "product name",
              solves: "the problem it claims to solve",
              forWho: "who it is for",
              when: "when the problem shows up",
              competingAgainst: "workarounds or incumbents named on the page",
              keywords: "string[] of matching terms",
              summary: "one sentence",
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
  const parsed = JSON.parse(raw) as LlmDna;
  const keywords = Array.isArray(parsed.keywords)
    ? parsed.keywords.map((word) => String(word).toLowerCase()).filter(Boolean)
    : fallback.keywords;
  return {
    name: String(parsed.name || fallback.name).slice(0, 80),
    solves: String(parsed.solves || fallback.solves).slice(0, 220),
    forWho: String(parsed.forWho || fallback.forWho).slice(0, 120),
    when: String(parsed.when || fallback.when).slice(0, 180),
    competingAgainst: String(parsed.competingAgainst || fallback.competingAgainst).slice(
      0,
      160,
    ),
    keywords: [...new Set([...keywords, ...fallback.keywords])].slice(0, 18),
    summary: String(parsed.summary || fallback.summary).slice(0, 280),
  };
}
