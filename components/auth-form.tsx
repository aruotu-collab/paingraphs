"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function AuthForm({
  mode,
  next = "/opportunities",
}: {
  mode: "login" | "signup";
  next?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const result =
      mode === "signup"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

    setPending(false);

    if (result.error) {
      setError(result.error.message || "Something went wrong.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-5">
      {mode === "signup" ? (
        <label className="block space-y-2 text-sm">
          <span className="text-muted">Name</span>
          <input
            required
            name="name"
            autoComplete="name"
            className="h-11 w-full border border-line bg-ink-2 px-3 outline-none focus:border-copper"
          />
        </label>
      ) : null}
      <label className="block space-y-2 text-sm">
        <span className="text-muted">Email</span>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          className="h-11 w-full border border-line bg-ink-2 px-3 outline-none focus:border-copper"
        />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="text-muted">Password</span>
        <input
          required
          type="password"
          name="password"
          minLength={8}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="h-11 w-full border border-line bg-ink-2 px-3 outline-none focus:border-copper"
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full bg-copper text-ink hover:bg-copper-2 disabled:opacity-60"
      >
        {pending
          ? "Working…"
          : mode === "signup"
            ? "Create account"
            : "Enter the graph"}
      </button>
      <p className="text-center text-sm text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-paper hover:text-copper-2">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="text-paper hover:text-copper-2">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
