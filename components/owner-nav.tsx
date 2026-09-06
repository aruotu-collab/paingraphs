import Link from "next/link";
import { getOwnerCapabilities } from "@/lib/session";

export async function OwnerNav() {
  const capabilities = await getOwnerCapabilities();
  if (!capabilities?.admin && !capabilities?.marketingAgent) return null;

  return (
    <div className="hidden items-center gap-3 text-sm md:flex">
      {capabilities.admin ? (
        <Link href="/admin" className="text-muted hover:text-paper">
          Admin
        </Link>
      ) : null}
      {capabilities.marketingAgent ? (
        <Link href="/marketing-agent" className="text-muted hover:text-paper">
          Marketing Agent
        </Link>
      ) : null}
    </div>
  );
}
