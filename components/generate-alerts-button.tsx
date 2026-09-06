"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateTodaysAlerts } from "@/lib/alerts/actions";

export function GenerateAlertsButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={pending}
        className="border border-line px-4 py-2 text-sm text-muted hover:border-copper hover:text-copper disabled:opacity-60"
        onClick={async () => {
          setPending(true);
          setMessage("");
          const result = await generateTodaysAlerts();
          setMessage(
            "error" in result && result.error
              ? result.error
              : result.result
                ? `Created ${result.result.created} alerts for ${result.result.day}.`
                : "Done.",
          );
          router.refresh();
          setPending(false);
        }}
      >
        {pending ? "Generating…" : "Generate today's alerts"}
      </button>
      {message ? <p className="mt-2 text-xs text-muted">{message}</p> : null}
    </div>
  );
}
