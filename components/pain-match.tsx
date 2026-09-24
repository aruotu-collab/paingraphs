"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PainSlider } from "@/components/pain-slider";
import {
  concernColor,
  concernName,
  defaultProfile,
  evidenceConfidence,
  importanceLabel,
  productColor,
  rankMatches,
  type PainProfile,
  type RankedMatch,
} from "@/lib/paingraph/match";
import { encodeProfile } from "@/lib/paingraph/profile-url";
import { keepMatch } from "@/lib/recommendations/actions";
import type {
  PainCriterion,
  PainEvidence,
  RecommendedProduct,
} from "@/lib/paingraph/types";

export function PainMatch({
  painId,
  href,
  h1,
  signedIn,
  saved,
  savedProfile,
  criteria,
  products,
  evidenceCount,
  evidence,
  after,
}: {
  painId: string;
  href: string;
  h1: string;
  signedIn: boolean;
  saved: boolean;
  savedProfile: PainProfile | null;
  criteria: PainCriterion[];
  products: RecommendedProduct[];
  evidenceCount: number;
  evidence: PainEvidence[];
  after?: ReactNode;
}) {
  const slugs = criteria.map((item) => item.slug);
  const baseline = savedProfile ?? defaultProfile(slugs);
  const [profile, setProfile] = useState<PainProfile>(baseline);
  const [hideBreakers, setHideBreakers] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [tab, setTab] = useState<"compare" | "why" | "buyers">("compare");
  const [openKind, setOpenKind] = useState<string | null>(null);
  const ranked = useMemo(
    () => rankMatches(products, criteria, profile),
    [products, criteria, profile],
  );
  const visible = hideBreakers ? ranked.filter((item) => !item.blocked) : ranked;
  const top = visible.slice(0, 3);
  const extra = Math.max(visible.length - 3, 0);
  const confidence = evidenceConfidence(evidenceCount);
  const leadConcern = [...criteria].sort(
    (left, right) =>
      (profile.importances[right.slug] ?? 0) - (profile.importances[left.slug] ?? 0),
  )[0];

  useEffect(() => {
    const encoded = encodeProfile(profile, slugs);
    const url = new URL(window.location.href);
    url.searchParams.set("m", encoded);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [profile, slugs]);

  function setImportance(slug: string, value: number) {
    setProfile((current) => ({
      ...current,
      importances: { ...current.importances, [slug]: value },
      breakers:
        value >= 10
          ? current.breakers.includes(slug)
            ? current.breakers
            : [...current.breakers, slug]
          : current.breakers.filter((item) => item !== slug),
    }));
  }

  return (
    <div className="match-studio text-[#16301c]">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl leading-tight text-[#12281a] md:text-[2.7rem] md:leading-[1.15]">
            {findLine(h1)}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#5d7263]">
            Everyone’s situation is different. Move the sliders for what bothers
            you, and we’ll rank the kinds that fit — instantly. Open a kind to
            see named products. Shop links appear only when a real listing has
            been pasted.
          </p>
        </div>
        <aside className="w-full max-w-sm rounded-2xl border border-[#f3d4c6] bg-[#fdeee6] p-5 text-sm leading-6 text-[#6a4a3d] shadow-sm">
          <p className="font-medium text-[#c45c3a]">
            Personalised. Unbiased. Grounded in this PainGraph.
          </p>
          <p className="mt-2">
            Fit comes from what you said matters, plus this PainGraph’s scores.
            Not a medical result, and not ranked by commission.
          </p>
        </aside>
      </div>

      <ol className="mt-8 flex flex-wrap gap-3 text-sm">
        <Step n="1" label="Tell us what matters" current />
        <Step n="2" label="See your matches" />
        <Step n="3" label="Open a kind, then check names" />
      </ol>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <section className="rounded-3xl border border-[#d7e2d4] bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                How much do these pains matter?
              </h2>
              <p className="mt-1 text-sm text-[#5d7263]">
                Each line is a pain. Slide how true it is for you — the ranking
                moves as you do.
              </p>
            </div>
            <button
              type="button"
              className="text-sm text-[#1f8a4d] hover:underline"
              onClick={() => setProfile(defaultProfile(slugs))}
            >
              Reset
            </button>
          </div>
          <ul className="mt-6 space-y-4">
            {criteria.map((item, index) => {
              const value = profile.importances[item.slug] ?? 0;
              const color = concernColor(index);
              return (
                <li key={item.slug} className="space-y-2 border-t border-[#eef3ea] pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <span
                        className="mt-1.5 size-2.5 shrink-0 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="text-sm font-medium leading-6">
                        {concernName(item)}
                      </span>
                    </div>
                    <p className="shrink-0 text-right text-sm">
                      <span className="font-semibold">{value}</span>
                      <span className="ml-1 text-xs text-[#5d7263]">
                        {importanceLabel(value)}
                      </span>
                    </p>
                  </div>
                  <PainSlider
                    label={`${concernName(item)} importance`}
                    value={value}
                    color={color}
                    valueText={`${value} ${importanceLabel(value)}`}
                    onChange={(next) => setImportance(item.slug, next)}
                  />
                </li>
              );
            })}
          </ul>
          <label className="mt-6 flex items-center gap-2 text-sm text-[#3f6b4c]">
            <input
              type="checkbox"
              checked={hideBreakers}
              onChange={(event) => setHideBreakers(event.target.checked)}
              className="size-4 accent-[#1f8a4d]"
            />
            Deal breakers only — hide kinds that miss a must-have
          </label>
        </section>

        <section className="rounded-3xl border border-[#cfe8d4] bg-[#f3fbf4] p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Your top matches</h2>
              <p className="text-sm text-[#5d7263]">
                Based on your current preferences
              </p>
            </div>
            <span className="rounded-full bg-[#1f8a4d] px-3 py-1 text-xs text-white">
              Live results
            </span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {top.map((product, index) => (
              <MatchCard
                key={product.id}
                product={product}
                rank={index + 1}
                confidence={confidence}
                painId={painId}
                path={href}
                open={openKind === product.id}
                onOpen={() =>
                  setOpenKind((current) =>
                    current === product.id ? null : product.id,
                  )
                }
              />
            ))}
          </div>
          <KindListings
            product={visible.find((item) => item.id === openKind) ?? null}
            painId={painId}
            path={href}
            onClose={() => setOpenKind(null)}
          />
          {extra > 0 ? (
            <p className="mt-4 text-center text-sm text-[#1f8a4d]">
              {extra} more kind{extra === 1 ? "" : "s"} ranked below
            </p>
          ) : null}
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-[#d7e2d4] bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <TabButton current={tab === "compare"} onClick={() => setTab("compare")}>
            Compare side by side
          </TabButton>
          <TabButton current={tab === "why"} onClick={() => setTab("why")}>
            Why these match
          </TabButton>
          <TabButton current={tab === "buyers"} onClick={() => setTab("buyers")}>
            How people describe this
          </TabButton>
          <label className="ml-auto flex items-center gap-2 text-[#5d7263]">
            Show as numbers
            <input
              type="checkbox"
              checked={showNumbers}
              onChange={(event) => setShowNumbers(event.target.checked)}
              className="size-4 accent-[#1f8a4d]"
            />
          </label>
        </div>

        {tab === "compare" ? (
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
            <div>
              <h3 className="text-lg font-semibold">
                How the top kinds match your concerns
              </h3>
              <p className="mt-1 text-sm text-[#5d7263]">
                Longer bars = better match for your needs. This is suitability,
                not a medical score.
              </p>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr>
                      <th className="py-2 pr-3 font-medium text-[#5d7263]">
                        Your concerns
                      </th>
                      {top.map((product, index) => (
                        <th key={product.id} className="px-2 py-2 font-medium">
                          <span
                            className="mr-1 inline-block size-2 rounded-full"
                            style={{ background: productColor(index) }}
                          />
                          {shortName(product.name)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((item, row) => (
                      <tr key={item.slug}>
                        <th className="whitespace-nowrap py-2.5 pr-3 font-normal">
                          <span
                            className="mr-2 inline-block size-2 rounded-full"
                            style={{ background: concernColor(row) }}
                          />
                          {concernName(item)}
                        </th>
                        {top.map((product, index) => {
                          const score = product.scores[item.slug] ?? 0;
                          return (
                            <td key={product.id} className="px-2 py-2.5">
                              {showNumbers ? (
                                <span className="font-medium">{score}</span>
                              ) : (
                                <div className="h-4 rounded-full bg-[#eef3ea]">
                                  <div
                                    className="h-4 rounded-full"
                                    style={{
                                      width: `${score}%`,
                                      background: productColor(index),
                                      opacity: 0.45 + (score / 100) * 0.55,
                                    }}
                                  />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <WhyCards
              criteria={criteria}
              products={top}
              lead={leadConcern}
              profile={profile}
            />
          </div>
        ) : null}

        {tab === "why" ? (
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {top.map((product) => (
              <li key={product.id} className="rounded-2xl border border-[#d7e2d4] p-4">
                <p className="text-sm font-semibold">{product.name}</p>
                <p className="mt-2 text-2xl font-semibold text-[#1f8a4d]">
                  {product.match}%
                </p>
                <p className="mt-2 text-sm leading-6 text-[#5d7263]">{product.why}</p>
              </li>
            ))}
          </ul>
        ) : null}

        {tab === "buyers" ? (
          <div className="mt-6 max-w-3xl">
            <p className="text-sm leading-6 text-[#5d7263]">
              These lines are from public complaints selected for this pain,
              not star ratings or review counts.
            </p>
            {evidence.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {evidence.slice(0, 4).map((item) => (
                  <li key={item.quote} className="text-sm leading-6">
                    “{item.quote}”
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[#5d7263]">
                No selected complaint lines on this PainGraph yet.
              </p>
            )}
          </div>
        ) : null}
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <FootNote title="Grounded in this pain">
          Insights from selected public complaints, not a fake review score.
        </FootNote>
        <FootNote title="No commission ranking">
          Fit is calculated before any shop link. Commission does not move the
          order.
        </FootNote>
        <KeepMatch
          signedIn={signedIn}
          saved={saved}
          painId={painId}
          href={href}
          slugs={slugs}
          profile={profile}
        />
      </div>

      {after ? <div className="mt-6">{after}</div> : null}
    </div>
  );
}

function MatchCard({
  product,
  rank,
  confidence,
  painId,
  path,
  open,
  onOpen,
}: {
  product: RankedMatch;
  rank: number;
  confidence: string;
  painId: string;
  path: string;
  open: boolean;
  onOpen: () => void;
}) {
  const tags = product.bestFor.slice(0, 3);
  return (
    <article
      className={
        open
          ? "flex h-full flex-col rounded-2xl border-2 border-[#1f8a4d] bg-white p-4"
          : rank === 1
            ? "flex h-full flex-col rounded-2xl border-2 border-[#1f8a4d] bg-white p-4"
            : "flex h-full flex-col rounded-2xl border border-[#d7e2d4] bg-white p-4"
      }
    >
      <div
        className="relative h-28 overflow-hidden rounded-xl"
        style={{
          background: `linear-gradient(180deg, ${productColor(rank - 1)}33, #eef6ef)`,
        }}
      >
        <span className="absolute left-2 top-2 rounded-md bg-[#16301c] px-2 py-0.5 text-xs text-white">
          #{rank}
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-[#1f8a4d] px-2 py-1 text-xs font-semibold text-white">
          {product.match}% match
        </span>
        <span className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center">
          <span className="h-2.5 w-5 rounded-t-md bg-white/90" />
          <span className="h-[4.25rem] w-10 rounded-[1.15rem] bg-white/85 shadow-sm" />
        </span>
      </div>
      <h3 className="mt-3 text-sm font-semibold leading-5">{product.name}</h3>
      {product.priceBand ? (
        <p className="mt-1 text-sm font-semibold">{product.priceBand}</p>
      ) : null}
      {product.blocked ? (
        <p className="mt-2 text-xs leading-5 text-[#b45309]">
          Misses a deal breaker
        </p>
      ) : (
        <p className="mt-2 text-xs text-[#5d7263]">
          Evidence confidence: {confidence}
        </p>
      )}
      <ul className="mt-3 space-y-1 text-xs leading-5 text-[#3f6b4c]">
        {tags.map((tag) => (
          <li key={tag}>✓ {sentence(tag)}</li>
        ))}
      </ul>
      <div className="mt-auto space-y-2 pt-4">
        <button
          type="button"
          onClick={onOpen}
          className={
            open
              ? "block w-full rounded-lg bg-[#1f8a4d] px-3 py-2 text-center text-sm text-white"
              : "block w-full rounded-lg bg-[#e7f6ea] px-3 py-2 text-center text-sm text-[#1f8a4d] hover:bg-[#d5efdb]"
          }
        >
          {open ? "Hide named products" : "See named products"}
        </button>
        <ShopLink
          href={product.destinationUrl}
          featured={false}
          painId={painId}
          path={path}
        />
      </div>
    </article>
  );
}

function KindListings({
  product,
  painId,
  path,
  onClose,
}: {
  product: RankedMatch | null;
  painId: string;
  path: string;
  onClose: () => void;
}) {
  if (!product) return null;
  const names = product.listings ?? [];
  return (
    <div
      id="kind-listings"
      className="mt-5 rounded-2xl border border-[#cfe8d4] bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#1f8a4d]">
            Named products
          </p>
          <h3 className="mt-1 text-lg font-semibold">{product.name}</h3>
          <p className="mt-1 text-sm text-[#5d7263]">
            Pasted listings for this kind. Fit already came from your sliders —
            commission does not change the order.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-[#1f8a4d] hover:underline"
        >
          Close
        </button>
      </div>
      {names.length > 0 ? (
        <ul className="mt-4 divide-y divide-[#eef3ea]">
          {names.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-[#5d7263]">{item.merchant}</p>
              </div>
              <a
                href={item.href}
                rel="nofollow sponsored"
                className="rounded-lg bg-[#1f8a4d] px-3 py-1.5 text-sm text-white hover:bg-[#187a42]"
                onClick={() => {
                  void fetch("/api/event", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      kind: "paingraph_click",
                      path,
                      painId,
                    }),
                    keepalive: true,
                  });
                }}
              >
                See shop link
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[#5d7263]">
          No named products pasted for this kind yet. The kind still ranks from
          what you said matters.
        </p>
      )}
    </div>
  );
}

function WhyCards({
  criteria,
  products,
  lead,
  profile,
}: {
  criteria: PainCriterion[];
  products: RankedMatch[];
  lead: PainCriterion | undefined;
  profile: PainProfile;
}) {
  if (products.length === 0) return null;
  const cards = buildCallouts(criteria, products, lead, profile);
  return (
    <ul className="space-y-3">
      {cards.map((card) => (
        <li
          key={`${card.kicker}-${card.title}`}
          className="rounded-2xl border border-[#d7eadc] bg-[#f7fcf8] p-4"
        >
          <p className="text-xs font-medium text-[#1f8a4d]">{card.kicker}</p>
          <p className="mt-1 font-semibold">{card.title}</p>
          <p className="mt-2 text-sm leading-6 text-[#5d7263]">{card.body}</p>
        </li>
      ))}
    </ul>
  );
}

function buildCallouts(
  criteria: PainCriterion[],
  products: RankedMatch[],
  lead: PainCriterion | undefined,
  profile: PainProfile,
) {
  const cards: { kicker: string; title: string; body: string }[] = [];
  const used = new Set<string>();
  if (lead) {
    const best = [...products].sort(
      (left, right) =>
        (right.scores[lead.slug] ?? 0) - (left.scores[lead.slug] ?? 0),
    )[0];
    if (best) {
      used.add(best.id);
      cards.push({
        kicker: `Best for ${concernName(lead).toLowerCase()}`,
        title: best.name,
        body: best.note || best.why,
      });
    }
  }
  const value = criteria.find((item) => item.slug === "price");
  if (value) {
    const cheapest = [...products].sort(
      (left, right) => (right.scores.price ?? 0) - (left.scores.price ?? 0),
    )[0];
    if (cheapest && !used.has(cheapest.id)) {
      used.add(cheapest.id);
      cards.push({
        kicker: "Good value option",
        title: cheapest.name,
        body: cheapest.whoFor,
      });
    }
  }
  const next = products.find((item) => !used.has(item.id));
  if (next && cards.length < 3) {
    const focus = criteria.find(
      (item) => (profile.importances[item.slug] ?? 0) >= 7 && item.slug !== lead?.slug,
    );
    cards.push({
      kicker: focus
        ? `Best for ${concernName(focus).toLowerCase()}`
        : "Also a strong fit",
      title: next.name,
      body: next.whoFor,
    });
  }
  return cards.slice(0, 3);
}

function Step({
  n,
  label,
  current = false,
}: {
  n: string;
  label: string;
  current?: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={
          current
            ? "flex size-6 items-center justify-center rounded-full bg-[#1f8a4d] text-xs text-white"
            : "flex size-6 items-center justify-center rounded-full bg-[#d7e2d4] text-xs"
        }
      >
        {n}
      </span>
      {label}
    </li>
  );
}

function TabButton({
  current,
  onClick,
  children,
}: {
  current: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        current
          ? "rounded-full bg-[#1f8a4d] px-3 py-1.5 text-white"
          : "rounded-full bg-[#eef3ea] px-3 py-1.5 text-[#3f6b4c] hover:bg-[#dceadc]"
      }
    >
      {children}
    </button>
  );
}

function FootNote({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#d7e2d4] bg-white p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#5d7263]">{children}</p>
    </div>
  );
}

function ShopLink({
  href,
  featured = false,
  painId,
  path,
}: {
  href: string | null;
  featured?: boolean;
  painId: string;
  path: string;
}) {
  if (href) {
    return (
      <a
        href={href}
        rel="nofollow sponsored"
        className={
          featured
            ? "block rounded-lg bg-[#1f8a4d] px-3 py-2 text-center text-sm text-white hover:bg-[#187a42]"
            : "block rounded-lg bg-[#e7f6ea] px-3 py-2 text-center text-sm text-[#1f8a4d] hover:bg-[#d5efdb]"
        }
        onClick={() => {
          void fetch("/api/event", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              kind: "paingraph_click",
              path,
              painId,
            }),
            keepalive: true,
          });
        }}
      >
        See a shop link
      </a>
    );
  }
  return (
    <p className="text-center text-xs leading-5 text-[#5d7263]">
      No live shop link for this kind yet.
    </p>
  );
}

function KeepMatch({
  signedIn,
  saved,
  painId,
  href,
  slugs,
  profile,
}: {
  signedIn: boolean;
  saved: boolean;
  painId: string;
  href: string;
  slugs: string[];
  profile: PainProfile;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [kept, setKept] = useState(saved);
  const [copied, setCopied] = useState(false);
  const [needAccount, setNeedAccount] = useState<"keep" | "share" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function accountHref(path: "/login" | "/signup") {
    const next = window.location.pathname + window.location.search;
    return `${path}?next=${encodeURIComponent(next)}&reason=keep`;
  }

  return (
    <div className="rounded-2xl border border-[#d7e2d4] bg-white p-4">
      <p className="text-sm font-semibold">Keep this match</p>
      <p className="mt-2 text-sm leading-6 text-[#5d7263]">
        {signedIn
          ? "Save these sliders with this PainGraph, or copy a link that restores them."
          : "You need a free account to keep this match or save a share on your profile."}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          className="text-sm text-[#1f8a4d] hover:underline disabled:opacity-60"
          onClick={async () => {
            if (!signedIn) {
              setNeedAccount("keep");
              setError(null);
              return;
            }
            setPending(true);
            setError(null);
            const result = await keepMatch(painId, slugs, profile, href);
            if (result && "error" in result && result.error) {
              setError(result.error);
              if ("ok" in result) setKept(true);
            } else {
              setKept(true);
            }
            setPending(false);
          }}
        >
          {kept ? "Match kept" : "Keep this match"}
        </button>
        <button
          type="button"
          className="text-sm text-[#1f8a4d] hover:underline"
          onClick={async () => {
            if (!signedIn) {
              setNeedAccount("share");
              setError(null);
              return;
            }
            const url = window.location.href;
            try {
              if (navigator.share) {
                await navigator.share({ title: "PainGraph match", url });
                return;
              }
            } catch {
              /* fall through to copy */
            }
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            } catch {
              setError("Copy this URL from the address bar to share the sliders.");
            }
          }}
        >
          {copied ? "Link copied" : "Share this match"}
        </button>
      </div>
      {needAccount ? (
        <div className="mt-3 rounded-xl border border-[#f3d4c6] bg-[#fdeee6] p-3">
          <p className="text-sm leading-6 text-[#6a4a3d]">
            {needAccount === "keep"
              ? "Sign in or create a free account first. We will bring you back to these sliders."
              : "Sign in or create a free account first so we can keep this share with your match."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg bg-[#1f8a4d] px-3 py-1.5 text-sm text-white hover:bg-[#187a42]"
              onClick={() => router.push(accountHref("/login"))}
            >
              Sign in
            </button>
            <button
              type="button"
              className="rounded-lg border border-[#1f8a4d] px-3 py-1.5 text-sm text-[#1f8a4d] hover:bg-[#e7f6ea]"
              onClick={() => router.push(accountHref("/signup"))}
            >
              Create an account
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-[#b45309]">{error}</p> : null}
    </div>
  );
}

function findLine(h1: string) {
  const text = h1.replace(/\.$/, "").trim();
  if (/^find the right/i.test(text)) return text;
  return text;
}

function shortName(name: string) {
  return name.split(/[—,-]/)[0]?.trim() || name;
}

function sentence(value: string) {
  const text = value.trim();
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
