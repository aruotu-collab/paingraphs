"use client";

import { useState } from "react";
import { startProCheckout } from "@/lib/billing/actions";

export function CheckoutButton({
  signedIn,
  configured,
}: {
  signedIn: boolean;
  configured: boolean;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!signedIn) {
    return (
      <a
        href="/signup?next=/pricing"
        className="mt-6 border border-copper px-4 py-2 text-center text-sm text-copper hover:bg-copper hover:text-ink"
      >
        Create an account
      </a>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={pending || !configured}
        className="w-full border border-copper px-4 py-2 text-sm text-copper hover:bg-copper hover:text-ink disabled:opacity-50"
        onClick={async () => {
          if (!configured) {
            setError("Checkout is not configured yet.");
            return;
          }
          setPending(true);
          setError("");
          const result = await startProCheckout();
          if (result?.error) setError(result.error);
          setPending(false);
        }}
      >
        {pending ? "Opening Stripe…" : configured ? "Subscribe to Pro" : "Checkout soon"}
      </button>
      {error ? <p className="mt-2 text-xs text-muted">{error}</p> : null}
    </div>
  );
}
