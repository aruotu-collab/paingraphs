"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/marketing-agent", label: "Money Board" },
  { href: "/marketing-agent/products", label: "Owned products" },
  { href: "/home/briefs", label: "Campaign briefs" },
  { href: "/admin", label: "Admin" },
] as const;

export function MarketingNav() {
  const current = usePathname() || "/marketing-agent";
  return (
    <nav className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
      {LINKS.map((link) => {
        const active =
          link.href === "/marketing-agent"
            ? current === "/marketing-agent" ||
              (current.startsWith("/marketing-agent/") &&
                !current.startsWith("/marketing-agent/products"))
            : current === link.href || current.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "border border-copper px-3 py-1.5 text-copper"
                : "border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
