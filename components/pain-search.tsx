"use client";

import { useMemo, useState } from "react";
import { PainCard } from "@/components/pain-card";
import { savePainMiss } from "@/lib/misses/actions";
import type { PainGraph } from "@/lib/paingraph/types";

function matchesGraph(graph: PainGraph, needle: string) {
  const haystack = [
    graph.title,
    graph.summary,
    graph.h1,
    graph.category.name,
    graph.subcategory.name,
    ...graph.concerns.map((item) => item.name),
  ]
    .join(" ")
    .toLowerCase();
  if (haystack.includes(needle)) return true;
  const words = needle.split(" ").filter((word) => word.length > 2);
  return words.length > 0 && words.every((word) => haystack.includes(word));
}

export function PainSearch({ graphs }: { graphs: PainGraph[] }) {
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needle = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!needle) return graphs;
    return graphs.filter((graph) => matchesGraph(graph, needle));
  }, [graphs, needle]);
  const miss = needle.length >= 8 && filtered.length === 0;

  async function keepMiss() {
    setPending(true);
    setError(null);
    const result = await savePainMiss(query);
    if (result && "error" in result && result.error) {
      setError(result.error);
    } else {
      setSaved(true);
    }
    setPending(false);
  }

  return (
    <div>
      <label className="block text-sm">
        <span className="sr-only">What annoys you?</span>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.currentTarget.value);
            setSaved(false);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && miss) {
              event.preventDefault();
              void keepMiss();
            }
          }}
          placeholder="Headphones hurt with glasses. Suitcase wheels are too loud."
          className="h-12 w-full max-w-2xl rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-[#1f8a4d]"
        />
      </label>
      <p className="mt-3 text-xs text-muted">
        {needle
          ? `${filtered.length} of ${graphs.length} PainGraphs`
          : `${graphs.length} PainGraphs — type a pain in your own words`}
      </p>

      {miss ? (
        <div className="mt-6 max-w-2xl rounded-2xl border border-[#f3d4c6] bg-[#fdeee6] p-5">
          <p className="font-medium text-[#c45c3a]">We don’t have this one yet.</p>
          <p className="mt-2 text-sm leading-6 text-[#6a4a3d]">
            Save it and we’ll use repeats like this to decide which PainGraph
            to build next. Don’t invent a product — tell us the pain.
          </p>
          {saved ? (
            <p className="mt-3 text-sm text-[#1f8a4d]">
              Saved. If more people type this, it rises in the queue.
            </p>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => void keepMiss()}
              className="mt-4 rounded-lg bg-[#1f8a4d] px-4 py-2 text-sm text-white hover:bg-[#187a42] disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save this pain"}
            </button>
          )}
          {error ? <p className="mt-2 text-sm text-[#b45309]">{error}</p> : null}
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {filtered.map((graph) => (
            <PainCard key={graph.id} graph={graph} />
          ))}
        </div>
      )}
    </div>
  );
}
