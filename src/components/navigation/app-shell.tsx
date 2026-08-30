import { useState, type ReactNode } from "react";
import { BottomNavigation, SidebarNavigation } from "./navigation";
import { AddSheet } from "./add-sheet";

export function AppShell({ children }: { children: ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full">
      {/* ambient tint: single, restrained */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[42vh]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--primary) 7%, transparent), transparent)",
        }}
      />
      <SidebarNavigation onAdd={() => setAddOpen(true)} />
      <BottomNavigation onAdd={() => setAddOpen(true)} />
      <main className="relative mx-auto w-full max-w-[720px] px-5 pb-[124px] pt-8 md:max-w-[860px] md:pb-16 md:pl-[268px] md:pr-6 lg:max-w-[1080px]">
        {children}
      </main>
      <AddSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
