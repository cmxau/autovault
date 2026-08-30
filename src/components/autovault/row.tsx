import { Link, type LinkProps } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronRight, Lock } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { usePress } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { StatusDot, statusTone } from "./status-indicator";
import type { Status } from "@/types/autovault";

export function Row({
  icon: Icon,
  title,
  detail,
  trailing,
  to,
  params,
  onClick,
  status,
  locked,
  className,
}: {
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: ReactNode;
  detail?: ReactNode;
  trailing?: ReactNode;
  to?: LinkProps["to"];
  params?: Record<string, string>;
  onClick?: () => void;
  status?: Status;
  locked?: boolean;
  className?: string;
}) {
  const press = usePress(0.99);
  const interactive = Boolean(to || onClick);

  const body = (
    <>
      {Icon && (
        <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-foreground/[0.05] text-foreground/70">
          <Icon className="size-[17px]" strokeWidth={1.6} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {status && <StatusDot status={status} />}
          <span className="truncate text-[15px] font-medium tracking-[-0.005em]">{title}</span>
        </span>
        {detail && (
          <span
            className={cn(
              "mt-0.5 flex items-center gap-1.5 truncate text-[13px]",
              status && status !== "ok" ? statusTone(status) : "text-muted-foreground",
            )}
          >
            {locked && <Lock className="size-3 shrink-0" strokeWidth={1.8} />}
            {detail}
          </span>
        )}
      </span>
      {trailing && (
        <span className="tnum shrink-0 text-[13.5px] text-muted-foreground">{trailing}</span>
      )}
      {interactive && (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" strokeWidth={2} />
      )}
    </>
  );

  const shared = cn(
    "flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left",
    interactive && "transition-colors hover:bg-foreground/[0.03]",
    className,
  );

  if (to) {
    return (
      <motion.div {...press}>
        <Link to={to} params={params as never} className={cn(shared, "focus-ring")}>
          {body}
        </Link>
      </motion.div>
    );
  }

  if (onClick) {
    return (
      <motion.button {...press} onClick={onClick} className={cn(shared, "focus-ring")}>
        {body}
      </motion.button>
    );
  }

  return <div className={shared}>{body}</div>;
}

export function RowGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("surface-tinted hairline-y overflow-hidden rounded-[18px]", className)}>
      {children}
    </div>
  );
}
