"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { prepareFavourite } from "@/lib/billboard/actions";

export function BillboardPrepareButton({
  topicId,
  href,
}: {
  topicId: string;
  href: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const look =
    "border border-copper px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink";

  if (href) {
    return (
      <a href={href} className={look}>
        Open pain page
      </a>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={pending}
        className={`${look} disabled:opacity-50`}
        onClick={async () => {
          setPending(true);
          setError("");
          const result = await prepareFavourite(topicId);
          setPending(false);
          if ("href" in result && result.href) {
            router.push(result.href);
            return;
          }
          setError(("error" in result && result.error) || "Could not prepare this pain.");
        }}
      >
        {pending ? "Preparing…" : "Prepare in detail"}
      </button>
      {error ? <p className="max-w-xs text-right text-xs text-copper">{error}</p> : null}
    </div>
  );
}
