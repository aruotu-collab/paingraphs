import Link from "next/link";
import { PainCard } from "@/components/pain-card";
import { listPublicTests } from "@/lib/journeys/actions";
import { listMarketPains } from "@/lib/market/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Testing lab",
  description:
    "Watch hypothesized pains move from AI guess to behavioural evidence. Proven marketplace pains sit beside tests in flight.",
};

export default async function LabPage() {
  const [pains, tests] = await Promise.all([listMarketPains(), listPublicTests()]);
  const proven = [...pains].sort((a, b) => b.painScore - a.painScore).slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Testing lab
      </p>
      <h1 className="mt-3 font-display text-5xl">Watch pains graduate.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        AI hypothesis → testing → behaviourally validated → marketplace. Affiliates
        and founders can browse tests. Campaign details stay behind an account.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Currently testing</h2>
        {tests.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No hosted tests yet. Paste a product in Reverse PainGraph, sign in,
            and choose Host a PainGraphs test page.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4">
            {tests.map((row) => (
              <li key={row.id} className="border border-line p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-copper">
                  {row.status.replaceAll("_", " ")}
                </p>
                <h3 className="mt-2 font-display text-2xl">{row.title}</h3>
                <p className="mt-3 text-sm text-muted">{row.problem}</p>
                <Link
                  href={`/test/${row.slug}`}
                  className="mt-4 inline-block text-sm text-copper hover:text-copper-2"
                >
                  Open test page
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl">Proven pains</h2>
        <p className="mt-3 text-sm text-muted">
          Outside-in: complaints clustered from the public web. These are already
          in the marketplace.
        </p>
        <div className="mt-6 grid gap-4">
          {proven.map((pain) => (
            <PainCard key={pain.id} pain={pain} extra />
          ))}
        </div>
      </section>
    </main>
  );
}
