import type { ComponentType, ReactNode } from "react";
import { motion } from "motion/react";
import { usePress } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function PrimaryButton({
  children,
  onClick,
  className,
  type = "button",
  full = true,
  icon: Icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  full?: boolean;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  const press = usePress(0.97);
  return (
    <motion.button
      {...press}
      type={type}
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-primary px-5 text-[15.5px] font-semibold text-primary-foreground shadow-[0_6px_18px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition-colors hover:bg-primary/92",
        full && "w-full",
        className,
      )}
    >
      {Icon && <Icon className="size-[18px]" strokeWidth={2} />}
      {children}
    </motion.button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  className,
  full = true,
  icon: Icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  full?: boolean;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  const press = usePress(0.97);
  return (
    <motion.button
      {...press}
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] border border-hairline bg-card px-5 text-[15.5px] font-medium text-foreground transition-colors hover:bg-accent",
        full && "w-full",
        className,
      )}
    >
      {Icon && <Icon className="size-[18px]" strokeWidth={1.75} />}
      {children}
    </motion.button>
  );
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  className,
  tone = "glass",
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick?: () => void;
  className?: string;
  tone?: "glass" | "plain";
}) {
  const press = usePress(0.92);
  return (
    <motion.button
      {...press}
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "focus-ring grid size-11 place-items-center rounded-full text-foreground",
        tone === "glass" ? "glass" : "hover:bg-accent",
        className,
      )}
    >
      <Icon className="size-[19px]" strokeWidth={1.75} />
    </motion.button>
  );
}
