"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/pains", label: "Pains" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/rankings", label: "Rankings" },
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/health", label: "Health" },
] as const;

export function AdminNav() {
  const current = usePathname() || "/admin";
  return (
    <nav className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin"
            ? current === "/admin"
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
      <Link
        href="/marketing-agent"
        className="border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
      >
        Marketing Agent
      </Link>
    </nav>
  );
}
