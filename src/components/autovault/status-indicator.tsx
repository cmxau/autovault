import type { Status } from "@/types/autovault";
import { cn } from "@/lib/utils";

const tone: Record<Status, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  urgent: "bg-urgent",
  unknown: "bg-muted-foreground/50",
};

export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-[7px] shrink-0 rounded-full", tone[status], className)}
    />
  );
}
