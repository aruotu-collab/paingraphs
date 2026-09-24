import Link from "next/link";
import type { PainGraph } from "@/lib/paingraph/types";

export function PainCard({
  graph,
  href,
  note,
}: {
  graph: PainGraph;
  href?: string;
  note?: string;
}) {
  return (
    <Link
      href={href ?? graph.href}
      className="block rounded-2xl border border-[#d7e2d4] bg-white p-5 hover:border-[#1f8a4d]"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-[#5d7263]">
        {graph.category.name} · {graph.subcategory.name}
      </p>
      <h2 className="mt-2 break-words font-display text-2xl text-[#12281a]">{graph.title}</h2>
      <p className="mt-3 text-sm leading-6 break-words text-[#5d7263]">{graph.summary}</p>
      {graph.concerns.length > 0 ? (
        <p className="mt-4 text-xs leading-5 break-words text-[#3f6b4c]">
          {graph.concerns.map((item) => item.name).join(" · ")}
        </p>
      ) : null}
      {note ? <p className="mt-3 font-mono text-xs text-[#1f8a4d]">{note}</p> : null}
    </Link>
  );
}
