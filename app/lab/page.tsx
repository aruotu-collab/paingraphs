import Link from "next/link";
import { listPublicTests } from "@/lib/journeys/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Public tests",
  description:
    "Hosted PainGraphs test pages. Hypotheses in flight, not the live marketplace.",
};

export default async function LabPage() {
  const tests = await listPublicTests();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Public tests
      </p>
      <h1 className="mt-3 font-display text-5xl">Watch pains get tested.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
        These are hosted hypotheses, not live shopper pages. The marketplace is
        on the homepage. Daily research topics are on the Billboard.
      </p>

      {tests.length === 0 ? (
        <p className="mt-10 text-muted">
          No hosted tests yet.{" "}
          <Link href="/reverse-product-research" className="text-copper hover:text-copper-2">
            Paste a product URL
          </Link>
          , sign in, and host a test page from your workspace.
        </p>
      ) : (
        <ul className="mt-10 grid gap-4">
          {tests.map((row) => (
            <li key={row.id} className="border border-line p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-copper">
                {row.status.replaceAll("_", " ")}
              </p>
              <h2 className="mt-2 font-display text-2xl">{row.title}</h2>
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
    </main>
  );
}
