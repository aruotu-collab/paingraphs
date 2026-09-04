import { BillboardRow } from "@/components/billboard-row";
import { BillboardTabs } from "@/components/billboard-tabs";
import { listFavouriteTopics } from "@/lib/billboard/queries";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export const metadata = {
  title: "My Painpoint favourites",
  description: "The billboard topics you saved, ready to prepare into full pain pages.",
};

export default async function BillboardFavouritesPage() {
  const session = await requireSession();
  const topics = await listFavouriteTopics(session.user.id);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Painpoint Billboard
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">My favourites</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        Topics you saved from the daily chart. This is not your tracked
        marketplace pages — those live in the workspace. Prepare in detail
        turns a topic into a full shopper page.
      </p>

      <BillboardTabs tab="favourites" />

      {topics.length === 0 ? (
        <p className="mt-10 text-muted">
          Nothing saved yet. Open the chart and save the topics you want to
          investigate.
        </p>
      ) : (
        <div className="mt-8 grid gap-4">
          {topics.map((topic) => (
            <BillboardRow
              key={topic.id}
              topic={topic}
              saved
              signedIn
              mode="favourites"
            />
          ))}
        </div>
      )}
    </main>
  );
}
