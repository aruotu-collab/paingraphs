import { slugify } from "@/lib/ingest/text";
import { campaignPackForHypothesis, defaultQuestions } from "./campaign";
import type { PageExtract, PainHypothesisView, ProductDna } from "./types";

type LlmHypothesis = {
  title?: string;
  h1?: string;
  problem?: string;
  audience?: string;
  analysis?: string;
  unmetNeed?: string;
  language?: string[];
};

export async function generateHypotheses(
  dna: ProductDna,
  page: PageExtract,
): Promise<PainHypothesisView[]> {
  try {
    const llm = await llmHypotheses(dna, page);
    if (llm.length > 0) return llm;
  } catch (error) {
    console.warn("Hypothesis generation failed, using heuristics:", error);
  }
  return heuristicHypotheses(dna);
}

function heuristicHypotheses(dna: ProductDna): PainHypothesisView[] {
  const seeds = [
    {
      title: `${dna.name} still leaves the original pain`,
      audience: dna.forWho,
      problem: dna.solves,
      unmetNeed: "The page claims a fix, but we do not yet know if buyers feel the pain strongly enough.",
    },
    {
      title: `Long-session discomfort with ${dna.name}`,
      audience: "People who use it for hours, not minutes",
      problem: `${dna.name} may be fine at first and fail after a long session.`,
      unmetNeed: "Current copy talks about features. The long-session complaint is untested.",
    },
    {
      title: `A hidden audience for ${dna.name}`,
      audience: "A group the product page does not name",
      problem: `${dna.name} might solve a sharper pain for people the brand is not talking to.`,
      unmetNeed: "Mainstream positioning may be leaving the converting audience unspoken.",
    },
    {
      title: `${dna.name} is too much hassle to keep using`,
      audience: "People who already bought something similar and stopped",
      problem: "Drop-off after purchase is often a different pain than the original listing.",
      unmetNeed: "We need to know if people abandon the category, not just whether they click ads.",
    },
  ];
  return seeds.slice(0, 4).map((seed) => toView(seed, dna));
}

function toView(
  seed: {
    title: string;
    audience: string;
    problem: string;
    unmetNeed: string;
    analysis?: string;
    h1?: string;
    language?: string[];
  },
  dna: ProductDna,
): PainHypothesisView {
  const h1 = seed.h1 ?? seed.title;
  const analysis =
    seed.analysis ??
    `PainGraphs has not proven this yet. It is a hypothesis generated from ${dna.name}: ${dna.summary}`;
  const item = {
    title: seed.title,
    h1,
    problem: seed.problem,
    audience: seed.audience,
    analysis,
    unmetNeed: seed.unmetNeed,
    matchScore: 0,
    origin: "inside-out" as const,
    customerLanguage: seed.language ?? [],
    questions: defaultQuestions(seed.title),
  };
  return {
    ...item,
    campaignPack: campaignPackForHypothesis(item, dna, `/test/${slugify(seed.title)}`),
  };
}

async function llmHypotheses(
  dna: ProductDna,
  page: PageExtract,
): Promise<PainHypothesisView[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return [];
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You generate unvalidated consumer-pain hypotheses from a product page. Each hypothesis is a problem a shopper feels, not a feature list. Do not claim the pain is proven. Return JSON { hypotheses: [...] } with 4 items.",
        },
        {
          role: "user",
          content: JSON.stringify({
            dna,
            title: page.title,
            description: page.description,
            text: page.text.slice(0, 1800),
            schema: {
              title: "short pain title",
              h1: "question-style heading",
              problem: "2 sentences, shopper language",
              audience: "who feels it",
              analysis: "why this might be overlooked",
              unmetNeed: "what current products miss",
              language: "string[] of plausible customer quotes, labelled as hypothesized",
            },
          }),
        },
      ],
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) return [];
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return [];
  const parsed = JSON.parse(raw) as { hypotheses?: LlmHypothesis[] };
  return (parsed.hypotheses ?? []).slice(0, 5).map((row) =>
    toView(
      {
        title: String(row.title || `${dna.name} pain`).slice(0, 90),
        h1: String(row.h1 || row.title || dna.name).slice(0, 110),
        problem: String(row.problem || dna.solves).slice(0, 400),
        audience: String(row.audience || dna.forWho).slice(0, 120),
        analysis: String(row.analysis || "").slice(0, 500),
        unmetNeed: String(row.unmetNeed || "").slice(0, 280),
        language: Array.isArray(row.language)
          ? row.language.map((item) => String(item).slice(0, 180))
          : [],
      },
      dna,
    ),
  );
}
