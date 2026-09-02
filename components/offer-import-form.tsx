"use client";

import { useState } from "react";
import { analyseAffiliateOffer, importAffiliateOffer } from "@/lib/lab/actions";

export function OfferImportForm() {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const gravityRaw = String(form.get("gravity") || "").trim();
    const result = await importAffiliateOffer({
      name: String(form.get("name") || ""),
      salesUrl: String(form.get("salesUrl") || ""),
      hopLink: String(form.get("hopLink") || ""),
      vendor: String(form.get("vendor") || ""),
      category: String(form.get("category") || ""),
      description: String(form.get("description") || ""),
      price: String(form.get("price") || ""),
      commissionType: String(form.get("commissionType") || ""),
      commissionAmount: String(form.get("commissionAmount") || ""),
      recurring: form.get("recurring") === "on",
      gravity: gravityRaw ? Number(gravityRaw) : null,
      avgPayout: String(form.get("avgPayout") || ""),
      assets: String(form.get("assets") || ""),
      countries: String(form.get("countries") || ""),
    });
    if (result.error) {
      setPending(false);
      setStatus(result.error);
      return;
    }
    if (result.id) {
      const analysed = await analyseAffiliateOffer(result.id);
      setPending(false);
      setStatus(
        analysed.error ||
          "Imported. Catalog pains are scored immediately. New guesses stay unvalidated until public-web evidence is strong enough.",
      );
      event.currentTarget.reset();
      return;
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <Field name="name" label="Product name" required />
      <Field name="vendor" label="ClickBank vendor / nickname" />
      <Field name="salesUrl" label="Sales page URL" required className="sm:col-span-2" />
      <Field
        name="hopLink"
        label="Your HopLink (from your ClickBank account)"
        required
        className="sm:col-span-2"
      />
      <label className="text-xs text-muted sm:col-span-2">
        Description
        <textarea
          name="description"
          rows={3}
          className="mt-1 w-full border border-line bg-ink px-3 py-2 text-sm text-paper outline-none"
        />
      </label>
      <Field name="category" label="Category" />
      <Field name="price" label="Price" />
      <Field name="commissionType" label="Commission type" />
      <Field name="commissionAmount" label="Commission / avg payout" />
      <Field name="gravity" label="Gravity (optional, you type it)" />
      <Field name="avgPayout" label="Avg payout note" />
      <Field name="countries" label="Countries (if relevant)" />
      <label className="text-xs text-muted sm:col-span-2">
        Promotional assets (notes / URLs you are allowed to use)
        <textarea
          name="assets"
          rows={2}
          className="mt-1 w-full border border-line bg-ink px-3 py-2 text-sm text-paper outline-none"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
        <input type="checkbox" name="recurring" />
        Recurring commission
      </label>
      <p className="text-xs leading-5 text-muted sm:col-span-2">
        Paste details you are allowed to use. PainGraphs does not log into
        ClickBank or scrape the Marketplace. The HopLink must come from your
        own affiliate account — OpenAI does not invent tracking URLs.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="h-11 bg-copper px-5 text-ink hover:bg-copper-2 disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Reading sales page…" : "Import and find pains"}
      </button>
      {status ? <p className="text-sm text-signal sm:col-span-2">{status}</p> : null}
    </form>
  );
}

function Field({
  name,
  label,
  required,
  className = "",
}: {
  name: string;
  label: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`text-xs text-muted ${className}`}>
      {label}
      <input
        name={name}
        required={required}
        className="mt-1 h-11 w-full border border-line bg-ink px-3 text-sm text-paper outline-none"
      />
    </label>
  );
}
