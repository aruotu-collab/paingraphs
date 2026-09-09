import { AdminNav } from "@/components/admin-nav";
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
      <AdminNav />
      {children}
    </div>
  );
}
