import type {
  ConsumerIntel,
  DiagnosticOption,
  DiagnosticQuestion,
} from "./types";

export type ConsultTurn = {
  question: DiagnosticQuestion;
  option: DiagnosticOption;
};

export function consultQuestions(consumer: ConsumerIntel): DiagnosticQuestion[] {
  const base = consumer.diagnostic.map(withSpokenCopy);
  if (base.some((question) => question.id === "tried")) return base;
  if (consumer.triedFirst.length === 0) return base;
  return [...base, triedQuestion(consumer)];
}

export function consultOpening(h1: string, consumer: ConsumerIntel): string {
  if (consumer.opening?.trim()) return consumer.opening.trim();
  const title = h1.replace(/\.$/, "");
  return `You came in with this: ${title}. Tap an answer, or drag a slider. I just need to know how it feels for you.`;
}

export function spokenAsk(
  question: DiagnosticQuestion,
  previous: ConsultTurn | null,
): string {
  const follow = previous?.option.nextAsk?.trim();
  if (follow) return follow;
  return question.ask?.trim() || question.prompt;
}

export function consultTurns(
  questions: DiagnosticQuestion[],
  answers: Record<string, string>,
): ConsultTurn[] {
  const turns: ConsultTurn[] = [];
  for (const question of questions) {
    const option = optionFromAnswer(question, answers[question.id]);
    if (!option) break;
    turns.push({ question, option });
  }
  return turns;
}

export function optionFromAnswer(
  question: DiagnosticQuestion,
  answer: string | undefined,
): DiagnosticOption | null {
  if (!answer) return null;
  const ids = answer.split(",").filter(Boolean);
  const picked = ids
    .map((id) => question.options.find((item) => item.id === id))
    .filter((item): item is DiagnosticOption => Boolean(item));
  if (picked.length === 0) return null;
  if (picked.length === 1) return picked[0];
  return {
    id: ids.join(","),
    label: picked.map((item) => item.label).join(", "),
    emphasize: unique(picked.flatMap((item) => item.emphasize)),
    factors: unique(picked.flatMap((item) => item.factors)),
    profileLabel: picked.map((item) => item.profileLabel).join(", "),
    hear: multiHear(picked),
    nextAsk: picked[picked.length - 1]?.nextAsk,
  };
}

export function consultClose(
  turns: ConsultTurn[],
  trap: string | null,
): string {
  const version = versionLabels(turns);
  const closing = trap?.trim();
  if (version && closing) {
    return `I know enough — ${version}. ${closing}`;
  }
  if (closing) return `I know enough. ${closing}`;
  if (version) {
    return `I know enough. For you: ${version}. Here is the kind that fits.`;
  }
  return "I know enough. Here is the kind that fits.";
}

export function consultSpec(turns: ConsultTurn[]): string[] {
  return unique(turns.flatMap((turn) => turn.option.factors)).slice(0, 6);
}

export function versionLabels(turns: ConsultTurn[]) {
  const prefer = ["discomfort", "duration", "current", "severity"];
  const picked = prefer
    .map((id) => turns.find((turn) => turn.question.id === id)?.option.profileLabel)
    .filter((item): item is string => Boolean(item));
  if (picked.length > 0) return picked.join(", ");
  return turns
    .map((turn) => turn.option.profileLabel)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
}

function withSpokenCopy(question: DiagnosticQuestion): DiagnosticQuestion {
  return {
    ...question,
    control: question.control || "choice",
    chart: question.chart?.trim() || question.prompt,
    ask: question.ask?.trim() || question.prompt,
    options: question.options.map((option) => ({
      ...option,
      hear: option.hear?.trim() || defaultHear(option),
    })),
  };
}

function defaultHear(option: DiagnosticOption): string {
  return `${option.label}. Got it.`;
}

function triedQuestion(consumer: ConsumerIntel): DiagnosticQuestion {
  const fail = consumer.usuallyFails[0];
  return {
    id: "tried",
    prompt: "What have you already tried?",
    ask: "What have you already tried? You can pick more than one.",
    chart: "Already tried",
    control: "multi",
    options: [
      ...consumer.triedFirst.slice(0, 4).map((item, index) => ({
        id: `tried-${index}`,
        label: item,
        emphasize: [],
        factors: [],
        profileLabel: item,
        hear: hearForTried(item, fail),
      })),
      {
        id: "tried-none",
        label: "Nothing yet",
        emphasize: [],
        factors: [],
        profileLabel: "no failed buy yet",
        hear: "Nothing yet. Then we can skip the usual wrong buy.",
      },
    ],
  };
}

function multiHear(picked: DiagnosticOption[]) {
  const pads = picked.find((item) =>
    /\b(pad|cushion|foam|plush)\b/i.test(item.label),
  );
  if (pads?.hear) return pads.hear;
  if (picked.some((item) => item.id.includes("none"))) {
    return picked[0]?.hear || "Nothing yet. Then we can skip the usual wrong buy.";
  }
  const labels = picked.map((item) => item.label);
  return `You already tried ${joinAnd(labels)}. I will not send you back through that. The next pair has to fit better, not add another extra.`;
}

function hearForTried(item: string, fail: string | undefined): string {
  const text = item.toLowerCase();
  if (/\b(pad|cushion|foam|plush)\b/.test(text)) {
    return fail
      ? `Softer pads. ${fail}`
      : "Soft pads rarely stop the squeeze that is actually hurting you.";
  }
  if (fail) {
    return `Got it. What usually fails next is this: ${fail}`;
  }
  return "Got it. That rarely stops the thing that is actually hurting you.";
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function joinAnd(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
