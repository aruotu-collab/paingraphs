"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { isAdminEmail } from "@/lib/admin";
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
