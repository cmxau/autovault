import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Elevation = "flat" | "raised" | "floating";

const elevations: Record<Elevation, string> = {
  flat: "surface-tinted",
  raised: "glass inner-highlight",
  floating: "glass-strong inner-highlight",
};

export function GlassSurface({
  children,
  className,
  elevation = "raised",
  radius = "card",
  as: As = "div",
}: {
  children?: ReactNode;
  className?: string;
  elevation?: Elevation;
  radius?: "control" | "input" | "card" | "feature" | "full";
  as?: "div" | "section" | "aside" | "nav";
}) {
  const radii = {
    control: "rounded-[11px]",
    input: "rounded-[13px]",
    card: "rounded-[18px]",
    feature: "rounded-[25px]",
    full: "rounded-full",
  }[radius];

  return <As className={cn(elevations[elevation], radii, className)}>{children}</As>;
}

/** Content-heavy grouped list container: tinted, readable, not glassy. */
export function TintedCard({
  children,
  className,
  padded = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface-tinted overflow-hidden rounded-[18px] shadow-[0_1px_2px_-1px_var(--hairline)]",
        padded && "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
