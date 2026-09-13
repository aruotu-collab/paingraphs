import { saveConversion } from "@/lib/destinations/actions";
import { countryLabel } from "@/lib/destinations/url";

export function ConversionForm({
  painId,
  destinations,
}: {
  painId: string;
  destinations: { id: string; country: string; url: string }[];
}) {
  return (
    <form action={saveConversion} className="mt-4 grid gap-3 border border-line p-5">
      <input type="hidden" name="painId" value={painId} />
      <h3 className="font-display text-2xl">Record a conversion</h3>
      <p className="text-sm leading-6 text-muted">
        Log a merchant sale you already have. PainGraphs will not invent
        revenue, EPC, or a checkout.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          placeholder="Amount"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="currency"
          defaultValue="GBP"
          maxLength={3}
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <select
          name="destinationId"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
          defaultValue=""
        >
          <option value="" className="bg-ink">
            Any destination
          </option>
          {destinations.map((destination) => (
            <option key={destination.id} value={destination.id} className="bg-ink">
              {countryLabel(destination.country)}
            </option>
          ))}
        </select>
      </div>
      <input
        name="note"
        placeholder="Merchant / order note"
        className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
      />
      <button
        type="submit"
        className="justify-self-start border border-copper px-3 py-2 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
      >
        Save conversion
      </button>
    </form>
  );
}
