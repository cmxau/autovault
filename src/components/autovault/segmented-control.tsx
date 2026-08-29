import { motion } from "motion/react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "glass inline-flex w-full items-center gap-0.5 rounded-full p-[3px]",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "focus-ring relative flex-1 whitespace-nowrap rounded-full px-3 text-center font-medium transition-colors",
              size === "sm" ? "h-8 text-[12.5px]" : "h-9 text-[13.5px]",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((o) => o.value).join("-")}`}
                transition={spring}
                className="absolute inset-0 rounded-full bg-card shadow-[0_1px_3px_-1px_var(--hairline)] ring-1 ring-inset ring-hairline"
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
