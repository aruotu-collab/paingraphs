import Link from "next/link";

export const metadata = {
  title: "How PainGraphs works",
  description:
    "Shoppers get a PainGraph. Affiliates get campaign packs. Founders get hypothesized pains and self-serve validation pages. One account. You run your own ads.",
};

export default function HowItWorksPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">
        How it works
      </p>
      <h1 className="mt-3 font-display text-5xl">See the output, then sign in.</h1>
      <p className="mt-5 text-lg leading-8 text-muted">
        PainGraphs is a three-sided market. Nobody picks a role at signup. The
        doors are public. You register when you want to continue.
      </p>

      <section className="mt-12 space-y-8">
        <Block
          title="Shoppers"
          body="Open a published pain page on the homepage. Read what people actually complain about. Set the sliders. See a PainGraph that ranks option types against your mix. Track a live page from there — it lands in your workspace."
        />
        <Block
          title="Painpoint Billboard"
          body="A separate daily chart of search topics, not live shopper pages. Save topics to investigate, then prepare one in detail when you want a full page."
        />
        <Block
          title="Affiliates"
          body="Use I Want to Earn. Browse published pains with products worth promoting. Open the sample report. Paste a merchant URL on Reverse PainGraph if we do not have the pain yet. You run the ads."
        />
        <Block
          title="Founders"
          body="Use I Want to Build. Find an underserved published pain, or reverse-match a product you already sell. Host the test from your workspace. Public tests are listed separately from the marketplace."
        />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Inside-out discovery</h2>
        <ol className="mt-5 space-y-3 text-sm leading-6 text-muted">
          <li>1. Paste a product URL. PainGraphs extracts the product DNA.</li>
          <li>2. It matches existing pains or writes unvalidated hypotheses.</li>
          <li>3. You pick which hypotheses to host as public test pages.</li>
          <li>4. You get copy-ready Meta and Google packs. You launch them.</li>
          <li>5. You enter spend, clicks, quiz completes, waitlist joins.</li>
          <li>6. PainGraphs tells you which pain to keep, stop, or re-angle.</li>
        </ol>
      </section>

      <p className="mt-10 text-sm text-muted">
        Self-serve only. We do not spend your ad budget or log into your ad
        accounts.{" "}
        <Link href="/pricing" className="text-copper hover:text-copper-2">
          See pricing
        </Link>
        .
      </p>
    </main>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mt-3 leading-7 text-muted">{body}</p>
    </div>
  );
}
