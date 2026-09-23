import Link from "next/link";
import { ConsumerShell } from "@/components/consumer-shell";
import { PainCard } from "@/components/pain-card";
import { listMatchLenses } from "@/lib/opportunities/match-lens";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "For Affiliates",
  description:
    "See which product kinds survive real slider profiles, and whether a public shop link exists.",
};

export default async function AffiliatesPage() {
  const [lenses, session] = await Promise.all([
    listMatchLenses(),
    getSession(),
  ]);
  const ranked = [...lenses].sort(
    (left, right) =>
      right.shopReady.length - left.shopReady.length ||
      right.surviving.length - left.surviving.length ||
      right.clicks - left.clicks,
  );

  return (
    <ConsumerShell>
      <p className="text-xs uppercase tracking-[0.18em] text-[#1f8a4d]">
        Promote
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight text-[#12281a]">
        Promote kinds that survive a real match.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5d7263]">
        These numbers come from the same sliders customers use. Your private
        hop links stay in the vault. They never replace a public shop button.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={session ? "/home?mode=promote" : "/signup?next=/home?mode=promote"}
          className="inline-block rounded-lg bg-[#1f8a4d] px-5 py-2.5 text-white hover:bg-[#187a42]"
        >
          {session ? "Open member home" : "Create an account"}
        </Link>
        <Link
          href="/top-pains?view=affiliate"
          className="inline-block rounded-lg border border-[#1f8a4d] px-5 py-2.5 text-[#1f8a4d] hover:bg-[#1f8a4d] hover:text-white"
        >
          Affiliate Billboard
        </Link>
      </div>

      <section className="mt-16">
        <h2 className="font-display text-3xl text-[#12281a]">
          What the sliders currently leave standing
        </h2>
        <p className="mt-3 text-sm text-[#5d7263]">
          Default slider profile. Shop-ready means a public /go destination is
          pasted.
        </p>
        <div className="mt-6 grid gap-4">
          {ranked.map((row) => (
            <PainCard
              key={row.graph.id}
              graph={row.graph}
              note={`${row.surviving.length} kinds survive · ${row.shopReady.length} shop link${row.shopReady.length === 1 ? "" : "s"} · ${row.clicks} shop click${row.clicks === 1 ? "" : "s"} · People crank ${row.topConcerns[0] ?? "the top concern"}`}
            />
          ))}
        </div>
      </section>
    </ConsumerShell>
  );
}
