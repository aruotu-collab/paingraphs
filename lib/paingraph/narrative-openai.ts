import { openaiConfigured } from "@/lib/discovery/openai";
import { narrativeFromFacts, sanitizeNarrative } from "./narrative";
import type { NarrativeFacts } from "./narrative";
import { saveNarrative } from "./narrative-store";
import type { PainNarrative } from "./types";

function openaiModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export async function writeNarrativeWithOpenAI(facts: NarrativeFacts) {
  const fallback = narrativeFromFacts(facts);
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || !openaiConfigured()) return fallback;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: openaiModel(),
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Write a PainGraph Recognition Arc for a Google visitor. Use only the given facts. Second person. No invented quotes, products, prices, user counts, studies, or shop URLs. Do not mention affiliates, founders, or scores. Respond with json only: {\"hook\",\"scene\",\"mechanism\",\"failedLoop\",\"trap\",\"turn\"}.",
          },
          {
            role: "user",
            content: JSON.stringify({
              facts,
              beats: {
                hook: "3-5 sentences that make the reader feel seen.",
                scene: "The minute the pain shows up.",
                mechanism: "Why it happens, vivid but factual.",
                failedLoop: "What people already tried, as a short narrative.",
                trap: "What generic reviews get wrong.",
                turn: "One sentence that hands them to the first option.",
              },
            }),
          },
        ],
      }),
    });
    if (!response.ok) return fallback;
    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const parsed = JSON.parse(body.choices?.[0]?.message?.content || "{}") as Partial<PainNarrative>;
    const narrative = sanitizeNarrative(parsed, fallback);
    await saveNarrative(facts.id, narrative, "openai");
    return narrative;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
