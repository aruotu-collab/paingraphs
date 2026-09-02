import { ProductScanForm } from "@/components/product-scan-form";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reverse product research",
  description:
    "Paste a product URL. PainGraphs finds the consumer pains and overlooked audiences it may solve, then builds a campaign pack you run yourself.",
};

export default async function ReverseResearchPage() {
  const session = await getSession();
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Reverse PainGraph
      </p>
      <h1 className="mt-3 font-display text-5xl leading-[1.05]">
        Paste a product. See who might actually need it.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        If we already track the pain, you get a match against the marketplace.
        If we do not, PainGraphs writes unvalidated hypotheses and a test pack.
        Guests see the first match. Sign in to host the page and copy the ads.
      </p>
      <div className="mt-10">
        <ProductScanForm
          signedIn={Boolean(session)}
          intent="founder"
        />
      </div>
    </main>
  );
}
