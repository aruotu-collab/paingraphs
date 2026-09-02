import { CopyButton } from "@/components/copy-button";
import type { CampaignPack } from "@/lib/journeys/types";

export function CampaignPackView({
  pack,
  locked = false,
  signupHref,
}: {
  pack: CampaignPack;
  locked?: boolean;
  signupHref?: string;
}) {
  if (locked) {
    return (
      <div className="relative overflow-hidden border border-line p-5">
        <div className="pointer-events-none select-none blur-[3px]">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Meta campaign
          </p>
          <p className="mt-3 text-sm leading-6">{pack.meta.angles[0]?.headline}</p>
          <p className="mt-2 text-sm text-muted">
            {pack.meta.angles[0]?.primaryText.slice(0, 140)}…
          </p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-ink/70 px-5 text-center">
          <a
            href={signupHref ?? "/signup?next=/workspace"}
            className="bg-copper px-5 py-2.5 text-ink hover:bg-copper-2"
          >
            Create your free workspace to generate campaigns
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pack.meta.angles.map((angle) => {
        const blob = [
          `Objective: ${pack.meta.objective}`,
          `Pain: ${pack.meta.pain}`,
          `Audience: ${pack.meta.audience}`,
          `Headline: ${angle.headline}`,
          `Primary text:\n${angle.primaryText}`,
          `CTA: ${angle.cta}`,
          `Creative brief: ${angle.creativeBrief}`,
          `Destination: ${pack.meta.destinationUrl}`,
          `Tracking: ${pack.meta.trackingUrl}`,
        ].join("\n\n");
        return (
          <div key={angle.name} className="border border-line p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted">
                  Meta · {angle.name}
                </p>
                <h3 className="mt-2 font-display text-2xl">{angle.headline}</h3>
              </div>
              <CopyButton label="Copy Facebook ad" text={blob} />
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted">
              {angle.primaryText}
            </p>
            <p className="mt-3 text-xs text-copper">{angle.creativeBrief}</p>
          </div>
        );
      })}

      <div className="border border-line p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              Google Search
            </p>
            <h3 className="mt-2 font-display text-2xl">{pack.google.campaignName}</h3>
          </div>
          <CopyButton
            label="Copy Google ad"
            text={[
              pack.google.campaignName,
              `Keywords:\n${pack.google.keywords.join("\n")}`,
              `Negatives:\n${pack.google.negatives.join("\n")}`,
              `Headlines:\n${pack.google.headlines.join("\n")}`,
              `Descriptions:\n${pack.google.descriptions.join("\n")}`,
              `URL: ${pack.google.destinationUrl}`,
              `Budget: ${pack.google.budgetHint}`,
              `Conversions:\n${pack.google.conversionEvents.join("\n")}`,
            ].join("\n\n")}
          />
        </div>
        <ul className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
          {pack.google.keywords.map((word) => (
            <li key={word}>{word}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-copper">{pack.google.budgetHint}</p>
      </div>

      <div className="border border-line p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Email</p>
            <h3 className="mt-2 font-display text-2xl">{pack.email.subject}</h3>
          </div>
          <CopyButton
            label="Copy email"
            text={`${pack.email.subject}\n${pack.email.preview}\n\n${pack.email.body}`}
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">{pack.email.body}</p>
      </div>

      {pack.seo ? (
        <div className="border border-line p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                SEO
              </p>
              <h3 className="mt-2 font-display text-2xl">{pack.seo.title}</h3>
            </div>
            <CopyButton
              label="Copy SEO pack"
              text={[
                pack.seo.title,
                `Keywords:\n${pack.seo.keywords.join("\n")}`,
                `Outline:\n${pack.seo.outline.join("\n")}`,
              ].join("\n\n")}
            />
          </div>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
            {pack.seo.outline.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {pack.organic ? (
        <div className="border border-line p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Organic pack
              </p>
              <h3 className="mt-2 font-display text-2xl">Keyword cluster</h3>
            </div>
            <CopyButton
              label="Copy organic pack"
              text={[
                `Keywords:\n${pack.organic.keywords.join("\n")}`,
                `Articles:\n${pack.organic.articles.join("\n")}`,
                `FAQs:\n${pack.organic.faqs.join("\n")}`,
                `Internal links:\n${pack.organic.internalLinks.join("\n")}`,
                `Calendar:\n${pack.organic.calendar.join("\n")}`,
                `Video:\n${pack.organic.videoScript}`,
              ].join("\n\n")}
            />
          </div>
          <ul className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
            {pack.organic.keywords.map((word) => (
              <li key={word}>{word}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-6 text-paper">
            {pack.organic.calendar[0]}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">
            {pack.organic.videoScript}
          </p>
        </div>
      ) : null}

      {pack.affiliate ? (
        <div className="border border-copper/40 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-copper">
            Affiliate recommendation (after the PainGraph)
          </p>
          <h3 className="mt-2 font-display text-2xl">{pack.affiliate.name}</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            {pack.affiliate.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="mt-3 break-all text-xs text-muted">
            HopLink lives on the report button, not in the ad destination:{" "}
            {pack.affiliate.url}
          </p>
        </div>
      ) : null}
    </div>
  );
}
