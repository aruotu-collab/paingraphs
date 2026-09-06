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

  return (
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
        await toggleSavedPain(painId);
        router.refresh();
        setPending(false);
      }}
    >
      {saved ? "Saved" : "Save this pain"}
    </button>
  );
}
