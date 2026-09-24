import Link from "next/link";
import { AccountStatus } from "@/components/account-status";
import { OwnerNav } from "@/components/owner-nav";
import { PUBLIC_NAV } from "@/lib/nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 max-w-full overflow-x-clip border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-14 min-w-0 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link
          href="/"
          className="min-w-0 shrink truncate font-display text-xl tracking-tight text-paper"
        >
          PainGraphs
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          {PUBLIC_NAV.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-paper">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <OwnerNav />
          <AccountStatus />
        </div>
      </div>
      <nav className="flex max-w-full flex-wrap gap-x-4 gap-y-1.5 border-t border-line px-4 py-2 text-sm text-muted md:hidden">
        {PUBLIC_NAV.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-paper">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
