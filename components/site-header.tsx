import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { OwnerNav } from "@/components/owner-nav";
import { PUBLIC_NAV } from "@/lib/nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="font-display text-xl tracking-tight text-paper">
          PainGraphs
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          {PUBLIC_NAV.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-paper">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <OwnerNav />
          <AccountMenu />
        </div>
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-line px-5 py-2 text-sm text-muted md:hidden">
        {PUBLIC_NAV.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-paper">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
