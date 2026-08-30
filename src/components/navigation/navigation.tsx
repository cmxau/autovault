import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Car, ClipboardList, Plus, ChartNoAxesColumn, Settings } from "lucide-react";
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
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom))]"
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
