import { cleanComplaintQuote } from "./quotes";
import type { PainEvidence } from "./types";

const FIRST_PERSON =
  /\b(i|i'm|i’ve|i've|my|me|we|our|hurts|hurt|pain|sting|leak|rub|chafe|dig|squeeze|press)\b/i;

function fingerprint(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4)
    .slice(0, 8)
    .join(" ");
}

function similar(a: string, b: string) {
  const left = new Set(a.split(" "));
  const right = new Set(b.split(" "));
  let shared = 0;
  for (const word of left) {
    if (right.has(word)) shared += 1;
  }
  return shared >= 3;
}

function clipComplaint(raw: string) {
  let text = cleanComplaintQuote(raw)
    .replace(/^(in my experience|anyway|so today|update)[:.\s-]+/i, "")
    .trim();
  if (!FIRST_PERSON.test(text)) return null;

  const sentence = text.split(/(?<=[.!?])\s+/).find((part) => part.length >= 32) ?? text;
  let line = sentence.trim();
  if (line.length < 32) return null;
  if (line.length > 140) {
    line = `${line.slice(0, 137).replace(/\s+\S*$/, "")}…`;
  }
  return line.replace(/["“”]/g, "").trim();
}

export function experienceFromComments(evidence: PainEvidence[], limit = 4) {
  const ranked = [...evidence].sort((a, b) => {
    const aFirst = FIRST_PERSON.test(a.quote) ? 0 : 1;
    const bFirst = FIRST_PERSON.test(b.quote) ? 0 : 1;
    if (aFirst !== bFirst) return aFirst - bFirst;
    return Math.abs(90 - a.quote.length) - Math.abs(90 - b.quote.length);
  });

  const lines: string[] = [];
  const seen: string[] = [];
  for (const row of ranked) {
    const line = clipComplaint(row.quote);
    if (!line) continue;
    const mark = fingerprint(line);
    if (!mark || seen.some((item) => similar(item, mark))) continue;
    seen.push(mark);
    lines.push(line);
    if (lines.length >= limit) break;
  }
  return lines;
}
