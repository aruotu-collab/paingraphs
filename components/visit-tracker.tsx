"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function VisitTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const path = `${pathname}${search.toString() ? `?${search.toString()}` : ""}`;
    void fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path,
        referrer: document.referrer || "",
        landingReferrer: readLandingReferrer(),
      }),
      keepalive: true,
    });
  }, [pathname, search]);

  return null;
}

function readLandingReferrer() {
  try {
    const key = "pg_landing_ref";
    const existing = sessionStorage.getItem(key);
    if (existing !== null) return existing;
    const value = document.referrer || "";
    sessionStorage.setItem(key, value);
    return value;
  } catch {
    return document.referrer || "";
  }
}
