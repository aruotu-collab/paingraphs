import { clearListing, saveListing } from "@/lib/listings/actions";
import { countryLabel, DESTINATION_COUNTRIES } from "@/lib/destinations/url";
import { merchantFromUrl } from "@/lib/listings/url";

export function ListingForm({
  painId,
  productId,
  listings,
}: {
  painId: string;
  productId: string;
  listings: { id: string; name: string; url: string; country: string }[];
}) {
  return (
    <div className="mt-4 space-y-4">
      {listings.map((listing) => (
        <div key={listing.id} className="space-y-2">
          <p className="text-sm text-paper">{listing.name}</p>
          <p className="text-xs text-muted">
            {countryLabel(listing.country)} · {merchantFromUrl(listing.url)}
          </p>
          <p className="break-all text-xs text-muted">{listing.url}</p>
          <form action={clearListing}>
            <input type="hidden" name="painId" value={painId} />
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="listingId" value={listing.id} />
            <button
              type="submit"
              className="text-xs uppercase tracking-[0.14em] text-muted hover:text-copper"
            >
              Clear this name
            </button>
          </form>
        </div>
      ))}
      <form action={saveListing} className="flex flex-col gap-2">
        <input type="hidden" name="painId" value={painId} />
        <input type="hidden" name="productId" value={productId} />
        <input
          type="text"
          name="name"
          required
          minLength={2}
          maxLength={80}
          placeholder="Product name as sold"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
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
            Save named product
          </button>
        </div>
      </form>
    </div>
  );
}
