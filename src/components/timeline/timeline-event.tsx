import { motion, useReducedMotion } from "motion/react";
import { Fuel, Wrench, FileText, Receipt, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistance, formatMoney, formatVolume } from "@/lib/units";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import type { TimelineEntry, TimelineKind } from "@/types/autovault";

const meta: Record<TimelineKind, { icon: typeof Fuel; tint: string }> = {
  fuel: { icon: Fuel, tint: "text-primary bg-primary/10" },
  service: { icon: Wrench, tint: "text-warn bg-warn/12" },
  document: { icon: FileText, tint: "text-ok bg-ok/12" },
  expense: { icon: Receipt, tint: "text-foreground/70 bg-foreground/[0.06]" },
  odometer: { icon: Gauge, tint: "text-foreground/70 bg-foreground/[0.06]" },
};

export function TimelineEventRow({
  entry,
  index,
  last,
}: {
  entry: TimelineEntry;
  index: number;
  last?: boolean;
}) {
  const reduce = useReducedMotion();
  const { system, currency } = useUnitPrefs();
  const { icon: Icon, tint } = meta[entry.kind];
  const date = new Date(entry.date);
  const day = date.toLocaleDateString("en-GB", { day: "2-digit" });
  const month = date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();

  const facts = [
    entry.odometer ? formatDistance(entry.odometer, system) : null,
    entry.litres ? formatVolume(entry.litres, system) : null,
    entry.amount ? formatMoney(entry.amount, currency) : null,
  ].filter(Boolean) as string[];

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: Math.min(index * 0.035, 0.28),
        duration: 0.26,
        ease: [0.32, 0.72, 0, 1],
      }}
      className={cn("relative flex gap-4", last ? "pb-1" : "pb-6")}
    >
      {!last && (
        <span
          aria-hidden
          className="absolute bottom-0 left-[52px] top-9 w-px bg-gradient-to-b from-hairline to-transparent"
        />
      )}

      <div className="w-[34px] shrink-0 pt-0.5 text-right">
        <p className="tnum text-[15px] font-semibold leading-none tracking-[-0.01em]">{day}</p>
        <p className="mt-1 text-[10px] font-medium tracking-[0.06em] text-muted-foreground">
          {month}
        </p>
      </div>

      <span
        className={cn("z-10 grid size-9 shrink-0 place-items-center rounded-full", tint)}
        aria-hidden
      >
        <Icon className="size-[17px]" strokeWidth={1.7} />
      </span>

      <div className="min-w-0 flex-1 pt-1">
        <h3 className="text-[15.5px] font-medium tracking-[-0.005em]">{entry.title}</h3>
        {facts.length > 0 && (
          <p className="tnum mt-1 text-[13px] text-muted-foreground">{facts.join("  ·  ")}</p>
        )}
        {entry.note && (
          <p className="mt-0.5 text-[12.5px] text-muted-foreground/80">{entry.note}</p>
        )}
      </div>
    </motion.article>
  );
}
