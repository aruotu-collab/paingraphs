"use client";

import { useMemo, useState, type ReactNode } from "react";
import { PainConsult, versionLine } from "@/components/pain-consult";
import {
  consultOpening,
  consultQuestions,
  consultSpec,
  consultTurns,
} from "@/lib/paingraph/consult";
import {
  focusWeights,
  normalizePriorities,
  productAttributes,
  rankProducts,
} from "@/lib/paingraph/rank";
import type {
  ConsumerIntel,
  DiagnosticOption,
  DiagnosticQuestion,
  PainCriterion,
  Priorities,
  RecommendedProduct,
} from "@/lib/paingraph/types";

export function PainRecommend({
  h1,
  savedPriorities,
  criteria,
  products,
  consumer,
  closeLine,
  after,
}: {
  h1: string;
  savedPriorities: Priorities | null;
  criteria: PainCriterion[];
  products: RecommendedProduct[];
  consumer: ConsumerIntel;
  closeLine: string | null;
  after?: ReactNode;
}) {
  const slugs = criteria.map((item) => item.slug);
  const questions = useMemo(() => consultQuestions(consumer), [consumer]);
  const opening = consultOpening(h1, consumer);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [skipped, setSkipped] = useState(false);
  const [weights, setWeights] = useState<Priorities>(() =>
    defaultWeights(savedPriorities, slugs),
  );

  const turns = consultTurns(questions, answers);
  const heard =
    !skipped && questions.length > 0 && turns.length === questions.length;
  const ready = skipped || heard || questions.length === 0;
  const version = versionLine(turns);

  const ranked = useMemo(
    () => rankProducts(products, normalizePriorities(weights, slugs)),
    [products, weights, slugs],
  );
  const best = ranked[0] ?? null;
  const spec = turns.length > 0 ? consultSpec(turns) : [];
  const needed = unique(turns.flatMap((turn) => turn.option.emphasize));
  const fits = best
    ? ranked.filter((product) => productFitsSpec(product, best, needed))
    : [];

  function applyAnswers(next: Record<string, string>) {
    setAnswers(next);
    const picked = consultTurns(questions, next).map((turn) => turn.option);
    if (picked.length === 0) {
      setWeights(defaultWeights(savedPriorities, slugs));
      return;
    }
    const emphasize = unique(picked.flatMap((item) => item.emphasize));
    setWeights(focusWeights(slugs, emphasize));
  }

  function choose(question: DiagnosticQuestion, option: DiagnosticOption) {
    const index = questions.findIndex((item) => item.id === question.id);
    const next = { ...answers, [question.id]: option.id };
    for (let i = index + 1; i < questions.length; i += 1) {
      delete next[questions[i].id];
    }
    applyAnswers(next);
  }

  function undo() {
    const last = [...questions].reverse().find((question) => answers[question.id]);
    if (!last) return;
    revisit(last);
  }

  function revisit(question: DiagnosticQuestion) {
    setSkipped(false);
    const index = questions.findIndex((item) => item.id === question.id);
    if (index < 0) return;
    const next = { ...answers };
    for (let i = index; i < questions.length; i += 1) {
      delete next[questions[i].id];
    }
    applyAnswers(next);
  }

  return (
    <div className="space-y-12">
      <PainConsult
        opening={opening}
        questions={questions}
        answers={answers}
        trap={closeLine}
        skipped={skipped}
        onChoose={choose}
        onUndo={undo}
        onRevisit={revisit}
        onSkip={() => setSkipped(true)}
        onResume={() => setSkipped(false)}
      />

      {ready ? (
        <>
          {best ? (
            <>
              <section id="start-here" className="scroll-mt-28 max-w-2xl">
                <h2 className="font-display text-3xl">The kind you need</h2>
                <p className="mt-5 font-display text-4xl leading-tight">{best.name}</p>
                <p className="mt-4 text-base leading-7 text-paper">{best.summary}</p>
                {spec.length > 0 ? (
                  <ul className="mt-5 space-y-2 text-sm leading-6 text-paper">
                    {spec.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-copper" />
                        <span>{sentence(item)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {version ? (
                  <p className="mt-4 text-sm leading-6 text-muted">
                    This spec comes from what you told me: {version}.
                  </p>
                ) : skipped ? (
                  <p className="mt-4 text-sm leading-6 text-muted">
                    This is the usual kind for this pain. Finish the questions if
                    you want a spec tuned to you.
                  </p>
                ) : null}
                <p className="mt-4 text-sm leading-7 text-muted">
                  <span className="text-paper">The downside. </span>
                  {tradeoffLine(best, criteria)}
                </p>
              </section>

              <section className="max-w-2xl">
                <h2 className="font-display text-3xl">Products that fit</h2>
                <ul className="mt-5 space-y-3">
                  {fits.map((product) => (
                    <li key={product.id}>
                      <ProductCard
                        product={product}
                        featured={product.id === best.id}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <p id="start-here" className="text-sm text-muted">
              A product kind will appear here once this PainGraph has scored
              options.
            </p>
          )}
          {after ? <div className="max-w-2xl">{after}</div> : null}
        </>
      ) : null}
    </div>
  );
}

function defaultWeights(saved: Priorities | null, slugs: string[]): Priorities {
  if (saved && Object.values(saved).some((value) => value > 0)) {
    return normalizePriorities(saved, slugs);
  }
  return focusWeights(slugs, slugs.slice(0, 2));
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function sentence(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function productFitsSpec(
  product: RecommendedProduct,
  best: RecommendedProduct,
  needed: string[],
) {
  if (product.id === best.id) return true;
  const specScore = needed.length
    ? average(
        needed
          .map((slug) => product.scores[slug])
          .filter((score): score is number => score != null),
      )
    : product.match;
  const bestScore = needed.length
    ? average(
        needed
          .map((slug) => best.scores[slug])
          .filter((score): score is number => score != null),
      )
    : best.match;
  if (specScore == null || bestScore == null) return false;
  return specScore >= 70 && specScore >= bestScore - 8;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function tradeoffLine(
  product: RecommendedProduct,
  criteria: PainCriterion[],
) {
  const { drawbacks } = productAttributes(product, criteria);
  if (product.note.trim()) return product.note;
  if (drawbacks[0]) {
    return `You give some ${drawbacks[0].name.toLowerCase()} to get the job done.`;
  }
  return product.summary;
}

function ProductCard({
  product,
  featured = false,
}: {
  product: RecommendedProduct;
  featured?: boolean;
}) {
  return (
    <article
      className={
        featured ? "border border-copper p-5" : "border border-line p-4"
      }
    >
      <h3 className={featured ? "font-display text-2xl" : "font-display text-xl"}>
        {product.name}
      </h3>
      <p className="mt-3 text-sm leading-6 text-paper">{product.whoFor}</p>
      {product.priceBand ? (
        <p className="mt-3 font-mono text-xs text-copper">{product.priceBand}</p>
      ) : null}
      <CheckPrice href={product.destinationUrl} featured={featured} />
    </article>
  );
}

function CheckPrice({
  href,
  featured = false,
}: {
  href: string | null;
  featured?: boolean;
}) {
  if (href) {
    return (
      <a
        href={href}
        rel="nofollow sponsored"
        className={
          featured
            ? "mt-5 inline-block bg-copper px-6 py-3 text-base text-ink hover:bg-copper-2"
            : "mt-4 inline-block bg-copper px-4 py-2 text-sm text-ink hover:bg-copper-2"
        }
      >
        See a shop link
      </a>
    );
  }
  return (
    <p className="mt-4 text-xs leading-5 text-muted">
      No live shop link for this kind yet.
    </p>
  );
}
