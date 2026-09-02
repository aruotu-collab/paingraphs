import { loadAdminUsers } from "@/lib/admin/actions";
import { isAdminEmail } from "@/lib/admin";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin("/admin/users");
  const people = await loadAdminUsers();

  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-4xl">Accounts and sessions</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Better Auth session IPs plus the visit log. Passwords and magic-link
        tokens are never shown.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Joined</th>
              <th className="py-2 pr-3">Sessions</th>
              <th className="py-2 pr-3">Last IP</th>
              <th className="py-2">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id} className="border-t border-line">
                <td className="py-3 pr-3">
                  {person.email}
                  {isAdminEmail(person.email) ? (
                    <span className="ml-2 text-xs uppercase tracking-[0.14em] text-copper">
                      operator
                    </span>
                  ) : null}
                  <div className="text-xs text-muted">
                    {person.emailVerified ? "verified" : "unverified"} · {person.name}
                  </div>
                </td>
                <td className="py-3 pr-3 font-mono text-xs">
                  {person.createdAt.toISOString().slice(0, 10)}
                </td>
                <td className="py-3 pr-3 font-mono">{person.sessionCount}</td>
                <td className="py-3 pr-3 font-mono text-xs">
                  {person.lastIp || "—"}
                </td>
                <td className="py-3 font-mono text-xs">
                  {person.lastSeen
                    ? person.lastSeen.toISOString().replace("T", " ").slice(0, 19)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
