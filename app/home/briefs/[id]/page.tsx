import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrief } from "@/lib/briefs/store";
import { getAnyPainGraph } from "@/lib/paingraph/queries";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function BriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession("/home/briefs");
  const { id } = await params;
  const row = await getBrief(id, session.user.id);
  if (!row) notFound();
  const graph = await getAnyPainGraph(row.painId);
  const brief = row.brief;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <Link
        href="/home/briefs"
        className="text-sm text-copper hover:text-copper-2"
      >
        Back to briefs
      </Link>
      <p className="mt-6 text-xs uppercase tracking-[0.16em] text-copper">
        Draft only · {row.objective} · {row.country}
      </p>
      <h1 className="mt-3 font-display text-4xl">
        {graph?.title ?? "Campaign brief"}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        PainGraphs does not launch this campaign. Use it as a briefing document.
      </p>
      <section className="mt-10 space-y-8">
        {(
          [
            ["Direct pain", brief.keywords.direct],
            ["Solution seeking", brief.keywords.solution],
            ["Comparison", brief.keywords.comparison],
            ["Product-specific", brief.keywords.product],
            ["Negatives", brief.negatives],
            ["Headlines", brief.headlines],
            ["Descriptions", brief.descriptions],
          ] as const
        ).map(([label, items]) => (
          <div key={label}>
            <h2 className="font-display text-2xl">{label}</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h2 className="font-display text-2xl">Ad groups</h2>
          <ul className="mt-3 space-y-3 text-sm text-muted">
            {brief.adGroups.map((group) => (
              <li key={group.name}>
                <p className="text-paper">{group.name}</p>
                <p>{group.keywords.join(" · ")}</p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-2xl">Landing and CTA</h2>
          <p className="mt-3 text-sm text-muted">{brief.landing.note}</p>
          <p className="mt-2 break-all font-mono text-xs text-copper">
            {brief.landing.href}
          </p>
          <p className="mt-2 text-sm">{brief.cta}</p>
        </div>
        <div>
          <h2 className="font-display text-2xl">Policy and tracking</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{brief.policyRisk}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            {brief.tracking.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">{brief.breakEvenCpc}</p>
        </div>
      </section>
    </main>
  );
}
