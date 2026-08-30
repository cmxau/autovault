import { useState, type ReactNode } from "react";
import { BottomNavigation } from "./navigation";
import { AddSheet } from "./add-sheet";

export function AppShell({ children }: { children: ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full bg-background sm:bg-muted/40">
      {/* ambient tint: single, restrained */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[42vh]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--primary) 7%, transparent), transparent)",
        }}
      />
      {/* Same layout at every width: a single centered mobile-width column. */}
      <div className="relative mx-auto min-h-screen w-full max-w-[520px] bg-background sm:shadow-[0_0_0_1px_var(--border),0_24px_60px_-24px_rgb(0_0_0/0.25)]">
        <BottomNavigation onAdd={() => setAddOpen(true)} />
        <main className="relative w-full px-5 pb-[124px] pt-8">{children}</main>
      </div>
      <AddSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
