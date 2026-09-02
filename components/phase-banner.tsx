import Link from "next/link";

export function PhaseBanner() {
  return (
    <div className="border-b border-line bg-ink-2 px-5 py-2 text-center text-xs tracking-wide text-muted">
      Pain-first decision tools, not thin affiliate articles.{" "}
      <Link href="/privacy" className="text-copper hover:text-copper-2">
        How email consent works
      </Link>
      .
    </div>
  );
}
