"use client";

import Link from "next/link";
import { useState } from "react";
import { toggleFavourite } from "@/lib/billboard/actions";

export function BillboardSaveButton({
  topicId,
  saved,
  signedIn,
  next,
  savedLabel = "Saved",
}: {
  topicId: string;
  saved: boolean;
  signedIn: boolean;
  next: string;
  savedLabel?: string;
}) {
  const [on, setOn] = useState(saved);
  const look =
    "border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper";

  if (!signedIn) {
    return (
      <Link href={`/login?next=${encodeURIComponent(next)}`} className={look}>
        Log in to save
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={look}
      onClick={async () => {
        await toggleFavourite(topicId);
        setOn((value) => !value);
      }}
    >
      {on ? savedLabel : "Save"}
    </button>
  );
}
