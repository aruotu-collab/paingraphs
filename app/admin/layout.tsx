import Link from "next/link";
import { ADMIN_EMAIL } from "@/lib/admin";
import { requireAdmin } from "@/lib/session";

const links = [
  ["Overview", "/admin"],
  ["Visits & IPs", "/admin/visits"],
  ["Accounts", "/admin/users"],
  ["Demand data", "/admin/demand"],
  ["Affiliate lab", "/workspace/lab"],
];

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
        Operator only · {ADMIN_EMAIL}
      </p>
      <nav className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
