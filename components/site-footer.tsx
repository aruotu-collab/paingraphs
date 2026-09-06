import Link from "next/link";

const links = [
  ["/affiliates", "Affiliates"],
  ["/founders", "Founders"],
  ["/top-pains", "Top Pains"],
  ["/pricing", "Pricing"],
  ["/privacy", "Privacy"],
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-5 py-6 text-xs text-muted">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="hover:text-paper">
            {label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
