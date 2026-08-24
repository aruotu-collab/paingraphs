import { AuthForm } from "@/components/auth-form";

export default async function SignupPage({
  searchParams,
}: PageProps<"/signup">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/opportunities";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl">Create an account</h1>
        <p className="mt-3 text-muted">
          Save markets and come back as the live graph fills.
        </p>
      </div>
      <AuthForm mode="signup" next={next} />
    </main>
  );
}
