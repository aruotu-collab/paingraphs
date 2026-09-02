"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="pb-16">
      <h1 className="mt-8 font-display text-3xl">Admin failed to load</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        The operator console hit a server error. Tables may still be creating.
        Reload once.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 bg-copper px-5 py-2.5 text-ink hover:bg-copper-2"
      >
        Reload
      </button>
    </main>
  );
}
