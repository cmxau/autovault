import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { appIcons } from "@/lib/icons";
import { maskReg } from "@/lib/format";
import { formatDistance, formatEfficiency, primaryFuelUnit } from "@/lib/units";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { spring, usePress } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types/autovault";

function Fact({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-primary/12 text-primary">
        <Icon className="size-[18px]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="tnum truncate text-[16px] font-semibold leading-none tracking-[-0.015em]">
          {value}
        </p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function VehicleCard({
  vehicle,
  avgMileage,
  className,
  priority,
  link = true,
}: {
  vehicle: Vehicle;
  avgMileage: number;
  className?: string;
  priority?: boolean;
  /** Set to false on the vehicle's own page: no link, and the detail layout instead of the garage one. */
  link?: boolean;
}) {
  const press = usePress(0.985);
  const { system } = useUnitPrefs();

  const shellClass =
    "focus-ring group block overflow-hidden rounded-[25px] border border-hairline shadow-[0_22px_50px_-26px_oklch(0.24_0.03_258/38%)]";
  const shellStyle = {
    background: `linear-gradient(180deg, color-mix(in oklab, var(--primary) 16%, transparent), color-mix(in oklab, var(--card) 92%, transparent) 58%)`,
  };

  const content = (
    <>
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <img
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.nickname}`}
          width={1280}
          height={800}
          loading={priority ? "eager" : "lazy"}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(to top, color-mix(in oklab, var(--card) 88%, transparent), transparent 62%), radial-gradient(90% 80% at 12% 0%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%), radial-gradient(90% 80% at 88% 0%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%)`,
          }}
        />
        {link && (
          <div className="glass absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-foreground/80">
            {vehicle.year} · {vehicle.fuel}
          </div>
        )}
      </div>

      {link ? (
        <div className="px-5 pb-5 pt-1">
          <h3 className="text-[21px] font-semibold tracking-[-0.02em]">{vehicle.nickname}</h3>
          <p className="tnum mt-0.5 text-[13px] tracking-[0.06em] text-muted-foreground">
            {maskReg(vehicle.registration)}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-hairline pt-4">
            <Fact
              icon={appIcons.odometer}
              value={formatDistance(vehicle.odometer, system)}
              label="Odometer"
            />
            <Fact
              icon={appIcons.mileage}
              value={formatEfficiency(avgMileage, primaryFuelUnit(vehicle.fuel), system)}
              label="Average"
            />
          </div>
        </div>
      ) : (
        <div className="px-5 pb-5 pt-4">
          <p className="tnum text-[13px] tracking-[0.06em] text-muted-foreground">
            {maskReg(vehicle.registration)}
          </p>
          <p className="mt-0.5 text-[15px] font-medium tracking-[-0.005em]">
            {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.variant}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-hairline pt-4">
            <Fact
              icon={appIcons.odometer}
              value={formatDistance(vehicle.odometer, system)}
              label="Odometer"
            />
            <Fact
              icon={appIcons.mileage}
              value={formatEfficiency(avgMileage, primaryFuelUnit(vehicle.fuel), system)}
              label="Average"
            />
          </div>
        </div>
      )}
    </>
  );

  if (!link) {
    return (
      <div className={cn("w-full", className)}>
        <div className={shellClass} style={shellStyle}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <motion.div {...press} transition={spring} className={cn("w-full", className)}>
      <Link
        to="/vehicle/$vehicleId"
        params={{ vehicleId: vehicle.id }}
        className={shellClass}
        style={shellStyle}
      >
        {content}
      </Link>
    </motion.div>
  );
}
