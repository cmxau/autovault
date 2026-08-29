import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "focus-ring relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-primary" : "bg-foreground/15",
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] size-6 rounded-full bg-white shadow-sm transition-all duration-200 ease-out",
          checked ? "left-[23px]" : "left-[3px]",
        )}
      />
    </button>
  );
}
