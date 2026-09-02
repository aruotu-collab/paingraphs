"use client";

import { useState } from "react";
import { analyseAffiliateOffer } from "@/lib/lab/actions";

export function AnalyseOfferButton({ offerId }: { offerId: string }) {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <span>
      <button
        type="button"
        disabled={pending}
        className="text-xs text-copper hover:text-copper-2 disabled:opacity-60"
        onClick={async () => {
          setPending(true);
          const result = await analyseAffiliateOffer(offerId);
          setPending(false);
          setStatus(result.error || "Updated.");
        }}
      >
        {pending ? "Analysing…" : "Re-analyse"}
      </button>
      {status ? <span className="ml-2 text-xs text-muted">{status}</span> : null}
    </span>
  );
}
