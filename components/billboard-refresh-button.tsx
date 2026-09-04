"use client";

import { useState } from "react";
import { refreshBillboard } from "@/lib/billboard/actions";

export function BillboardRefreshButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={pending}
        className="text-xs uppercase tracking-[0.14em] text-muted hover:text-copper disabled:opacity-50"
        onClick={async () => {
          setPending(true);
          setMessage("");
          const result = await refreshBillboard();
          setPending(false);
          if ("error" in result && result.error) {
            setMessage(result.error);
            return;
          }
          setMessage(`Updated ${result.updated} topics.`);
        }}
      >
        {pending ? "Searching the web…" : "Update chart now"}
      </button>
      {message ? <p className="mt-2 text-xs text-muted">{message}</p> : null}
    </div>
  );
}
