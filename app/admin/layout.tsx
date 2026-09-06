import Link from "next/link";
import { requireAdmin } from "@/lib/session";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin("/admin");
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Owner only · Admin
      </p>
      <nav className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
        <Link href="/admin" className="border border-copper px-3 py-1.5 text-copper">
          Overview
        </Link>
        <Link
          href="/marketing-agent"
          className="border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
        >
          Marketing Agent
        </Link>
      </nav>
      {children}
    </div>
  );
}
