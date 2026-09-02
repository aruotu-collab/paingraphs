"use client";

import { useState } from "react";
import { toggleWatch } from "@/lib/market/actions";

export function WatchButton({
  painId,
  watching,
  signedIn,
  next,
  flush = false,
}: {
  painId: string;
  watching: boolean;
  signedIn: boolean;
  next: string;
  flush?: boolean;
}) {
  const [on, setOn] = useState(watching);
  const look = flush
    ? "shrink-0 text-xs uppercase tracking-[0.14em] text-muted hover:text-paper"
    : "border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:text-paper";

  if (!signedIn) {
    return (
      <a href={`/login?next=${encodeURIComponent(next)}`} className={look}>
        Log in to track
      </a>
    );
  }

  return (
    <button
      type="button"
      className={`${look} ${flush ? "" : "hover:border-copper hover:text-copper"}`}
      onClick={async () => {
        await toggleWatch(painId);
        setOn((value) => !value);
      }}
    >
      {on ? "Tracking" : "Track this pain"}
    </button>
  );
}
