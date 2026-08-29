import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";

export function ErrorPage({
  code,
  icon: Icon,
  title,
  description,
}: {
  code: string | number;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
      <span className="glass grid size-16 place-items-center rounded-[20px] text-muted-foreground">
        <Icon className="size-7" strokeWidth={1.4} />
      </span>
      <p className="tnum mt-6 text-[13px] font-semibold tracking-[0.08em] text-muted-foreground">
        ERROR {code}
      </p>
      <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="mx-auto mt-2 max-w-[38ch] text-[14px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      <Link
        to="/"
        className="focus-ring mt-7 inline-flex min-h-[48px] w-full max-w-[220px] items-center justify-center rounded-[14px] bg-primary px-5 text-[15.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/92"
      >
        Go to Garage
      </Link>
    </div>
  );
}
