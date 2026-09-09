"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleSavedPain } from "@/lib/paingraph/actions";

export function SavePainButton({
  painId,
  saved,
  signedIn,
}: {
  painId: string;
  saved: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="border border-line px-4 py-2 text-sm text-paper hover:border-copper hover:text-copper disabled:opacity-60"
        onClick={async () => {
          if (!signedIn) {
            router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
            return;
          }
          setPending(true);
          setError(null);
          const result = await toggleSavedPain(painId);
          if (result && "error" in result && result.error) {
            setError(result.error);
          } else {
            router.refresh();
          }
          setPending(false);
        }}
      >
        {saved ? "Saved" : "Save this pain"}
      </button>
      {error ? (
        <p className="mt-2 max-w-sm text-xs leading-5 text-copper">
          {error}{" "}
          <a href="/pricing" className="underline hover:text-copper-2">
            See pricing
          </a>
        </p>
      ) : null}
    </div>
  );
}
