import { PainCard } from "@/components/pain-card";
import { listWatchIds } from "@/lib/market/actions";
import { listMarketPains } from "@/lib/market/queries";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  await requireSession();
  const ids = await listWatchIds();
  const pains = (await listMarketPains()).filter((pain) => ids.includes(pain.id));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Pain watchlist
      </p>
      <h1 className="mt-2 font-display text-4xl">Tracked pains</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Your Bloomberg list. Scores and evidence update as the daily pipeline
        runs. We email changes only if you opted in.
      </p>
      {pains.length === 0 ? (
        <p className="mt-10 text-muted">
          Nothing tracked yet. Open a pain and choose Track this pain.
        </p>
      ) : (
        <div className="mt-10 grid gap-4">
          {pains.map((pain) => (
            <PainCard key={pain.id} pain={pain} />
          ))}
        </div>
      )}
    </main>
  );
}
