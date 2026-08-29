import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "./switch";

export function FormGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("surface-tinted hairline-y overflow-hidden rounded-[18px]", className)}>
      {children}
    </div>
  );
}

export function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string | undefined;
}) {
  return (
    <label className="flex min-h-[54px] items-center gap-4 px-4 py-2.5">
      <span className="w-[104px] shrink-0 text-[14.5px] text-muted-foreground">{label}</span>
      <span className="flex min-w-0 flex-1 flex-col items-end">
        {children}
        {hint && <span className="tnum mt-0.5 text-[12px] text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  numeric,
  suffix,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "password";
  numeric?: boolean;
  suffix?: string;
}) {
  return (
    <span className="flex w-full items-center justify-end gap-1.5">
      <input
        value={value}
        type={type}
        inputMode={numeric ? "decimal" : undefined}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "focus-ring w-full rounded-[10px] bg-transparent px-1 py-2 text-right text-[15.5px] font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground/70",
          numeric && "tnum",
        )}
      />
      {suffix && <span className="shrink-0 text-[14px] text-muted-foreground">{suffix}</span>}
    </span>
  );
}

export function ToggleRow({
  label,
  detail,
  checked,
  onChange,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-[54px] items-center justify-between gap-4 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-[15px] font-medium">{label}</span>
        {detail && <span className="block text-[12.5px] text-muted-foreground">{detail}</span>}
      </span>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

export function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option)}
            className={cn(
              "focus-ring min-h-11 rounded-[12px] border px-3.5 text-[14px] transition-colors",
              active
                ? "border-primary/40 bg-primary/10 font-medium text-primary"
                : "border-hairline bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
