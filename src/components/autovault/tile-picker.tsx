import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Single-select grid of icon tiles (expense categories, document types). */
export function TilePicker({
  options,
  value,
  onChange,
  label,
}: {
  options: { label: string; icon: LucideIcon }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
      {options.map(({ label: optionLabel, icon: Icon }) => {
        const active = value === optionLabel;
        return (
          <button
            key={optionLabel}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(optionLabel)}
            className={cn(
              "focus-ring flex min-h-[80px] flex-col items-center justify-center gap-2 rounded-[16px] border px-2 text-center text-[13px] leading-tight transition-colors",
              active
                ? "border-primary/40 bg-primary/10 font-medium text-primary"
                : "border-hairline bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-[22px]" strokeWidth={1.6} />
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}
