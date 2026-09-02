"use client";

import { useState } from "react";
import { scanProductUrl } from "@/lib/journeys/actions";
import type { ProductScanView } from "@/lib/journeys/types";
import { CampaignPackView } from "@/components/campaign-pack";

export function ProductScanForm({
  signedIn,
  intent = "founder",
}: {
  signedIn: boolean;
  intent?: "founder" | "affiliate";
}) {
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [scan, setScan] = useState<ProductScanView | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    const result = await scanProductUrl(url);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setScan(result.scan);
  }

  const signup = `/signup?next=${encodeURIComponent("/workspace")}`;

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/your-product"
          className="h-11 min-w-0 flex-1 border border-line bg-ink-2 px-3 outline-none focus:border-copper"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 bg-copper px-5 text-ink hover:bg-copper-2 disabled:opacity-60"
        >
          {pending ? "Reading page…" : "Find the pains"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-signal">{error}</p> : null}

      {scan ? (
        <div className="mt-10 space-y-8">
          <div className="border border-line p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Product DNA
            </p>
            <h2 className="mt-2 font-display text-3xl">{scan.dna.name}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{scan.dna.summary}</p>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <Fact label="Solves" value={scan.dna.solves} />
              <Fact label="For" value={scan.dna.forWho} />
              <Fact label="When" value={scan.dna.when} />
              <Fact label="Price" value={scan.dna.price} />
            </dl>
          </div>

          <p className="text-sm text-muted">
            {scan.signedIn
              ? `We found ${scan.items.length} possible pain matches. Host a test page, then paste the campaign into Meta or Google yourself.`
              : `We found ${scan.items.length} possible pain matches. The first one is open. Sign in to see the rest and generate campaign packs.`}
          </p>

          {scan.items.map((item, index) => (
            <article key={`${item.title}-${index}`} className="border border-line p-5">
              {item.locked ? (
                <div className="relative overflow-hidden">
                  <div className="pointer-events-none select-none blur-[3px]">
                    <p className="text-xs uppercase tracking-[0.16em] text-copper">
                      {item.matchScore}% match
                    </p>
                    <h3 className="mt-2 font-display text-2xl">{item.title}</h3>
                    <p className="mt-3 text-sm text-muted">{item.problem}</p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/65">
                    <a
                      href={signup}
                      className="bg-copper px-5 py-2.5 text-ink hover:bg-copper-2"
                    >
                      Sign in to see the full Reverse PainGraph
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-[0.16em] text-copper">
                    {item.origin === "catalog"
                      ? `${item.matchScore}% match · existing PainGraph`
                      : "Unvalidated pain hypothesis"}
                  </p>
                  <h3 className="mt-2 font-display text-3xl">{item.h1}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{item.problem}</p>
                  <p className="mt-3 text-sm text-paper">Audience: {item.audience}</p>
                  {item.customerLanguage.length > 0 ? (
                    <blockquote className="mt-4 border-l border-copper pl-4 text-sm leading-6 text-muted">
                      “{item.customerLanguage[0]}”
                    </blockquote>
                  ) : null}
                  {item.catalogHref ? (
                    <a
                      href={item.catalogHref}
                      className="mt-4 inline-block text-sm text-copper hover:text-copper-2"
                    >
                      Open the live pain page
                    </a>
                  ) : null}
                  <div className="mt-8">
                    <h4 className="text-xs uppercase tracking-[0.16em] text-muted">
                      Generated campaign
                    </h4>
                    <div className="mt-4">
                      <CampaignPackView
                        pack={item.campaignPack}
                        locked={!scan.signedIn}
                        signupHref={signup}
                      />
                    </div>
                  </div>
                  {scan.signedIn && item.id ? (
                    <PublishButton hypothesisId={item.id} />
                  ) : null}
                  <p className="mt-4 text-xs text-muted">
                    {intent === "affiliate"
                      ? "You run the ads. PainGraphs hosts the page, questionnaire, and analysis."
                      : "Test the pain before you pitch the product. You run the ads from your own accounts."}
                  </p>
                </>
              )}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 text-paper">{value}</dd>
    </div>
  );
}

function PublishButton({ hypothesisId }: { hypothesisId: string }) {
  const [href, setHref] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="mt-6">
      {href ? (
        <a href={href} className="text-sm text-copper hover:text-copper-2">
          Test page is live: {href}
        </a>
      ) : (
        <button
          type="button"
          className="border border-copper px-4 py-2 text-sm text-copper hover:bg-copper hover:text-ink"
          onClick={async () => {
            const { publishHypothesisPage } = await import("@/lib/journeys/actions");
            const result = await publishHypothesisPage(hypothesisId);
            if (result.error) setError(result.error);
            if (result.href) setHref(result.href);
          }}
        >
          Host a PainGraphs test page
        </button>
      )}
      {error ? <p className="mt-2 text-sm text-signal">{error}</p> : null}
    </div>
  );
}
