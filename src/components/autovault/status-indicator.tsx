import type { Status } from "@/types/autovault";
import { cn } from "@/lib/utils";

const tone: Record<Status, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  urgent: "bg-urgent",
  unknown: "bg-muted-foreground/50",
};

const text: Record<Status, string> = {
  ok: "text-ok",
  warn: "text-warn",
  urgent: "text-urgent",
  unknown: "text-muted-foreground",
};

export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-[7px] shrink-0 rounded-full", tone[status], className)}
    />
  );
}

export function StatusText({
  status,
  children,
  className,
}: {
  status: Status;
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("text-[13px]", text[status], className)}>{children}</span>;
}

export function statusTone(status: Status) {
  return text[status];
}
