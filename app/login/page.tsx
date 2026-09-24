import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/home";
  const keep = params.reason === "keep";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl">Sign in</h1>
        <p className="mt-3 text-muted">
          {keep
            ? "Sign in to keep this match. New here? Create an account first."
            : "One account for Solve, Promote, and Build."}
        </p>
      </div>
      <AuthForm mode="login" next={next} />
    </main>
  );
}
