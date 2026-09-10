import Link from "next/link";
import { requireMarketingAgent } from "@/lib/session";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function MarketingAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMarketingAgent("/marketing-agent");
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Owner only · Marketing Agent
      </p>
      <nav className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
        <Link
          href="/marketing-agent"
          className="border border-copper px-3 py-1.5 text-copper"
        >
          Money Board
        </Link>
        <Link
          href="/marketing-agent/products"
          className="border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
        >
          Owned products
        </Link>
        <Link
          href="/home/briefs"
          className="border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
        >
          Campaign briefs
        </Link>
        <Link
          href="/admin"
          className="border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
        >
          Admin
        </Link>
      </nav>
      {children}
    </div>
  );
}
