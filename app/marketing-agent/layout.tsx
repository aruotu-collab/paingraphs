import { MarketingNav } from "@/components/marketing-nav";
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
      <MarketingNav />
      {children}
    </div>
  );
}
