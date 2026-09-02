"use client";

import { useState } from "react";
import { toggleWatch } from "@/lib/market/actions";

export function WatchButton({
  painId,
  watching,
  signedIn,
  next,
}: {
  painId: string;
  watching: boolean;
  signedIn: boolean;
  next: string;
}) {
  const [on, setOn] = useState(watching);

  if (!signedIn) {
    return (
      <a
        href={`/login?next=${encodeURIComponent(next)}`}
        className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:text-paper"
      >
        Log in to track
      </a>
    );
  }

  return (
    <button
      type="button"
      className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper"
      onClick={async () => {
        await toggleWatch(painId);
        setOn((value) => !value);
      }}
    >
      {on ? "Tracking" : "Track this pain"}
    </button>
  );
}
