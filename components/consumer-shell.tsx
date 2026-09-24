import type { ReactNode } from "react";

export function ConsumerShell({ children }: { children: ReactNode }) {
  return (
    <main className="consumer-shell min-w-0 max-w-full flex-1 overflow-x-clip bg-[#eef3ea] text-[#16301c]">
      <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-10 sm:px-5 sm:py-12">{children}</div>
    </main>
  );
}
