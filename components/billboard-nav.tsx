import Link from "next/link";
import type { BillboardView } from "@/lib/opportunities/board";

const TABS: { id: BillboardView; label: string }[] = [
  { id: "pain", label: "Top pains" },
  { id: "intent", label: "Buying intent" },
  { id: "affiliate", label: "Affiliate" },
  { id: "founder", label: "Founder" },
  { id: "underserved", label: "Underserved" },
];

export function BillboardNav({
  view,
  category,
}: {
  view: BillboardView;
  category?: string;
}) {
  return (
    <nav className="mt-8 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
      {TABS.map((tab) => {
        const params = new URLSearchParams();
        if (tab.id !== "pain") params.set("view", tab.id);
        if (category) params.set("category", category);
        const href = params.size ? `/top-pains?${params}` : "/top-pains";
        return (
          <Link
            key={tab.id}
            href={href}
            className={
              view === tab.id
                ? "border border-copper px-3 py-1.5 text-copper"
                : "border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
