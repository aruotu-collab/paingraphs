import { SeoLanding } from "@/components/seo-landing";

export const metadata = {
  title: "Find underserved markets",
  description:
    "A market research tool for founders who want underserved consumer pains with evidence, not another swipe file of product ideas.",
};

export default function Page() {
  return (
    <SeoLanding
      kicker="Underserved markets"
      title="Find product ideas from complaints, not brainstorms."
      intro="PainGraphs scores how badly current products answer a complaint. High product gap plus rising trend is an underserved market. The founder report shows audience, language, alternatives, and unmet needs."
      points={[
        "Browse product-gap pains in the marketplace.",
        "Read a sample founder report built on headphones vs glasses.",
        "Already selling? Reverse-match your URL to hidden audiences.",
        "Host a test page and run your own ads against the hypothesis.",
      ]}
      href="/for-founders"
      cta="Open founder opportunities"
    />
  );
}
