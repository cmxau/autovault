import { cn } from "@/lib/utils";

export function Metric({
  value,
  label,
  align = "left",
  size = "md",
  tone,
  className,
}: {
  value: string;
  label: string;
  align?: "left" | "center";
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "default" | "primary";
  className?: string;
}) {
  const sizes = {
    sm: "text-[17px]",
    md: "text-[22px]",
    lg: "text-[28px]",
    xl: "text-[44px] leading-[1.05]",
  }[size];

  return (
    <div className={cn(align === "center" && "text-center", className)}>
      <p
        className={cn(
          "tnum font-semibold tracking-[-0.02em]",
          sizes,
          tone === "primary" ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[12px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: "primary" | "ok" | "warn" | "urgent";
  className?: string;
}) {
  const fill = {
    primary: "bg-primary",
    ok: "bg-ok",
    warn: "bg-warn",
    urgent: "bg-urgent",
  }[tone];

  return (
    <div
      className={cn("h-[6px] w-full overflow-hidden rounded-full bg-foreground/[0.08]", className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", fill)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
