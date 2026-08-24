import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/opportunities";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-16">
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl">Log in</h1>
        <p className="mt-3 text-muted">
          Save markets, attach a product, and use the agent.
        </p>
      </div>
      <AuthForm mode="login" next={next} />
    </main>
  );
}
