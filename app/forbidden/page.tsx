import Link from "next/link";

export const metadata = {
  title: "Access denied",
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-copper">403</p>
      <h1 className="mt-3 font-display text-4xl">This area is owner-only.</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
        Admin and Marketing Agent require the OWNER role. That check happens on
        the server.
      </p>
      <Link href="/home" className="mt-8 text-sm text-copper hover:text-copper-2">
        Back to home
      </Link>
    </main>
  );
}
