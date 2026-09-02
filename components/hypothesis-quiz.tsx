"use client";

import { useState } from "react";
import { submitHypothesisQuiz } from "@/lib/journeys/actions";
import type { QuizQuestion } from "@/lib/journeys/types";

export function HypothesisQuiz({
  slug,
  questions,
  title,
}: {
  slug: string;
  questions: QuizQuestion[];
  title: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<"problem" | "weak" | "mismatch" | null>(null);
  const [rec, setRec] = useState<{
    name: string;
    hopLink: string;
    reasons: string[];
  } | null>(null);
  const [waitlist, setWaitlist] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await submitHypothesisQuiz({ slug, answers, email });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setWaitlist(Boolean(result.waitlist));
    setRec(result.recommendation ?? null);
    setDone(
      result.mismatch ? "mismatch" : result.hasProblem ? "problem" : "weak",
    );
  }

  if (done) {
    return (
      <div className="mt-8 border border-line p-5">
        <h2 className="font-display text-3xl">Your PainGraph</h2>
        {done === "mismatch" ? (
          <p className="mt-3 leading-7 text-muted">
            This appears to be a medical or veterinary issue rather than
            something a training programme or product can honestly claim to
            solve. We are not recommending an affiliate offer.
          </p>
        ) : done === "problem" && rec ? (
          <>
            <p className="mt-3 leading-7 text-muted">
              Primary pattern matches this pain. Recommended solution:{" "}
              <span className="text-paper">{rec.name}</span>.
            </p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
              {rec.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <a
              href={rec.hopLink}
              target="_blank"
              rel="noreferrer sponsored"
              className="mt-5 inline-block bg-copper px-5 py-2.5 text-ink hover:bg-copper-2"
            >
              View program
            </a>
          </>
        ) : done === "problem" && waitlist ? (
          <p className="mt-3 leading-7 text-muted">
            We could not find a sufficiently strong match to recommend. If you
            left an email, we will notify you when a better solution appears.
          </p>
        ) : done === "problem" ? (
          <p className="mt-3 leading-7 text-muted">
            This looks like your pain. We are still testing whether a product
            built around it would hold up. If you left an email, that is early
            access — not a purchase.
          </p>
        ) : (
          <p className="mt-3 leading-7 text-muted">
            This may not be a daily problem for you. That answer still helps:
            it tells us the hypothesis is weaker than the ad implied.
          </p>
        )}
        <p className="mt-4 text-sm text-copper">Investigating: {title}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      {questions.map((item) => (
        <fieldset key={item.id}>
          <legend className="text-sm text-paper">{item.prompt}</legend>
          {item.kind === "yesno" ? (
            <div className="mt-2 flex gap-4 text-sm">
              {["yes", "no"].map((value) => (
                <label key={value} className="flex items-center gap-2 text-muted">
                  <input
                    type="radio"
                    name={item.id}
                    required
                    value={value}
                    onChange={() => setAnswers((prev) => ({ ...prev, [item.id]: value }))}
                  />
                  {value}
                </label>
              ))}
            </div>
          ) : null}
          {item.kind === "scale" ? (
            <div className="mt-2 flex gap-3 text-sm text-muted">
              {["1", "2", "3", "4", "5"].map((value) => (
                <label key={value} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name={item.id}
                    required
                    value={value}
                    onChange={() => setAnswers((prev) => ({ ...prev, [item.id]: value }))}
                  />
                  {value}
                </label>
              ))}
            </div>
          ) : null}
          {item.kind === "choice" && item.options ? (
            <div className="mt-2 grid gap-2 text-sm text-muted">
              {item.options.map((value) => (
                <label key={value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={item.id}
                    required
                    value={value}
                    onChange={() => setAnswers((prev) => ({ ...prev, [item.id]: value }))}
                  />
                  {value}
                </label>
              ))}
            </div>
          ) : null}
        </fieldset>
      ))}
      <label className="block text-sm text-muted">
        Email if you want early access (optional)
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-11 w-full border border-line bg-ink px-3 outline-none"
        />
      </label>
      {error ? <p className="text-sm text-signal">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 bg-copper px-5 text-ink hover:bg-copper-2 disabled:opacity-60"
      >
        {pending ? "Saving…" : "See your PainGraph"}
      </button>
    </form>
  );
}
