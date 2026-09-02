import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-20">
      <h1 className="font-display text-4xl">No such pain</h1>
      <p className="mt-3 text-muted">
        That page is not in the market yet. We only publish a deeper URL when
        there is enough evidence to be useful.
      </p>
      <Link href="/" className="mt-8 text-copper hover:text-copper-2">
        Back to the pain market
      </Link>
    </main>
  );
}
