import { saveDiscoverySource, submitDiscoverySignal } from "@/lib/discovery/actions";
import {
  ACCESS_METHODS,
  COMMERCIAL_USE,
  SOURCE_TYPES,
} from "@/lib/discovery/store";

export function SourceForm() {
  return (
    <form action={saveDiscoverySource} className="mt-6 grid gap-3 border border-line p-5">
      <h3 className="font-display text-2xl">Register a source</h3>
      <p className="text-sm leading-6 text-muted">
        Only permitted, licensed, or owner-pasted sources. No indiscriminate crawl.
      </p>
      <input
        name="name"
        required
        placeholder="Source name"
        className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
      />
      <div className="grid gap-3 md:grid-cols-3">
        <select
          name="sourceType"
          defaultValue="manual"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        >
          {SOURCE_TYPES.map((value) => (
            <option key={value} value={value} className="bg-ink">
              {value}
            </option>
          ))}
        </select>
        <select
          name="accessMethod"
          defaultValue="manual"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        >
          {ACCESS_METHODS.map((value) => (
            <option key={value} value={value} className="bg-ink">
              {value}
            </option>
          ))}
        </select>
        <select
          name="commercialUse"
          defaultValue="unknown"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        >
          {COMMERCIAL_USE.map((value) => (
            <option key={value} value={value} className="bg-ink">
              {value}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="termsNotes"
        rows={2}
        placeholder="Licensing / terms notes"
        className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
      />
      <div className="grid gap-3 md:grid-cols-3">
        <input
          name="attribution"
          placeholder="Attribution"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="retention"
          placeholder="Retention"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="rateLimit"
          placeholder="Rate limit"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="enabled" value="1" defaultChecked />
        Enabled
      </label>
      <button
        type="submit"
        className="justify-self-start border border-copper px-3 py-2 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink"
      >
        Save source
      </button>
    </form>
  );
}

export function SignalForm({
  sources,
}: {
  sources: { id: string; name: string }[];
}) {
  return (
    <form action={submitDiscoverySignal} className="mt-6 grid gap-3 border border-line p-5">
      <h3 className="font-display text-2xl">Paste a permitted signal</h3>
      <select
        name="sourceId"
        className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        defaultValue={sources[0]?.id}
      >
        {sources.map((source) => (
          <option key={source.id} value={source.id} className="bg-ink">
            {source.name}
          </option>
        ))}
      </select>
      <textarea
        name="rawText"
        required
        rows={4}
        placeholder="Public quote or first-party note"
        className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
      />
      <div className="grid gap-3 md:grid-cols-3">
        <input
          name="sourceUrl"
          type="url"
          placeholder="https://…"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="persona"
          placeholder="Persona"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
        <input
          name="geography"
          placeholder="Geography"
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
      </div>
      <button
        type="submit"
        className="justify-self-start border border-line px-3 py-2 text-xs uppercase tracking-[0.14em] text-muted hover:border-copper hover:text-copper"
      >
        Queue signal
      </button>
    </form>
  );
}
