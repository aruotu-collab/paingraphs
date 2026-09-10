import Link from "next/link";
import { markMyAlertsRead } from "@/lib/alerts/actions";
import { getAlertPrefs, listMemberAlerts, unreadAlertCount } from "@/lib/alerts/store";
import { AlertPrefsForm } from "@/components/alert-prefs-form";
import { GenerateAlertsButton } from "@/components/generate-alerts-button";
import { getAccess, requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Alerts",
  robots: { index: false, follow: false },
};

export default async function AlertsPage() {
  const session = await requireSession("/home/alerts");
  const access = await getAccess(session.user);
  const owner = access.capabilities.admin || access.capabilities.marketingAgent;
  const [prefs, alerts, unread] = await Promise.all([
    getAlertPrefs(session.user.id),
    listMemberAlerts(session.user.id),
    unreadAlertCount(session.user.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        Member home · Alerts
      </p>
      <h1 className="mt-3 font-display text-4xl">Updates on pains you follow.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
        Alerts fire when a saved PainGraph gets more evidence, another scored
        product, a public Check price destination, a recorded price change, or
        a real score move. Opt in below if you want the same updates by email.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/home" className="text-copper hover:text-copper-2">
          Back to member home
        </Link>
        {unread > 0 ? (
          <form action={markMyAlertsRead}>
            <button type="submit" className="text-copper hover:text-copper-2">
              Mark {unread} read
            </button>
          </form>
        ) : null}
      </div>

      <section className="mt-10">
        <AlertPrefsForm prefs={prefs} />
        {owner ? <GenerateAlertsButton /> : null}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Inbox</h2>
        {alerts.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Nothing yet. Save a pain, then wait for a real change or today&apos;s
            opportunity pick.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={
                  alert.readAt
                    ? "border border-line p-5"
                    : "border border-copper p-5"
                }
              >
                <p className="text-xs uppercase tracking-[0.16em] text-copper">
                  {alert.day}
                  {alert.readAt ? "" : " · New"}
                </p>
                <h3 className="mt-2 font-display text-2xl">{alert.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{alert.body}</p>
                <Link
                  href={alert.href}
                  className="mt-3 inline-block text-sm text-copper hover:text-copper-2"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
