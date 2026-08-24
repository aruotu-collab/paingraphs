import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const placeholders = [
  {
    title: "Reddit — agency reporting",
    fit: "96% fit",
    action: "Draft a useful reply, disclose affiliation",
  },
  {
    title: "Comparison page opportunity",
    fit: "SEO",
    action: "Best alternatives to meeting-note tools for agencies",
  },
  {
    title: "Forum — trades quote chasing",
    fit: "94% intent",
    action: "Personal reply. No autopost.",
  },
];

export default async function AgentPage() {
  await requireSession();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Copilot, not autopilot
      </p>
      <h1 className="mt-2 font-display text-4xl">Agent</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Today’s highest-value distribution opportunities. Phase 3 will draft
        responses with community rules. You approve, edit, or ignore. Nothing
        posts itself.
      </p>
      <ul className="mt-10 space-y-4">
        {placeholders.map((item) => (
          <li key={item.title} className="border border-line p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-2xl">{item.title}</h2>
              <span className="font-mono text-sm text-copper">{item.fit}</span>
            </div>
            <p className="mt-3 text-sm text-muted">{item.action}</p>
            <div className="mt-5 flex gap-3 text-xs uppercase tracking-[0.14em]">
              <button
                type="button"
                disabled
                className="border border-line px-3 py-1.5 text-muted"
              >
                Approve
              </button>
              <button
                type="button"
                disabled
                className="border border-line px-3 py-1.5 text-muted"
              >
                Edit
              </button>
              <button
                type="button"
                disabled
                className="border border-line px-3 py-1.5 text-muted"
              >
                Ignore
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
