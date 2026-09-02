import { SeoLanding } from "@/components/seo-landing";

export const metadata = {
  title: "Affiliate opportunity finder",
  description:
    "Find affiliate niches from real consumer complaints, not guessed keywords. PainGraphs ranks products against the pain and gives you a campaign pack.",
};

export default function Page() {
  return (
    <SeoLanding
      kicker="Affiliate niche finder"
      title="Find affiliate opportunities from real complaints."
      intro="Most affiliate niche finders start with search volume. PainGraphs starts with people describing a product that hurt, leaked, stung, or failed. Then it shows products you can actually promote against that pain."
      points={[
        "See pain score, trend, and affiliate fit before you write a review.",
        "Open a sample affiliate PainGraph for headphones that hurt with glasses.",
        "Paste a merchant URL if we do not have the pain yet.",
        "Copy Meta and Google ads. You run them. We do not.",
      ]}
      href="/for-affiliates"
      cta="Open the affiliate landing page"
    />
  );
}
