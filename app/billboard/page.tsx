import { BillboardRefreshButton } from "@/components/billboard-refresh-button";
import { BillboardRow } from "@/components/billboard-row";
import { BillboardTabs } from "@/components/billboard-tabs";
import { isAdminEmail } from "@/lib/admin";
import { getChartDate, listChartTopics, listFavouriteIds } from "@/lib/billboard/queries";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export const metadata = {
  title: "Painpoint Billboard",
  description:
    "A daily ranked chart of the most-searched consumer pain topics. Save the ones worth investigating, then prepare them in detail.",
};

export default async function BillboardPage() {
  const session = await getSession();
  const [topics, savedIds, chartDate] = await Promise.all([
    listChartTopics(),
    listFavouriteIds(session?.user.id),
    getChartDate(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Painpoint Billboard
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">
        Today&apos;s most-searched pains.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        Research topics only. These are not live shopper pages. The published
        marketplace is on the homepage. Save a topic here, then prepare it from
        My favourites when you want the full page.
      </p>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted">
        {chartDate ? `Chart date ${chartDate}` : "Updates every morning"}
        {topics.length ? ` · ${topics.length} topics` : ""}
      </p>
      {isAdminEmail(session?.user.email) ? <BillboardRefreshButton /> : null}

      <BillboardTabs tab="chart" />

      {topics.length === 0 ? (
        <p className="mt-10 text-muted">
          The chart fills after the daily OpenAI search run. Check back after
          tonight&apos;s update.
        </p>
      ) : (
        <div className="mt-8 grid gap-4">
          {topics.map((topic) => (
            <BillboardRow
              key={topic.id}
              topic={topic}
              saved={savedIds.includes(topic.id)}
              signedIn={Boolean(session)}
              mode="chart"
            />
          ))}
        </div>
      )}
    </main>
  );
}
