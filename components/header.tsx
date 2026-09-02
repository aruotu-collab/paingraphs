import Link from "next/link";
import { AuthStatus } from "@/components/auth-status";

const links = [
  { href: "/", label: "Explore Pains" },
  { href: "/for-affiliates", label: "I Want to Earn" },
  { href: "/for-founders", label: "I Want to Build" },
  { href: "/how-it-works", label: "How It Works" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="font-display text-xl tracking-tight text-paper">
          PainGraphs
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <AuthStatus />
      </div>
      <nav className="flex gap-4 overflow-x-auto border-t border-line px-5 py-2 text-sm text-muted md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-paper">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
