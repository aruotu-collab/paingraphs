"use client";

import { useState } from "react";

export function CopyButton({
  label,
  text,
}: {
  label?: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="border border-copper px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied" : label ?? "Copy"}
    </button>
  );
}
