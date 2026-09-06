"use client";

import { useMemo, useState } from "react";
import { PainCard } from "@/components/pain-card";
import type { PainGraph } from "@/lib/paingraph/types";

export function PainSearch({ graphs }: { graphs: PainGraph[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return graphs;
    return graphs.filter((graph) =>
      [
        graph.title,
        graph.summary,
        graph.category.name,
        graph.subcategory.name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [graphs, query]);

  return (
    <div>
      <label className="block text-sm">
        <span className="text-muted">Search pains</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="glasses, leak, sting, vacuum…"
          className="mt-2 h-11 w-full max-w-xl border border-line bg-ink-2 px-3 outline-none focus:border-copper"
        />
      </label>
      <p className="mt-3 text-xs text-muted">
        {filtered.length} of {graphs.length} PainGraphs
      </p>
      <div className="mt-6 grid gap-4">
        {filtered.map((graph) => (
          <PainCard key={graph.id} graph={graph} />
        ))}
      </div>
    </div>
  );
}
