import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProductPage() {
  await requireSession();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Reverse the graph
      </p>
      <h1 className="mt-2 font-display text-4xl">My Product</h1>
      <p className="mt-3 text-muted">
        Paste a URL. Phase 2 will extract Problem DNA and match it against the
        pain graph.
      </p>
      <form className="mt-8 border border-line bg-ink-2 p-5">
        <label className="block text-sm text-muted" htmlFor="product-url">
          Product URL
        </label>
        <div className="mt-3 flex">
          <input
            id="product-url"
            type="url"
            placeholder="https://yourproduct.com"
            className="h-11 flex-1 border border-line bg-ink px-3 outline-none"
          />
          <button
            type="button"
            disabled
            className="border border-l-0 border-line px-4 text-sm text-muted"
          >
            Analyse in Phase 2
          </button>
        </div>
      </form>
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {[
          ["Solves", "—"],
          ["For", "—"],
          ["When", "—"],
          ["Competing against", "—"],
        ].map(([label, value]) => (
          <div key={label} className="border border-dashed border-line p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-muted">
              {label}
            </div>
            <div className="mt-2 text-paper">{value}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
