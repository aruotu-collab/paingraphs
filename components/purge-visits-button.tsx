"use client";

import { useState } from "react";
import { purgeOldVisits } from "@/lib/admin/actions";

export function PurgeVisitsButton() {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:text-paper disabled:opacity-60"
        onClick={async () => {
          setPending(true);
          const result = await purgeOldVisits();
          setPending(false);
          setStatus(result.error || "Removed visits older than 90 days.");
        }}
      >
        {pending ? "Purging…" : "Purge visits older than 90 days"}
      </button>
      {status ? <p className="mt-2 text-xs text-muted">{status}</p> : null}
    </div>
  );
}
