import Link from "next/link";

export function SeoLanding({
  kicker,
  title,
  intro,
  points,
  href,
  cta,
}: {
  kicker: string;
  title: string;
  intro: string;
  points: string[];
  href: string;
  cta: string;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">{kicker}</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.05]">{title}</h1>
      <p className="mt-5 text-lg leading-8 text-muted">{intro}</p>
      <ul className="mt-8 space-y-3 text-sm leading-6 text-paper">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-10 inline-block bg-copper px-5 py-2.5 text-ink hover:bg-copper-2"
      >
        {cta}
      </Link>
    </main>
  );
}
