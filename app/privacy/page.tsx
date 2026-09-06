export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
      <h1 className="font-display text-4xl">Privacy</h1>
      <div className="mt-6 space-y-4 leading-7 text-muted">
        <p>
          You can browse PainGraphs and use recommendation sliders without an
          account. Saving a pain or following updates requires an email.
          Alert emails are off unless you turn them on under member Alerts.
        </p>
        <p>
          We do not sell member lists to affiliates or founders. Private
          affiliate URLs stay on the member account that saved them.
        </p>
        <p>
          The operator may log page paths, IP address, approximate location when
          the host provides it, browser user agent, and referrer. Sign-in tokens
          are not stored in that log.
        </p>
      </div>
    </main>
  );
}
