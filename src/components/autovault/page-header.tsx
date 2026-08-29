import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  back,
  className,
}: {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  back?: { to: string; label: string };
  className?: string;
}) {
  return (
    <header className={cn("mb-6", className)}>
      {back && (
        <Link
          to={back.to}
          className="focus-ring -ml-1 mb-3 inline-flex min-h-11 items-center gap-1 rounded-[11px] pr-2 text-[15px] text-primary transition-opacity hover:opacity-70"
        >
          <ChevronLeft className="size-5" strokeWidth={1.75} />
          {back.label}
        </Link>
      )}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="text-[15px] font-normal text-muted-foreground">{eyebrow}</p>}
          <h1 className="mt-0.5 text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[32px]">
            {title}
          </h1>
          {subtitle && <div className="mt-1.5 text-[13px] text-muted-foreground">{subtitle}</div>}
        </div>
        {action && <div className="shrink-0 pb-1">{action}</div>}
      </div>
    </header>
  );
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2.5 flex items-end justify-between gap-4 px-0.5", className)}>
      <h2 className="text-[13px] font-medium tracking-[0.01em] text-muted-foreground">{title}</h2>
      {action}
    </div>
  );
}
