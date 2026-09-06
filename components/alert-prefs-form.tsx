import { updateAlertPrefs } from "@/lib/alerts/actions";
import type { AlertPrefs } from "@/lib/alerts/types";

export function AlertPrefsForm({ prefs }: { prefs: AlertPrefs }) {
  return (
    <form action={updateAlertPrefs} className="space-y-4 border border-line p-5">
      <h2 className="font-display text-2xl">Email</h2>
      <p className="text-sm leading-6 text-muted">
        In-app updates are on when you save a pain. Email stays off until you
        choose it.
      </p>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input
          type="checkbox"
          name="emailSavedUpdates"
          defaultChecked={prefs.emailSavedUpdates}
          className="mt-1"
        />
        <span>Email me when a saved pain gets a real update.</span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input
          type="checkbox"
          name="emailOpportunity"
          defaultChecked={prefs.emailOpportunity}
          className="mt-1"
        />
        <span>Email me the affiliate and founder opportunities of the day.</span>
      </label>
      <button
        type="submit"
        className="border border-copper px-4 py-2 text-sm text-copper hover:bg-copper hover:text-ink"
      >
        Save email preferences
      </button>
    </form>
  );
}
