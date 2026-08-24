import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-20">
      <h1 className="font-display text-4xl">No such cluster</h1>
      <p className="mt-3 text-muted">
        That pain point is not in the sample set yet.
      </p>
      <Link href="/opportunities" className="mt-8 text-copper hover:text-copper-2">
        Back to the scoreboard
      </Link>
    </main>
  );
}
