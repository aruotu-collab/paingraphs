import Link from "next/link";
import { ConsumerShell } from "@/components/consumer-shell";
import { PainSearch } from "@/components/pain-search";
import { listPainGraphs } from "@/lib/paingraph/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const graphs = await listPainGraphs();
  const categories = [
    ...new Map(
      graphs.map((graph) => [graph.category.slug, graph.category]),
    ).values(),
  ];
  return (
    <ConsumerShell>
      <p className="text-xs uppercase tracking-[0.18em] text-[#1f8a4d]">
        PainGraph · move the sliders
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight text-[#12281a]">
        Say what bothers you. See what usually fits.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5d7263]">
        Type what bothers you. If we have a PainGraph, sliders rank the kinds
        that fit. Open a kind to see named products — only when a real listing
        has been pasted.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-3xl text-[#12281a]">What annoys you?</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/${category.slug}`}
              className="rounded-full border border-[#d7e2d4] bg-white px-3 py-1.5 text-sm text-[#3f6b4c] hover:border-[#1f8a4d] hover:text-[#1f8a4d]"
            >
              {category.name}
            </Link>
          ))}
        </div>
        <div className="mt-8">
          <PainSearch graphs={graphs} />
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-2">
        <Link
          href="/affiliates"
          className="rounded-2xl border border-[#d7e2d4] bg-white p-5 hover:border-[#1f8a4d]"
        >
          <p className="text-xs uppercase tracking-[0.16em] text-[#1f8a4d]">
            Promote
          </p>
          <h2 className="mt-2 font-display text-2xl">For affiliates</h2>
          <p className="mt-3 text-sm leading-6 text-[#5d7263]">
            See which kinds survive real slider profiles, and whether a public
            shop link exists.
          </p>
        </Link>
        <Link
          href="/founders"
          className="rounded-2xl border border-[#d7e2d4] bg-white p-5 hover:border-[#1f8a4d]"
        >
          <p className="text-xs uppercase tracking-[0.16em] text-[#1f8a4d]">
            Build
          </p>
          <h2 className="mt-2 font-display text-2xl">For founders</h2>
          <p className="mt-3 text-sm leading-6 text-[#5d7263]">
            Find deal-breaker gaps — slider settings no current kind survives.
          </p>
        </Link>
      </section>
    </ConsumerShell>
  );
}
