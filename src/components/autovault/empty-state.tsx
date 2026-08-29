import type { ComponentType, ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <Icon className="mx-auto size-7 text-muted-foreground/60" strokeWidth={1.25} />
      <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[34ch] text-[13.5px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mx-auto mt-6 max-w-[240px]">{action}</div>}
    </div>
  );
}
