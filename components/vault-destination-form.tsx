import { clearMemberDestination, saveMemberDestination } from "@/lib/vault/actions";
import { countryLabel, DESTINATION_COUNTRIES } from "@/lib/destinations/url";

export function VaultDestinationForm({
  painId,
  productId,
  destinations,
}: {
  painId: string;
  productId: string;
  destinations: { id: string; url: string; country: string }[];
}) {
  return (
    <div className="mt-4 space-y-4">
      {destinations.map((destination) => (
        <div key={destination.id} className="space-y-2">
          <p className="text-xs text-muted">{countryLabel(destination.country)}</p>
          <p className="break-all text-xs text-muted">{destination.url}</p>
          <form action={clearMemberDestination}>
            <input type="hidden" name="painId" value={painId} />
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="country" value={destination.country} />
            <button
              type="submit"
              className="text-xs uppercase tracking-[0.14em] text-muted hover:text-copper"
            >
              Clear {countryLabel(destination.country)}
            </button>
          </form>
        </div>
      ))}
      <form action={saveMemberDestination} className="flex flex-col gap-2">
        <input type="hidden" name="painId" value={painId} />
        <input type="hidden" name="productId" value={productId} />
        <select
          name="country"
          defaultValue="*"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        >
          {DESTINATION_COUNTRIES.map((row) => (
            <option key={row.code} value={row.code} className="bg-ink">
              {row.label}
            </option>
          ))}
        </select>
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="url"
            name="url"
            required
            placeholder="https://…"
            className="min-w-0 flex-1 border border-line bg-transparent px-3 py-2 text-sm text-paper"
          />
          <button
            type="submit"
            className="border border-copper px-3 py-2 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
          >
            Save private URL
          </button>
        </div>
      </form>
    </div>
  );
}
