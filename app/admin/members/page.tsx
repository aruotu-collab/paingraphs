import { listMembers } from "@/lib/admin/ops";
import { formatStamp } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const members = await listMembers();
  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Members</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Accounts, plans, and Stripe status. Role changes stay owner-seeded.
      </p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Plan</th>
              <th className="py-2 pr-3">Mode</th>
              <th className="py-2 pr-3">Stripe</th>
              <th className="py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-line">
                <td className="py-3 pr-3">
                  <p>{member.email}</p>
                  <p className="text-xs text-muted">{member.name}</p>
                </td>
                <td className="py-3 pr-3">{member.plan || "free"}</td>
                <td className="py-3 pr-3">{member.mode || "solve"}</td>
                <td className="py-3 pr-3">{member.stripeStatus || "—"}</td>
                <td className="py-3 text-muted">
                  {formatStamp(member.createdAt, "date")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
