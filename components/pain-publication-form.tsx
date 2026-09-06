import { setPainPublication } from "@/lib/admin/pains";

export function PainPublicationForm({
  painId,
  status,
}: {
  painId: string;
  status: string;
}) {
  const published = status === "published";
  const next = published ? "draft" : "published";

  return (
    <form
      action={async () => {
        "use server";
        await setPainPublication(painId, next);
      }}
    >
      <button
        type="submit"
        className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper"
      >
        {published ? "Unpublish" : "Publish"}
      </button>
    </form>
  );
}
