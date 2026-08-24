"use client";

import { useState } from "react";
import { saveMarket } from "@/lib/actions";

export function SaveMarketButton({
  query,
  signedIn,
}: {
  query: string;
  signedIn: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  if (!query) return null;

  return (
    <button
      type="button"
      disabled={!signedIn || status === "saved"}
      className="w-fit border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper disabled:opacity-50"
      onClick={async () => {
        if (!signedIn) return;
        const result = await saveMarket(query);
        setStatus(result.ok ? "saved" : "error");
      }}
    >
      {!signedIn
        ? "Log in to save"
        : status === "saved"
          ? "Saved"
          : "Save market"}
    </button>
  );
}
