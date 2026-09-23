import type { ReactNode } from "react";

export function ConsumerShell({ children }: { children: ReactNode }) {
  return (
    <main className="consumer-shell flex-1 bg-[#eef3ea] text-[#16301c]">
      <div className="mx-auto w-full max-w-6xl px-5 py-12">{children}</div>
    </main>
  );
}
