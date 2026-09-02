"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { isAdminEmail } from "@/lib/admin";
import { SignOutButton } from "@/components/sign-out-button";

function helloName(email?: string | null, name?: string | null) {
  const fromName = name?.includes("@") ? "" : name?.trim();
  const fromEmail = email?.split("@")[0]?.trim() ?? "";
  const raw = fromName && fromName.toLowerCase() !== "there" ? fromName : fromEmail;
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

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
    const greeting = helloName(session.user.email, session.user.name);
    return (
      <div className="flex items-center gap-3 text-sm">
        {greeting ? (
          <span className="whitespace-nowrap text-paper">Hello {greeting}</span>
        ) : null}
        {isAdminEmail(session.user.email) ? (
          <>
            <Link href="/admin" className="text-muted hover:text-paper">
              Admin
            </Link>
            <Link href="/workspace/lab" className="text-muted hover:text-paper">
              Lab
            </Link>
          </>
        ) : null}
        <Link href="/workspace" className="text-muted hover:text-paper">
          Workspace
        </Link>
        <SignOutButton />
      </div>
    );
  }

  return (
    <Link href="/login" className="text-sm text-muted hover:text-paper">
      Sign in
    </Link>
  );
}
