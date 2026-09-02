"use client";

import { useState } from "react";
import {
  analyseAffiliateOffer,
  findProgrammesForPain,
} from "@/lib/lab/actions";

export function OpportunityFinder({
  offers,
  pains,
}: {
  offers: { id: string; name: string }[];
  pains: { id: string; title: string; problem: string }[];
}) {
  const [mode, setMode] = useState<"pain" | "product">("pain");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [rows, setRows] = useState<
    {
      name: string;
      network: string;
      commission: string;
      cookie: string;
      price: string;
      fit: number;
      evidence: string;
      sources: string[];
    }[]
  >([]);

  async function onPain(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const painId = String(form.get("painId") || "");
    const custom = String(form.get("custom") || "").trim();
    const selected = pains.find((item) => item.id === painId);
    const title = custom || selected?.title || "";
    const problem = selected?.problem || custom;
    const result = await findProgrammesForPain({
      title,
      problem,
      painId: painId || undefined,
    });
    setPending(false);
    if (result.error) {
      setStatus(result.error);
      return;
    }
    setRows(result.programmes);
    setStatus(
      result.programmes.length
        ? "Research only. Join the programme yourself, then import your real tracking link. OpenAI does not invent HopLinks."
        : "No programmes returned. Try a more specific pain title.",
    );
  }

  async function onProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    const offerId = String(new FormData(event.currentTarget).get("offerId") || "");
    const result = await analyseAffiliateOffer(offerId);
    setPending(false);
    setStatus(
      result.error ||
        "Re-ran product DNA, catalog matches, and public-web evidence. Scroll to Pain matches.",
    );
  }

  return (
    <div className="border border-line p-5">
      <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
        <button
          type="button"
          onClick={() => setMode("pain")}
          className={`border px-3 py-1.5 ${
            mode === "pain" ? "border-copper text-copper" : "border-line text-muted"
          }`}
        >
          Find products for a pain
        </button>
        <button
          type="button"
          onClick={() => setMode("product")}
          className={`border px-3 py-1.5 ${
            mode === "product" ? "border-copper text-copper" : "border-line text-muted"
          }`}
        >
          Find pains for my product
        </button>
      </div>

      {mode === "pain" ? (
        <form onSubmit={onPain} className="mt-4 grid gap-3">
          <label className="text-xs text-muted">
            Catalog pain (optional)
            <select
              name="painId"
              className="mt-1 h-11 w-full border border-line bg-ink px-3 text-sm text-paper outline-none"
            >
              <option value="">Type a pain below, or pick one</option>
              {pains.map((pain) => (
                <option key={pain.id} value={pain.id}>
                  {pain.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Or describe the pain
            <input
              name="custom"
              placeholder="Headphones hurt people who wear glasses"
              className="mt-1 h-11 w-full border border-line bg-ink px-3 text-sm text-paper outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="h-11 bg-copper px-5 text-ink hover:bg-copper-2 disabled:opacity-60"
          >
            {pending ? "Searching public programmes…" : "Research affiliate programmes"}
          </button>
        </form>
      ) : (
        <form onSubmit={onProduct} className="mt-4 grid gap-3">
          <label className="text-xs text-muted">
            Imported offer
            <select
              name="offerId"
              required
              className="mt-1 h-11 w-full border border-line bg-ink px-3 text-sm text-paper outline-none"
            >
              {offers.length === 0 ? (
                <option value="">Import an offer first</option>
              ) : (
                offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <button
            type="submit"
            disabled={pending || offers.length === 0}
            className="h-11 bg-copper px-5 text-ink hover:bg-copper-2 disabled:opacity-60"
          >
            {pending ? "Analysing…" : "Generate pain matches"}
          </button>
        </form>
      )}

      {status ? <p className="mt-3 text-sm leading-6 text-signal">{status}</p> : null}

      {rows.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Network</th>
                <th className="py-2 pr-3">Payout</th>
                <th className="py-2 pr-3">Fit</th>
                <th className="py-2">Sources</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.name}-${row.network}`} className="border-t border-line">
                  <td className="py-3 pr-3">
                    <div className="text-paper">{row.name}</div>
                    <div className="mt-1 max-w-sm text-xs text-muted">{row.evidence}</div>
                  </td>
                  <td className="py-3 pr-3">{row.network}</td>
                  <td className="py-3 pr-3 font-mono text-xs">
                    {row.commission}
                    <div className="text-muted">{row.cookie}</div>
                    <div className="text-muted">{row.price}</div>
                  </td>
                  <td className="py-3 pr-3 font-mono">{row.fit}</td>
                  <td className="py-3 text-xs">
                    {row.sources.map((url) => (
                      <a
                        key={url}
                        href={url}
                        className="mt-1 block truncate text-copper hover:text-copper-2"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {url.replace(/^https?:\/\//, "").slice(0, 40)}
                      </a>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export function ResearchProgrammesButton({
  title,
  problem,
  painId,
}: {
  title: string;
  problem: string;
  painId: string;
}) {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={pending}
        className="border border-copper px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-copper hover:bg-copper hover:text-ink disabled:opacity-60"
        onClick={async () => {
          setPending(true);
          const result = await findProgrammesForPain({ title, problem, painId });
          setPending(false);
          setStatus(
            result.error ||
              `${result.programmes.length} programme lead(s) saved in the lab. Join them yourself, then import your HopLink.`,
          );
        }}
      >
        {pending ? "Searching…" : "Find products for this pain"}
      </button>
      {status ? <p className="mt-2 text-sm text-muted">{status}</p> : null}
    </div>
  );
}
