import { SeoLanding } from "@/components/seo-landing";

export const metadata = {
  title: "Find profitable affiliate niches",
  description:
    "Low-competition affiliate niches built from clustered consumer pain, with campaign copy ready to paste into Google and Meta.",
};

export default function Page() {
  return (
    <SeoLanding
      kicker="Profitable affiliate niches"
      title="Stop guessing which niche will convert."
      intro="PainGraphs treats a niche as a pain with products attached. High affiliate fit means there are products to promote and the current pages are still thin lists."
      points={[
        "Filter the marketplace by affiliate opportunity.",
        "Read customer language before you record a YouTube video.",
        "Generate SEO, email, and ad copy around the proven pain.",
        "If a merchant has no PainGraph yet, test hypotheses first instead of writing 20 articles.",
      ]}
      href="/for-affiliates/demo"
      cta="View a sample affiliate opportunity"
    />
  );
}
