import Link from "next/link";

export function BillboardTabs({ tab }: { tab: "chart" | "favourites" }) {
  return (
    <div className="mt-8 flex gap-6 border-b border-line text-sm uppercase tracking-[0.16em]">
      <Link
        href="/billboard"
        className={tab === "chart" ? "border-b-2 border-copper pb-3 text-paper" : "pb-3 text-muted hover:text-paper"}
      >
        The chart
      </Link>
      <Link
        href="/billboard/favourites"
        className={
          tab === "favourites" ? "border-b-2 border-copper pb-3 text-paper" : "pb-3 text-muted hover:text-paper"
        }
      >
        My favourites
      </Link>
    </div>
  );
}
