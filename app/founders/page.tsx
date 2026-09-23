import Link from "next/link";
import { ConsumerShell } from "@/components/consumer-shell";
import { FounderGap } from "@/components/founder-gap";
import { PainCard } from "@/components/pain-card";
import { founderGapFromPage } from "@/lib/opportunities/gap";
import { listMatchLenses } from "@/lib/opportunities/match-lens";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "For Founders",
  description:
    "Find slider settings no current product kind survives.",
};

export default async function FoundersPage() {
  const [lenses, session] = await Promise.all([
    listMatchLenses(),
    getSession(),
  ]);
  const ranked = [...lenses].sort(
    (left, right) =>
      right.dealBreakers.length - left.dealBreakers.length ||
      left.surviving.length - right.surviving.length,
  );
  const featured = ranked[0];
  const gap = featured ? founderGapFromPage(featured.page) : null;

  return (
    <ConsumerShell>
      <p className="text-xs uppercase tracking-[0.18em] text-[#1f8a4d]">
        Build
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight text-[#12281a]">
        Build for the sliders nothing survives.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5d7263]">
        A founder gap is a deal breaker that blocks every current kind. Same
        match engine customers use.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={session ? "/home?mode=build" : "/signup?next=/home?mode=build"}
          className="inline-block rounded-lg bg-[#1f8a4d] px-5 py-2.5 text-white hover:bg-[#187a42]"
        >
          {session ? "Open member home" : "Create an account"}
        </Link>
        <Link
          href="/top-pains?view=founder"
          className="inline-block rounded-lg border border-[#1f8a4d] px-5 py-2.5 text-[#1f8a4d] hover:bg-[#1f8a4d] hover:text-white"
        >
          Founder Billboard
        </Link>
      </div>

      {featured && gap ? (
        <section className="mt-16 rounded-2xl border border-[#d7e2d4] bg-white p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[#1f8a4d]">
            Widest deal-breaker gap
          </p>
          <h2 className="mt-2 font-display text-3xl text-[#12281a]">
            {featured.graph.title}
          </h2>
          <div className="mt-4">
            <FounderGap gap={gap} detail={false} />
          </div>
          <Link
            href={`/founders/gap/${featured.graph.id}`}
            className="mt-4 inline-block text-sm text-[#1f8a4d] hover:underline"
          >
            Open gap analysis
          </Link>
        </section>
      ) : null}

      <section className="mt-16">
        <h2 className="font-display text-3xl text-[#12281a]">
          Underserved match combinations
        </h2>
        <div className="mt-6 grid gap-4">
          {ranked.map((row) => (
            <PainCard
              key={row.graph.id}
              graph={row.graph}
              href={`/founders/gap/${row.graph.id}`}
              note={
                row.dealBreakers.length > 0
                  ? `Deal-breaker gaps: ${row.dealBreakers.map((item) => item.name).join(", ")}`
                  : `${row.surviving.length} kinds survive default sliders`
              }
            />
          ))}
        </div>
      </section>
    </ConsumerShell>
  );
}
