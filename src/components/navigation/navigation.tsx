import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Car, ClipboardList, Plus, ChartNoAxesColumn, Settings, KeyRound } from "lucide-react";
import { spring, usePress } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const primaryDestinations = [
  { to: "/", label: "Garage", icon: Car },
  { to: "/timeline", label: "Timeline", icon: ClipboardList },
  { to: "/insights", label: "Insights", icon: ChartNoAxesColumn },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function useActivePath() {
  return useRouterState({ select: (s) => s.location.pathname });
}

export function BottomNavigation({ onAdd }: { onAdd: () => void }) {
  const pathname = useActivePath();
  const press = usePress(0.9);

  const left = primaryDestinations.slice(0, 2);
  const right = primaryDestinations.slice(2);

  const item = (dest: { to: string; label: string; icon: typeof Car }) => {
    const active = dest.to === "/" ? pathname === "/" : pathname.startsWith(dest.to);
    return (
      <Link
        key={dest.to}
        to={dest.to}
        aria-label={dest.label}
        aria-current={active ? "page" : undefined}
        className="focus-ring relative flex min-h-11 min-w-[56px] flex-col items-center justify-center gap-1 rounded-[14px] px-1 py-1"
      >
        {active && (
          <motion.span
            layoutId="bottom-nav-active"
            transition={spring}
            className="absolute inset-0 rounded-[14px] bg-primary/10"
          />
        )}
        <dest.icon
          className={cn(
            "relative size-[21px] transition-colors",
            active ? "text-primary" : "text-muted-foreground",
          )}
          strokeWidth={active ? 2 : 1.6}
        />
        <span
          className={cn(
            "relative text-[10.5px] font-medium tracking-[0.01em] transition-colors",
            active ? "text-primary" : "text-muted-foreground",
          )}
        >
          {dest.label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="glass-strong inner-highlight flex items-center gap-1 rounded-full px-2 py-1.5">
        {left.map(item)}
        <motion.button
          {...press}
          onClick={onAdd}
          aria-label="Add entry"
          className="focus-ring mx-1 grid size-[46px] place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--primary)_75%,transparent)]"
        >
          <Plus className="size-[22px]" strokeWidth={2.4} />
        </motion.button>
        {right.map(item)}
      </div>
    </nav>
  );
}

export function SidebarNavigation({ onAdd }: { onAdd: () => void }) {
  const pathname = useActivePath();
  const press = usePress(0.98);

  const link = (dest: { to: string; label: string; icon: typeof Car }) => {
    const active = dest.to === "/" ? pathname === "/" : pathname.startsWith(dest.to);
    return (
      <Link
        key={dest.to}
        to={dest.to}
        aria-current={active ? "page" : undefined}
        className={cn(
          "focus-ring relative flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-[14.5px] transition-colors",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {active && (
          <motion.span
            layoutId="sidebar-nav-active"
            transition={spring}
            className="absolute inset-0 rounded-[12px] bg-foreground/[0.06]"
          />
        )}
        <dest.icon
          className={cn("relative size-[18px]", active && "text-primary")}
          strokeWidth={1.7}
        />
        <span className="relative font-medium">{dest.label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[248px] p-4 md:block">
      <div className="glass inner-highlight flex h-full flex-col rounded-[25px] p-3">
        <div className="flex items-center gap-2.5 px-2 pb-4 pt-3">
          <span className="grid size-8 place-items-center rounded-[10px] bg-primary/12 text-primary">
            <KeyRound className="size-[18px]" strokeWidth={1.9} />
          </span>
          <span className="text-[15.5px] font-semibold tracking-[-0.015em]">AutoVault</span>
        </div>

        <nav aria-label="Primary" className="flex flex-col gap-0.5">
          {primaryDestinations.map(link)}
        </nav>

        <div className="mt-auto pt-3">
          <motion.button
            {...press}
            onClick={onAdd}
            className="focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-primary text-[14.5px] font-semibold text-primary-foreground"
          >
            <Plus className="size-[18px]" strokeWidth={2.3} />
            Add Entry
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
