import { runOwnerIngest } from "@/lib/admin/ingest";

export function RunIngestButton() {
  return (
    <form action={runOwnerIngest}>
      <button
        type="submit"
        className="border border-copper px-3 py-2 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
      >
        Run discovery job
      </button>
    </form>
  );
}
