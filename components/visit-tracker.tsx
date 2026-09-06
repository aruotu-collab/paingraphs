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
      }),
      keepalive: true,
    });
  }, [pathname, search]);

  return null;
}
