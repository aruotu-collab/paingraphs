import { SeoLanding } from "@/components/seo-landing";

export const metadata = {
  title: "Validate a product idea",
  description:
    "Product validation without PainGraphs running your ads. Host a questionnaire, paste Meta and Google copy, then read whether the pain is real.",
};

export default function Page() {
  return (
    <SeoLanding
      kicker="Product validation"
      title="Find out who will buy before you scale."
      intro="Paste a product URL. PainGraphs writes 3–5 pain hypotheses and a test page with a real questionnaire. You launch the ads. You paste back the results. Clicks are not enough — quiz completes and “I have this problem” are."
      points={[
        "Self-serve campaign packs for Meta and Google.",
        "PainGraphs-hosted landing and waitlist.",
        "Compare hypotheses against each other, not against your branding.",
        "Graduate a winner into the public marketplace.",
      ]}
      href="/reverse-product-research"
      cta="Start from Reverse PainGraph"
    />
  );
}
