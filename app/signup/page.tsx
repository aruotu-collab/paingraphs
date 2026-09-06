import { AuthForm } from "@/components/auth-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/home";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl">Get started</h1>
        <p className="mt-3 text-muted">
          Consumer access is included. Add Affiliate or Founder on the same account.
        </p>
      </div>
      <AuthForm mode="signup" next={next} />
    </main>
  );
}
