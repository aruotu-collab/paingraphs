import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { getSession } from "@/lib/session";

export async function AccountStatus() {
  const session = await getSession();

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
