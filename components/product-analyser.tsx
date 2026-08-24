"use client";

import { useActionState } from "react";
import { analyseProduct, type AnalyseState } from "@/lib/product/actions";

export function ProductAnalyser({ initialUrl }: { initialUrl?: string }) {
  const [state, action, pending] = useActionState<AnalyseState | null, FormData>(
    analyseProduct,
    null,
  );

  return (
    <form action={action} className="mt-8 border border-line bg-ink-2 p-5">
      <label className="block text-sm text-muted" htmlFor="product-url">
        Product URL
      </label>
      <div className="mt-3 flex">
        <input
          id="product-url"
          name="url"
          type="url"
          required
          defaultValue={initialUrl}
          placeholder="https://yourproduct.com"
          className="h-11 flex-1 border border-line bg-ink px-3 outline-none focus:border-copper"
        />
        <button
          type="submit"
          disabled={pending}
          className="border border-l-0 border-copper bg-copper px-4 text-sm text-ink hover:bg-copper-2 disabled:opacity-60"
        >
          {pending ? "Reading the page…" : "Analyse"}
        </button>
      </div>
      {state?.error ? (
        <p className="mt-3 text-sm text-red-400">{state.error}</p>
      ) : null}
    </form>
  );
}
