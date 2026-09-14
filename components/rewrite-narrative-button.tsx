import { rewritePainNarrative } from "@/lib/paingraph/narrative-actions";

export function RewriteNarrativeButton({ painId }: { painId: string }) {
  return (
    <form action={rewritePainNarrative}>
      <input type="hidden" name="painId" value={painId} />
      <button
        type="submit"
        className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper"
      >
        Rewrite story
      </button>
    </form>
  );
}
