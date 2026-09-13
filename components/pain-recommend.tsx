"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  comparisonRows,
  focusWeights,
  normalizePriorities,
  presetsFor,
  productAttributes,
  rankingReasons,
  rankProducts,
} from "@/lib/paingraph/rank";
import { saveRecommendationPreferences } from "@/lib/recommendations/actions";
import type {
  ConsumerIntel,
  DiagnosticOption,
  PainCriterion,
  Priorities,
  RecommendedProduct,
} from "@/lib/paingraph/types";

export function PainRecommend({
  painId,
  href,
  signedIn,
  savedPriorities,
  criteria,
  products,
  consumer,
  evidenceCount,
}: {
  painId: string;
  href: string;
  signedIn: boolean;
  savedPriorities: Priorities | null;
  criteria: PainCriterion[];
  products: RecommendedProduct[];
  consumer: ConsumerIntel;
  evidenceCount: number;
}) {
  const router = useRouter();
  const slugs = criteria.map((item) => item.slug);
  const presets = presetsFor(slugs);
  const questions = consumer.diagnostic;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [weights, setWeights] = useState<Priorities>(() =>
    normalizePriorities(savedPriorities ?? {}, slugs),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(Boolean(savedPriorities));

  const selected = questions
    .map((question) =>
      question.options.find((option) => option.id === answers[question.id]),
    )
    .filter((option): option is DiagnosticOption => Boolean(option));
  const diagnosticReady = questions.length > 0 && selected.length === questions.length;
  const profileLabel = selected.map((option) => option.profileLabel).join(" · ");
  const factors = unique(
    selected.flatMap((option) => option.factors).filter(Boolean),
  ).slice(0, 4);

  const ranked = useMemo(
    () => rankProducts(products, normalizePriorities(weights, slugs)),
    [products, weights, slugs],
  );
  const [best, ...rest] = ranked;

  function choose(questionId: string, option: DiagnosticOption) {
    const next = { ...answers, [questionId]: option.id };
    setAnswers(next);
    const picked = questions
      .map((question) =>
        question.options.find((item) => item.id === next[question.id]),
      )
      .filter((item): item is DiagnosticOption => Boolean(item));
    if (picked.length !== questions.length) return;
    const emphasize = unique(picked.flatMap((item) => item.emphasize));
    setWeights(focusWeights(slugs, emphasize));
    setSaved(false);
  }

  function setSlug(slug: string, value: number) {
    setWeights((current) => normalizePriorities({ ...current, [slug]: value }, slugs));
    setSaved(false);
  }

  async function savePreferences() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(href)}`);
      return;
    }
    setSaving(true);
    await saveRecommendationPreferences(painId, slugs, weights, href);
    setSaved(true);
    setSaving(false);
  }

  return (
    <div className="space-y-12">
      {questions.length > 0 ? (
        <section>
          <h2 className="font-display text-3xl">Quick diagnostic</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Two questions. The sliders below move to match your version of this
            pain. You can still change them.
          </p>
          <div className="mt-6 space-y-8">
            {questions.map((question) => (
              <div key={question.id}>
                <p className="text-sm text-paper">{question.prompt}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {question.options.map((option) => {
                    const active = answers[question.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => choose(question.id, option)}
                        className={
                          active
                            ? "border border-copper px-3 py-1.5 text-sm text-copper"
                            : "border border-line px-3 py-1.5 text-sm text-muted hover:border-copper hover:text-copper"
                        }
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {diagnosticReady ? (
            <div className="mt-6 max-w-2xl border border-copper p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-copper">
                Your pain profile
              </p>
              <p className="mt-2 font-display text-2xl">{profileLabel}</p>
              {factors.length > 0 ? (
                <>
                  <p className="mt-4 text-sm text-paper">
                    The most important factors for you are likely:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                    {factors.map((factor) => (
                      <li key={factor}>{factor}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-3xl">What usually helps</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
          These are the things people actually trade off. They feed the sliders.
          They are not a product pitch.
        </p>
        <ul className="mt-5 space-y-2 text-sm">
          {criteria.map((item) => (
            <li key={item.slug}>
              <span className="text-paper">{item.name}.</span>{" "}
              <span className="text-muted">{item.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      {consumer.mistakes.length > 0 || consumer.tradeoffs.length > 0 ? (
        <section>
          <h2 className="font-display text-3xl">Avoid these mistakes</h2>
          {consumer.mistakes.length > 0 ? (
            <ul className="mt-5 max-w-2xl space-y-3 text-sm leading-6 text-muted">
              {consumer.mistakes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {consumer.tradeoffs.length > 0 ? (
            <div className="mt-6 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.16em] text-copper">
                Common trade-offs
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                {consumer.tradeoffs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 className="font-display text-3xl">What matters most to you</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          {diagnosticReady
            ? "Sliders are set from your diagnostic. Move one if you would reject a product that fails it."
            : "Three to five controls. Move a slider right if you would reject a product that fails it. Rankings update immediately."}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setWeights(normalizePriorities(preset.weights, slugs));
                setSaved(false);
              }}
              className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-5">
          {criteria.map((item) => (
            <label key={item.slug} className="block">
              <span className="flex justify-between text-sm">
                <span>{item.name}</span>
                <span className="font-mono text-copper">
                  {Math.round(weights[item.slug] || 0)}%
                </span>
              </span>
              <p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p>
              <input
                type="range"
                min={0}
                max={100}
                value={weights[item.slug] || 0}
                onChange={(event) => setSlug(item.slug, Number(event.target.value))}
                className="mt-2 w-full accent-copper"
              />
            </label>
          ))}
        </div>
        <div className="mt-6">
          <button
            type="button"
            disabled={saving}
            onClick={() => void savePreferences()}
            className="border border-line px-4 py-2 text-sm text-paper hover:border-copper hover:text-copper disabled:opacity-60"
          >
            {signedIn
              ? saved
                ? "Preferences saved"
                : "Save my preferences"
              : "Save my preferences"}
          </button>
          <p className="mt-2 max-w-xl text-xs leading-5 text-muted">
            {signedIn
              ? "Keeps these sliders for you on this PainGraph. Rankings stay based on fit, not commission."
              : "Sign in to keep these sliders. You can still rank products without an account."}
          </p>
        </div>
      </section>

      {evidenceCount > 0 ? (
        <p className="text-xs text-muted">
          {evidenceCount === 1
            ? "Ranking confidence: 1 public complaint selected for this pain. That is the evidence we have, not a review score."
            : `Ranking confidence: ${evidenceCount} public complaints selected for this pain. That is the evidence we have, not a review score.`}
        </p>
      ) : null}

      {best ? (
        <section>
          <h2 className="font-display text-3xl">Best match for you</h2>
          <ProductMatch product={best} criteria={criteria} featured />
        </section>
      ) : (
        <p className="text-sm text-muted">
          Recommended product types will appear here once this PainGraph has
          scored options.
        </p>
      )}

      {rest.length > 0 ? (
        <section>
          <h2 className="font-display text-3xl">Other strong options</h2>
          <ul className="mt-5 space-y-3">
            {rest.map((product) => (
              <li key={product.id}>
                <ProductMatch product={product} criteria={criteria} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {ranked.length > 1 && criteria.length > 0 ? (
        <section>
          <h2 className="font-display text-3xl">Compare the options</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Same criteria, live with your sliders. Commission does not appear
            here.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="py-2 pr-3">Criterion</th>
                  {ranked.map((product) => (
                    <th key={product.id} className="py-2 pr-3">
                      {product.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows(ranked, criteria).map((row) => {
                  const top = Math.max(...row.values);
                  return (
                    <tr key={row.key} className="border-t border-line">
                      <td className="py-3 pr-3 text-paper">{row.name}</td>
                      {row.values.map((value, index) => (
                        <td
                          key={`${row.key}-${ranked[index].id}`}
                          className={
                            value === top
                              ? "py-3 pr-3 font-mono text-copper"
                              : "py-3 pr-3 font-mono text-muted"
                          }
                        >
                          {row.key === "match" ? `${value}%` : value}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {best ? (
        <section>
          <h2 className="font-display text-3xl">Why these ranked this way</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
            Each option is scored on the same criteria you weighted
            {diagnosticReady ? `, starting from “${profileLabel}”` : ""}.
            Product-fit is calculated before any affiliate destination.
            Commission does not move the ranking. A checkout link is added only
            when a verified URL is pasted.
          </p>
          {rankingReasons(ranked, criteria, weights).map(
            (reason) => (
              <p key={reason.name} className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                {reason.bestName} ranks above {reason.nextName} on{" "}
                {reason.name.toLowerCase()} ({reason.bestScore} vs {reason.nextScore}
                ), which you weighted {reason.weight}%.
              </p>
            ),
          )}
        </section>
      ) : null}
    </div>
  );
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function ProductMatch({
  product,
  criteria,
  featured = false,
}: {
  product: RecommendedProduct;
  criteria: PainCriterion[];
  featured?: boolean;
}) {
  const { strengths, drawbacks } = productAttributes(product, criteria);

  return (
    <article
      className={
        featured
          ? "mt-5 border border-copper p-5"
          : "border border-line p-4"
      }
    >
      <p className="text-xs uppercase tracking-[0.16em] text-copper">
        {product.match}% match
      </p>
      <h3 className={featured ? "mt-2 font-display text-2xl" : "mt-1 font-display text-xl"}>
        {product.name}
      </h3>
      <p className="mt-3 text-sm leading-6 text-muted">{product.summary}</p>
      <p className="mt-3 text-sm">{product.whoFor}</p>
      <p className="mt-2 text-sm text-muted">{product.note}</p>
      {strengths.length > 0 ? (
        <p className="mt-3 text-sm">
          <span className="text-paper">Strongest:</span>{" "}
          <span className="text-muted">
            {strengths.map((row) => row.name).join(", ")}
          </span>
        </p>
      ) : null}
      {drawbacks.length > 0 ? (
        <p className="mt-1 text-sm">
          <span className="text-paper">Drawbacks:</span>{" "}
          <span className="text-muted">
            {drawbacks.map((row) => row.name).join(", ")}
          </span>
        </p>
      ) : null}
      {product.priceBand ? (
        <p className="mt-3 font-mono text-xs text-copper">{product.priceBand}</p>
      ) : null}
      <CheckPrice href={product.destinationUrl} />
    </article>
  );
}

function CheckPrice({ href }: { href: string | null }) {
  if (href) {
    return (
      <a
        href={href}
        rel="nofollow sponsored"
        className="mt-4 inline-block bg-copper px-4 py-2 text-sm text-ink hover:bg-copper-2"
      >
        Check price
      </a>
    );
  }
  return (
    <p className="mt-4 text-xs leading-5 text-muted">
      Check price is added only when a verified destination URL is pasted.
      Rankings stay based on fit, not commission.
    </p>
  );
}
