"use client";

import { useState } from "react";
import type { ComplaintQuote } from "@/lib/market/quotes";

const PAGE_SIZE = 10;

export function ComplaintQuotes({ quotes }: { quotes: ComplaintQuote[] }) {
  const [visible, setVisible] = useState(Math.min(PAGE_SIZE, quotes.length));
  if (quotes.length === 0) return null;

  const shown = quotes.slice(0, visible);
  const remaining = quotes.length - shown.length;

  return (
    <>
      <ul className="mt-5 space-y-4">
        {shown.map((signal, index) => (
          <li key={`${signal.source}-${index}-${signal.quote.slice(0, 48)}`} className="border border-line p-4">
            <p className="text-paper">“{signal.quote}”</p>
            <p className="mt-2 text-xs text-muted">
              {signal.url ? (
                <a href={signal.url} className="hover:text-copper-2">
                  {signal.source}
                </a>
              ) : (
                signal.source
              )}
            </p>
          </li>
        ))}
      </ul>
      {remaining > 0 ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setVisible((count) => Math.min(count + PAGE_SIZE, quotes.length))}
            className="border border-copper px-4 py-2 text-sm text-copper hover:bg-copper hover:text-ink"
          >
            Load more comments
          </button>
          <p className="mt-2 text-xs text-muted">
            Showing {shown.length} of {quotes.length}. Skip ahead to the
            analysis below if this is enough.
          </p>
        </div>
      ) : null}
    </>
  );
}
