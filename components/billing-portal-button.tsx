"use client";

import { useState } from "react";
import { openBillingPortal } from "@/lib/billing/actions";

export function BillingPortalButton() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="text-sm text-copper hover:text-copper-2 disabled:opacity-50"
        onClick={async () => {
          setPending(true);
          setError("");
          const result = await openBillingPortal();
          if (result?.error) setError(result.error);
          setPending(false);
        }}
      >
        {pending ? "Opening portal…" : "Manage billing"}
      </button>
      {error ? <p className="mt-1 text-xs text-muted">{error}</p> : null}
    </div>
  );
}
