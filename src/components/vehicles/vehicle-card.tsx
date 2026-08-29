import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Gauge, Droplets } from "lucide-react";
import { maskReg } from "@/lib/format";
import { formatDistance, formatMileage } from "@/lib/units";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { spring, usePress } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/types/autovault";

export function VehicleCard({
  vehicle,
  avgMileage,
  className,
  priority,
}: {
  vehicle: Vehicle;
  avgMileage: number;
  className?: string;
  priority?: boolean;
}) {
  const press = usePress(0.985);
  const { system } = useUnitPrefs();

  return (
    <motion.div {...press} transition={spring} className={cn("w-full", className)}>
      <Link
        to="/vehicle/$vehicleId"
        params={{ vehicleId: vehicle.id }}
        className="focus-ring group block overflow-hidden rounded-[25px] border border-hairline shadow-[0_22px_50px_-26px_oklch(0.24_0.03_258/38%)]"
        style={{
          background: `linear-gradient(168deg, hsl(${vehicle.tint} / 0.16), color-mix(in oklab, var(--card) 92%, transparent) 58%)`,
        }}
      >
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
              background: `linear-gradient(to top, color-mix(in oklab, var(--card) 88%, transparent), transparent 62%), radial-gradient(120% 80% at 12% 0%, hsl(${vehicle.tint} / 0.22), transparent 60%)`,
            }}
          />
          <div className="glass absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-foreground/80">
            {vehicle.year} · {vehicle.fuel}
          </div>
        </div>

        <div className="px-5 pb-5 pt-1">
          <h3 className="text-[21px] font-semibold tracking-[-0.02em]">{vehicle.nickname}</h3>
          <p className="tnum mt-0.5 text-[13px] tracking-[0.06em] text-muted-foreground">
            {maskReg(vehicle.registration)}
          </p>

          <div className="mt-4 flex items-center gap-6 border-t border-hairline pt-4">
            <div className="flex items-center gap-2.5">
              <Gauge className="size-[17px] text-muted-foreground" strokeWidth={1.6} />
              <div>
                <p className="tnum text-[17px] font-semibold leading-none tracking-[-0.015em]">
                  {formatDistance(vehicle.odometer, system)}
                </p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">Odometer</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Droplets className="size-[17px] text-muted-foreground" strokeWidth={1.6} />
              <div>
                <p className="tnum text-[17px] font-semibold leading-none tracking-[-0.015em]">
                  {formatMileage(avgMileage, system)}
                </p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">Average</p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
