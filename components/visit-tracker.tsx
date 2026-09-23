"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const LANDING_KEY = "pg-landing-ref";

function isOwnHost(raw: string) {
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    return /(^|\.)paingraphs\.com$|(^|\.)localhost$|^127\.0\.0\.1$|paingraphs\.vercel\.app$/i.test(
      host,
    );
  } catch {
    return false;
  }
}

export function VisitTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const path = `${pathname}${search.toString() ? `?${search.toString()}` : ""}`;
    const referrer = document.referrer || "";
    let landing = "";
    try {
      landing = sessionStorage.getItem(LANDING_KEY) || "";
      if (!landing && referrer && !isOwnHost(referrer)) {
        landing = referrer;
        sessionStorage.setItem(LANDING_KEY, landing);
      }
    } catch {
      landing = referrer && !isOwnHost(referrer) ? referrer : "";
    }
    void fetch("/api/visit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path,
        referrer,
        landingReferrer: landing,
      }),
      keepalive: true,
    });
  }, [pathname, search]);

  return null;
}
