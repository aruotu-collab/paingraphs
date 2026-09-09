import { billingRows } from "@/lib/admin/ops";
import { formatStamp } from "@/lib/admin/format";
import { stripeConfigured } from "@/lib/billing/stripe";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const rows = await billingRows();
  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Billing</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Stripe subscription state stored on member profiles. Stripe is{" "}
        {stripeConfigured() ? "configured" : "not configured in this environment"}.
      </p>
      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No paid subscriptions yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Cancels</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="py-3 pr-3">{row.email}</td>
                  <td className="py-3 pr-3">{row.plan || "free"}</td>
                  <td className="py-3 pr-3">{row.stripeStatus || "—"}</td>
                  <td className="py-3 text-muted">
                    {row.stripeCancelAt
                      ? formatStamp(row.stripeCancelAt, "date")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
