import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-5 py-6 text-xs text-muted">
        <Link href="/for-affiliates" className="hover:text-paper">
          Affiliates
        </Link>
        <Link href="/for-founders" className="hover:text-paper">
          Founders
        </Link>
        <Link href="/how-it-works" className="hover:text-paper">
          How it works
        </Link>
        <Link href="/pricing" className="hover:text-paper">
          Pricing
        </Link>
        <Link href="/lab" className="hover:text-paper">
          Testing lab
        </Link>
        <Link href="/privacy" className="hover:text-paper">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
