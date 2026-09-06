"use client";

import Link from "next/link";
import { setWorkspaceMode } from "@/lib/identity/actions";
import type { WorkspaceMode } from "@/lib/identity/constants";

const MODES = [
  { id: "solve" as const, label: "Solve" },
  { id: "promote" as const, label: "Promote" },
  { id: "build" as const, label: "Build" },
];

export function ModeSwitcher({
  current,
  owner = false,
}: {
  current: WorkspaceMode;
  owner?: boolean;
}) {
  return (
    <nav className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em]">
      {MODES.map((mode) => (
        <Link
          key={mode.id}
          href={`/home?mode=${mode.id}`}
          onClick={() => {
            void setWorkspaceMode(mode.id);
          }}
          className={
            current === mode.id
              ? "border border-copper px-3 py-1.5 text-copper"
              : "border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
          }
        >
          {mode.label}
        </Link>
      ))}
      <Link
        href="/home/alerts"
        className="border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
      >
        Alerts
      </Link>
      {current === "promote" ? (
        <Link
          href="/home/vault"
          className="border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
        >
          Link vault
        </Link>
      ) : null}
      {owner ? (
        <>
          <Link
            href="/marketing-agent"
            className="border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
          >
            Marketing Agent
          </Link>
          <Link
            href="/admin"
            className="border border-line px-3 py-1.5 text-muted hover:border-copper hover:text-copper"
          >
            Admin
          </Link>
        </>
      ) : null}
    </nav>
  );
}
