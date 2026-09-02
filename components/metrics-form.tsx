"use client";

import { useState } from "react";
import { saveHypothesisMetrics } from "@/lib/journeys/actions";

export function MetricsForm({ hypothesisId }: { hypothesisId: string }) {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const num = (name: string) => Number(form.get(name) || 0);
    const result = await saveHypothesisMetrics({
      hypothesisId,
      impressions: num("impressions"),
      clicks: num("clicks"),
      visitors: num("visitors"),
      quizStarts: num("quizStarts"),
      quizCompleted: num("quizCompleted"),
      optIns: num("optIns"),
      hasProblem: num("hasProblem"),
      considerBuy: num("considerBuy"),
      waitlist: num("waitlist"),
      purchases: num("purchases"),
      spendPence: Math.round(num("spend") * 100),
      notes: String(form.get("notes") || ""),
    });
    setPending(false);
    setStatus(result.error || result.analysis || "Saved.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-3">
      {[
        ["impressions", "Impressions"],
        ["clicks", "Clicks"],
        ["visitors", "Landing visitors"],
        ["quizStarts", "Quiz starts"],
        ["quizCompleted", "Quiz completed"],
        ["optIns", "Email opt-ins"],
        ["hasProblem", "I have this problem"],
        ["considerBuy", "Would consider buying"],
        ["waitlist", "Waitlist"],
        ["purchases", "Purchases / deposits"],
        ["spend", "Spend (£)"],
      ].map(([name, label]) => (
        <label key={name} className="text-xs text-muted">
          {label}
          <input
            name={name}
            type="number"
            min={0}
            step={name === "spend" ? "0.01" : "1"}
            defaultValue={0}
            className="mt-1 h-10 w-full border border-line bg-ink px-2 text-sm text-paper outline-none"
          />
        </label>
      ))}
      <label className="text-xs text-muted sm:col-span-3">
        Notes
        <textarea
          name="notes"
          rows={3}
          className="mt-1 w-full border border-line bg-ink px-2 py-2 text-sm text-paper outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-10 bg-copper px-4 text-sm text-ink hover:bg-copper-2 disabled:opacity-60 sm:col-span-3"
      >
        {pending ? "Saving…" : "Analyse these results"}
      </button>
      {status ? <p className="text-sm text-signal sm:col-span-3">{status}</p> : null}
    </form>
  );
}
