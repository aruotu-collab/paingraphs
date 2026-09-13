import { saveCampaignBrief } from "@/lib/briefs/actions";
import { BRIEF_OBJECTIVES } from "@/lib/briefs/build";
import { DESTINATION_COUNTRIES } from "@/lib/destinations/url";

export function CampaignBriefForm({
  painId,
  graphs,
  defaultDestinationUrl,
}: {
  painId?: string;
  graphs?: { id: string; title: string }[];
  defaultDestinationUrl?: string | null;
}) {
  return (
    <form
      action={saveCampaignBrief}
      autoComplete="off"
      className="grid gap-3 border border-line p-5"
    >
      <h3 className="font-display text-2xl">Draft a campaign brief</h3>
      <p className="text-sm leading-6 text-muted">
        PainGraphs writes a Google Ads-style brief. Nothing goes live. Break-even
        CPC only appears after you record a conversion.
      </p>
      {painId ? (
        <input type="hidden" name="painId" value={painId} />
      ) : (
        <select
          name="painId"
          required
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        >
          <option value="" className="bg-ink">
            Choose a PainGraph
          </option>
          {(graphs ?? []).map((graph) => (
            <option key={graph.id} value={graph.id} className="bg-ink">
              {graph.title}
            </option>
          ))}
        </select>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        <select
          name="market"
          autoComplete="off"
          defaultValue="*"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        >
          {DESTINATION_COUNTRIES.map((row) => (
            <option key={row.code} value={row.code} className="bg-ink">
              {row.label}
            </option>
          ))}
        </select>
        <select
          name="objective"
          defaultValue="traffic"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        >
          {BRIEF_OBJECTIVES.map((value) => (
            <option key={value} value={value} className="bg-ink">
              {value}
            </option>
          ))}
        </select>
        <input
          name="dailyBudget"
          placeholder="Daily budget"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
      </div>
      <input
        name="destinationUrl"
        type="url"
        defaultValue={defaultDestinationUrl ?? ""}
        placeholder="Optional tracking URL you already created"
        className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
      />
      <button
        type="submit"
        className="justify-self-start border border-copper px-3 py-2 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
      >
        Generate draft brief
      </button>
    </form>
  );
}
