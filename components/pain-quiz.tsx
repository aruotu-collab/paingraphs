"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PainGraphReport } from "@/components/pain-graph-report";
import { authClient } from "@/lib/auth-client";
import { saveSignedInAssessment } from "@/lib/market/actions";
import { isEvenWeights, readWeights } from "@/lib/market/explain";
import { normalizePriorities, rankProducts } from "@/lib/market/match";
import {
  encodeQuizWeights,
  quizStorageKey,
} from "@/lib/market/quiz-state";
import type { PainPage } from "@/lib/market/types";

export function PainQuiz({
  page,
  signedIn,
  reveal = false,
  initialPriorities,
}: {
  page: PainPage;
  signedIn: boolean;
  reveal?: boolean;
  initialPriorities?: Record<string, number> | null;
}) {
  const slugs = page.criteria.map((item) => item.slug);
  const [priorities, setPriorities] = useState<Record<string, number>>(() => {
    if (initialPriorities) return initialPriorities;
    const even = Math.round(100 / Math.max(page.criteria.length, 1));
    return Object.fromEntries(page.criteria.map((item) => [item.slug, even]));
  });
  const [done, setDone] = useState(signedIn && reveal);
  const [gate, setGate] = useState(false);
  const [email, setEmail] = useState("");
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentSensitive, setConsentSensitive] = useState(false);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const savedRef = useRef(false);

  const shares = normalizePriorities(priorities, slugs);
  const ranked = useMemo(
    () => rankProducts(page.products, shares),
    [page.products, shares],
  );
  const even = isEvenWeights(shares, slugs);
  const preview = readWeights(page.criteria, shares);

  useEffect(() => {
    let marketing = consentMarketing;
    let sensitive = consentSensitive;
    try {
      const raw = sessionStorage.getItem(quizStorageKey(page.id));
      if (raw) {
        const saved = JSON.parse(raw) as {
          priorities?: Record<string, number>;
          consentMarketing?: boolean;
          consentSensitive?: boolean;
        };
        if (saved.priorities && !initialPriorities) setPriorities(saved.priorities);
        if (saved.consentMarketing) {
          marketing = true;
          setConsentMarketing(true);
        }
        if (saved.consentSensitive) {
          sensitive = true;
          setConsentSensitive(true);
        }
      }
    } catch {
      /* ignore */
    }
    if (!signedIn || !done || savedRef.current) return;
    savedRef.current = true;
    void saveSignedInAssessment({
      painId: page.id,
      priorities: JSON.stringify(shares),
      consentMarketing: marketing,
      consentSensitive: page.sensitive ? sensitive : false,
    });
  }, [signedIn, done, page.id, page.sensitive, initialPriorities]);

  function persist(next = priorities) {
    sessionStorage.setItem(
      quizStorageKey(page.id),
      JSON.stringify({
        priorities: next,
        consentMarketing,
        consentSensitive,
      }),
    );
  }

  async function requestLink() {
    setStatus("");
    if (!email.trim()) {
      setStatus("Add the email where we should send the sign-in link.");
      return;
    }
    if (page.sensitive && !consentSensitive) {
      setStatus("Health-related PainGraphs need an explicit tick before we email you.");
      return;
    }
    setPending(true);
    persist();
    const callbackURL = `${page.href}?graph=1&w=${encodeQuizWeights(shares)}`;
    const result = await authClient.signIn.magicLink({
      email: email.trim().toLowerCase(),
      name: email.trim().split("@")[0] || "there",
      callbackURL,
      newUserCallbackURL: callbackURL,
    });
    setPending(false);
    if (result.error) {
      setStatus(result.error.message || "Could not send the sign-in link.");
      return;
    }
    setStatus(
      `Check ${email.trim().toLowerCase()}. The link brings you back to this page, then opens your PainGraph.`,
    );
  }

  return (
    <section id="find-match" className="mt-12 border border-line bg-ink-2 p-6">
      <h2 className="font-display text-3xl">Find the best match for you</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
        About 30–60 seconds. Each slider is one of the five things we compared
        above. Slide a factor to the right if it is a reason you would reject a
        product. Slide it left if you can live without it. The percentages
        always add up to 100%, so raising one automatically lowers the others.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-paper">
        This is not a “best overall” list. When you click See my PainGraph, we
        rank the options on this page against the mix you set, then explain the
        winner in plain language — including what it does badly.
      </p>
      <p className="mt-3 text-sm text-paper">{preview.headline}</p>
      <div className="mt-8 space-y-5">
        {page.criteria.map((item) => (
          <label key={item.slug} className="block">
            <div className="flex justify-between text-sm">
              <span>{item.name}</span>
              <span className="font-mono text-copper">{shares[item.slug] ?? 0}%</span>
            </div>
            <p className="mt-1 text-xs text-muted">{item.detail}</p>
            <input
              type="range"
              min={0}
              max={10}
              value={priorities[item.slug] ?? 0}
              onChange={(event) => {
                const value = Number(event.target.value);
                const next = { ...priorities, [item.slug]: value };
                setPriorities(next);
                persist(next);
              }}
              className="mt-2 w-full accent-copper"
            />
          </label>
        ))}
      </div>
      {even ? (
        <p className="mt-6 text-sm leading-6 text-muted">
          Every slider is still in the middle, so we do not yet know what
          matters most to you. You can still open the ranking, but it will be
          a balanced average. If one problem is why you opened this page, move
          that slider first.
        </p>
      ) : null}
      {signedIn ? (
        <button
          type="button"
          onClick={() => {
            persist();
            setDone(true);
            document.getElementById("pain-graph-result")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          className="mt-8 h-11 bg-copper px-5 text-ink hover:bg-copper-2"
        >
          See my PainGraph
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            persist();
            setGate(true);
          }}
          className="mt-8 h-11 bg-copper px-5 text-ink hover:bg-copper-2"
        >
          See my PainGraph
        </button>
      )}

      {gate && !signedIn ? (
        <div className="mt-8 border border-dashed border-line p-5">
          <h3 className="font-display text-xl">See your ranking</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            We email a sign-in link to the address you type below. Click the
            link and this page reloads with your ranking underneath: which
            option fits the mix you just set, why, and where it is weaker. There
            is no password.
          </p>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            className="mt-4 h-11 w-full border border-line bg-ink px-3 outline-none"
          />
          <label className="mt-4 flex gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={consentMarketing}
              onChange={(event) => setConsentMarketing(event.target.checked)}
            />
            Also send new products, comparisons and deals relevant to this pain.
          </label>
          {page.sensitive ? (
            <label className="mt-2 flex gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={consentSensitive}
                onChange={(event) => setConsentSensitive(event.target.checked)}
              />
              I understand this pain can involve health-related answers and I
              explicitly consent to using them only for the emails I opted into.
            </label>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => void requestLink()}
            className="mt-5 border border-copper px-4 py-2 text-sm text-copper hover:bg-copper hover:text-ink disabled:opacity-60"
          >
            {pending ? "Sending…" : "Email me the sign-in link"}
          </button>
          {status ? <p className="mt-3 text-sm text-signal">{status}</p> : null}
          <p className="mt-3 text-xs text-muted">
            Asking for the link creates a PainGraphs account. We do not sell
            your address. Marketing stays off unless you tick it.
          </p>
        </div>
      ) : null}

      {signedIn && done ? (
        <PainGraphReport page={page} shares={shares} ranked={ranked} />
      ) : null}
    </section>
  );
}
