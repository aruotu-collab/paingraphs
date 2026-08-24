"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function MarketSearch({
  initialQuery = "",
  size = "lg",
}: {
  initialQuery?: string;
  size?: "lg" | "sm";
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = query.trim();
    router.push(
      next
        ? `/opportunities?q=${encodeURIComponent(next)}`
        : "/opportunities",
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <label className="sr-only" htmlFor="market-search">
        Search a market
      </label>
      <div
        className={`flex border border-line bg-ink-2 ${
          size === "lg" ? "h-14" : "h-11"
        }`}
      >
        <input
          id="market-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="UK estate agents, construction, dentists…"
          className="min-w-0 flex-1 bg-transparent px-4 text-paper outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className="border-l border-line px-5 text-sm text-copper hover:bg-copper hover:text-ink"
        >
          Search
        </button>
      </div>
    </form>
  );
}
