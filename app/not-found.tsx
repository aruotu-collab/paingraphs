import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-16">
      <h1 className="font-display text-4xl">Page not found</h1>
      <p className="mt-4 text-sm text-muted">
        That URL is not a published PainGraph.
      </p>
      <Link href="/" className="mt-8 text-sm text-copper hover:text-copper-2">
        Explore pains
      </Link>
    </main>
  );
}
