"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { SignOutButton } from "@/components/sign-out-button";

export function AuthStatus() {
  const { data: session, isPending } = authClient.useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || isPending) {
    return <div className="h-8 w-24 bg-ink-2" aria-hidden="true" />;
  }

  if (session) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="hidden text-muted sm:inline">{session.user.email}</span>
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/login" className="text-muted hover:text-paper">
        Log in
      </Link>
      <Link
        href="/signup"
        className="border border-copper px-3 py-1.5 text-copper hover:bg-copper hover:text-ink"
      >
        Create account
      </Link>
    </div>
  );
}
