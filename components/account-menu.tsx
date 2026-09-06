"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { authClient } from "@/lib/auth-client";

export function AccountMenu() {
  const { data: session, isPending } = authClient.useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || isPending) {
    return <div className="h-8 w-20 bg-ink-2" aria-hidden="true" />;
  }

  if (session) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/home" className="text-muted hover:text-paper">
          Home
        </Link>
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/login" className="text-muted hover:text-paper">
        Sign in
      </Link>
      <Link href="/signup" className="bg-copper px-3 py-1.5 text-ink hover:bg-copper-2">
        Get started
      </Link>
    </div>
  );
}
