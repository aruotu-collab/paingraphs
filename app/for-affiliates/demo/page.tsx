import Link from "next/link";
import { CampaignPackView } from "@/components/campaign-pack";
import { campaignPackForPain } from "@/lib/journeys/campaign";
import { marketplaceLabels } from "@/lib/journeys/labels";
import { getPainPage, listMarketPains } from "@/lib/market/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sample affiliate PainGraph",
  description:
    "Read-only affiliate view of headphones that hurt with glasses: customer language, products, keywords, and a locked campaign pack.",
};

export default async function AffiliateDemoPage() {
  const page = await getPainPage("electronics", "headphones", "glasses-pressure");
  if (!page) {
    const fallback = await listMarketPains();
    if (!fallback[0]) {
      return (
        <main className="mx-auto max-w-3xl flex-1 px-5 py-10">
          <p className="text-muted">No sample pain is published yet.</p>
        </main>
      );
    }
  }
  const demo =
    page ??
    (await getPainPage(
      (await listMarketPains())[0].category.slug,
      (await listMarketPains())[0].cluster.slug,
      (await listMarketPains())[0].slug,
    ));
  if (!demo) return null;
  const labels = marketplaceLabels(demo);
  const pack = campaignPackForPain(demo, "/for-affiliates/demo");
  const quote =
    demo.signals[0]?.quote ??
    "My glasses get pushed into the side of my head.";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Sample affiliate PainGraph · read-only
      </p>
      <h1 className="mt-3 font-display text-5xl leading-[1.05]">{demo.h1}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        This is the affiliate view of a live pain. The campaign copy is a
        preview. Generating packs for other pains needs an account.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-4">
        <Stat label="Pain" value={`${demo.painScore}/100`} />
        <Stat label="Trend" value={labels.trend} />
        <Stat label="Affiliate opportunity" value={labels.affiliate} />
        <Stat label="Product types" value={String(demo.products.length)} />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Opportunity</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted">{demo.problem}</p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Customer language</h2>
        <blockquote className="mt-4 border-l border-copper pl-5 text-lg leading-8">
          “{quote}”
        </blockquote>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Buyers are looking for</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {demo.criteria.map((item) => (
            <li key={item.slug} className="border border-line p-4">
              <span className="text-paper">{item.name}</span>
              <span className="mt-1 block text-sm text-muted">{item.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Products to investigate</h2>
        <ul className="mt-4 space-y-3">
          {demo.products.map((product) => (
            <li key={product.id} className="border border-line p-4">
              <h3 className="font-display text-2xl">{product.name}</h3>
              <p className="mt-1 text-sm text-copper">{product.whoFor}</p>
              <p className="mt-2 text-sm text-muted">{product.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">SEO opportunities</h2>
        <ul className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
          {pack.seo.keywords.map((word) => (
            <li key={word}>{word}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl">Generated campaign</h2>
        <p className="mt-3 text-sm text-muted">
          Headline: {pack.meta.angles[0]?.headline}
        </p>
        <div className="mt-6">
          <CampaignPackView
            pack={pack}
            locked
            signupHref="/signup?next=/workspace"
          />
        </div>
      </section>

      <p className="mt-10 text-sm text-muted">
        Want this for another merchant URL?{" "}
        <Link href="/reverse-product-research" className="text-copper hover:text-copper-2">
          Paste a product and see which pains are worth promoting
        </Link>
        .
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-4 py-5">
      <div className="text-xs uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className="mt-2 font-mono text-xl">{value}</div>
    </div>
  );
}
