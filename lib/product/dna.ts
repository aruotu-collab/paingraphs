import { firstSentences } from "@/lib/ingest/text";
import type { PageExtract, ProductDna } from "@/lib/journeys/types";

const UNKNOWN = "Not stated on the page";

export async function extractProductDna(page: PageExtract): Promise<ProductDna> {
  try {
    const llm = await llmDna(page);
    if (llm) return llm;
  } catch (error) {
    console.warn("Product DNA failed, using page text:", error);
  }
  return heuristicDna(page);
}

function heuristicDna(page: PageExtract): ProductDna {
  const blob = `${page.title}\n${page.description}\n${page.headings.join("\n")}\n${page.text}`;
  const solves =
    firstSentences(page.description || page.headings[0] || page.title, 1) ||
    UNKNOWN;
  const forWho = detectWho(blob);
  return {
    name: (page.title || page.siteName).slice(0, 80),
    solves: solves.slice(0, 220),
    forWho,
    when: detectWhen(blob),
    competingAgainst: UNKNOWN,
    price: detectPrice(blob),
    keywords: keywordList(blob, page),
    summary: firstSentences(page.description || page.text, 2).slice(0, 280) || solves,
    mechanism: UNKNOWN,
    outcomes: [],
    audiences: forWho !== UNKNOWN ? [forWho] : [],
  };
}

function detectWho(text: string) {
  const pairs: [RegExp, string][] = [
    [/glasses|spectacles/i, "People who wear glasses"],
    [/gamer|gaming/i, "Gamers"],
    [/office|work from home|wfh|commute/i, "Office and commute users"],
    [/travel|flight|pillow/i, "Travellers"],
    [/parent|baby|toddler/i, "Parents"],
    [/sensitive skin|irritat/i, "People with sensitive skin"],
  ];
  return pairs.find(([pattern]) => pattern.test(text))?.[1] ?? UNKNOWN;
}

function detectWhen(text: string) {
  const sentence = text
    .split(/(?<=[.!?])\s+/)
    .find((part) =>
      /when |after |during |hour|long |all day|flight|call|session/i.test(part),
    );
  if (sentence) return firstSentences(sentence, 1).slice(0, 180);
  return UNKNOWN;
}

function detectPrice(text: string) {
  const match = text.match(/(?:£|\$|€)\s?\d[\d,]*(?:\.\d{2})?/);
  return match?.[0] ?? UNKNOWN;
}

function keywordList(_blob: string, page: PageExtract) {
  const words = `${page.title} ${page.description} ${page.headings.join(" ")}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);
  return [...new Set(words)].slice(0, 18);
}

type LlmDna = Partial<ProductDna> & { keywords?: string[] };

async function llmDna(page: PageExtract): Promise<ProductDna | null> {
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
            "Extract product DNA from a public product page. Use only facts stated on the page. If a field is not stated, use \"Not stated on the page\". Return JSON only.",
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
              price: "price if stated",
              mechanism: "how it claims to work",
              outcomes: "string[] of results it promises",
              audiences: "string[] of who it is for",
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
    price: String(parsed.price || fallback.price).slice(0, 40),
    keywords: [...new Set([...keywords, ...fallback.keywords])].slice(0, 18),
    summary: String(parsed.summary || fallback.summary).slice(0, 280),
    mechanism: String(parsed.mechanism || fallback.mechanism || UNKNOWN).slice(0, 180),
    outcomes: Array.isArray(parsed.outcomes)
      ? parsed.outcomes.map((item) => String(item).slice(0, 80)).slice(0, 6)
      : fallback.outcomes ?? [],
    audiences: Array.isArray(parsed.audiences)
      ? parsed.audiences.map((item) => String(item).slice(0, 80)).slice(0, 6)
      : fallback.audiences ?? [],
  };
}
