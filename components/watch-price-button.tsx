import { watchProductPrice } from "@/lib/prices/actions";

export function WatchPriceButton({
  painId,
  productId,
  watching,
  hasPrice,
}: {
  painId: string;
  productId: string;
  watching: boolean;
  hasPrice: boolean;
}) {
  if (!hasPrice) {
    return (
      <p className="text-xs text-muted">
        Price alerts need a recorded price. None yet.
      </p>
    );
  }
  return (
    <form action={watchProductPrice}>
      <input type="hidden" name="painId" value={painId} />
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        className="text-xs uppercase tracking-[0.14em] text-muted hover:text-copper"
      >
        {watching ? "Stop price watch" : "Watch price"}
      </button>
    </form>
  );
}
