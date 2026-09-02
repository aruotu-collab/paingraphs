export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
      <h1 className="font-display text-4xl">Privacy and email</h1>
      <div className="mt-6 space-y-4 leading-7 text-muted">
        <p>
          Completing the sliders does not subscribe you. Seeing your PainGraph
          sends a sign-in link to your email and creates a PainGraphs account
          when you click it. We only send marketing if you tick that box.
          Health-related pages still need their own explicit tick.
        </p>
        <p>
          PainGraphs keeps the consumer relationship. We do not sell or hand
          over raw email lists to founders or affiliates. Campaigns, if we add
          them later, run inside PainGraphs to people who opted in.
        </p>
        <p>
          Composite quotes on pages are aggregated research language, not a
          claim that a named person posted that sentence. Live YouTube comments
          are stored only when pulled through the official API and still sound
          like a real problem.
        </p>
      </div>
    </main>
  );
}
