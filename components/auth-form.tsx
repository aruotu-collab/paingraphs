"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { existingAccountFor, requestMagicLink } from "@/lib/auth/actions";
import { authClient } from "@/lib/auth-client";

function withSignupLenses(next: string, form: FormData) {
  const url = new URL(next, "https://paingraphs.local");
  if (form.get("lens-affiliate") === "1") url.searchParams.set("affiliate", "1");
  if (form.get("lens-founder") === "1") url.searchParams.set("founder", "1");
  return `${url.pathname}${url.search}`;
}

function SignupLenses() {
  return (
    <fieldset className="space-y-2 text-sm">
      <legend className="text-muted">How would you like to use PainGraphs?</legend>
      <p className="text-xs text-muted">
        Consumer access is always included. You can add more later on the same
        account.
      </p>
      <label className="flex items-start gap-2">
        <input type="checkbox" name="lens-solve" value="1" defaultChecked disabled />
        <span>Solve and save pains</span>
      </label>
      <label className="flex items-start gap-2">
        <input type="checkbox" name="lens-affiliate" value="1" />
        <span>Find affiliate opportunities</span>
      </label>
      <label className="flex items-start gap-2">
        <input type="checkbox" name="lens-founder" value="1" />
        <span>Find products worth building</span>
      </label>
    </fieldset>
  );
}

export function AuthForm({
  mode,
  next = "/home",
}: {
  mode: "login" | "signup";
  next?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const name = String(form.get("name") || email.split("@")[0] || "there");
    const callbackURL = withSignupLenses(next, form);
    const result = await requestMagicLink({
      mode,
      email,
      name,
      callbackURL,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStatus(`Check ${email}. Click the link and you will come back signed in.`);
  }

  async function onPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    if (mode === "login" && !(await existingAccountFor(email))) {
      setPending(false);
      setError("no-account");
      return;
    }
    const result =
      mode === "signup"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      setError(result.error.message || "Something went wrong.");
      return;
    }
    router.push(withSignupLenses(next, form));
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8">
      <form onSubmit={sendMagicLink} className="space-y-5">
        {mode === "signup" ? (
          <label className="block space-y-2 text-sm">
            <span className="text-muted">Name</span>
            <input
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
        {mode === "signup" ? <SignupLenses /> : null}
        {error ? (
          <p className="text-sm text-red-400">
            {error === "no-account" ? (
              <>
                No PainGraphs account for this email.{" "}
                <Link
                  href={`/signup?next=${encodeURIComponent(next)}`}
                  className="underline hover:text-copper-2"
                >
                  Get started
                </Link>{" "}
                first.
              </>
            ) : (
              error
            )}
          </p>
        ) : null}
        {status ? <p className="text-sm text-signal">{status}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="h-11 w-full bg-copper text-ink hover:bg-copper-2 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>
      <form onSubmit={onPassword} className="space-y-5 border-t border-line pt-8">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Or use a password</p>
        {mode === "signup" ? (
          <label className="block space-y-2 text-sm">
            <span className="text-muted">Name</span>
            <input
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
        {mode === "signup" ? <SignupLenses /> : null}
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
        <button
          type="submit"
          disabled={pending}
          className="h-11 w-full border border-line px-4 text-paper hover:border-copper hover:text-copper disabled:opacity-60"
        >
          {pending
            ? "Working…"
            : mode === "signup"
              ? "Create account with password"
              : "Enter with password"}
        </button>
        <p className="text-center text-sm text-muted">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-paper hover:text-copper-2">
                Log in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-paper hover:text-copper-2">
                Create an account
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
