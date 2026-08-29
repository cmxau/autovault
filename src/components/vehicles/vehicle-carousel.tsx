import { useRef } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { VehicleCard } from "./vehicle-card";
import { useGarage } from "@/hooks/use-garage";
import { useTimeline } from "@/hooks/use-garage-data";
import { computeMileage } from "@/lib/analytics";
import { usePress } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function VehicleCarousel() {
  const { vehicles, vehicleId, setVehicleId } = useGarage();
  const timeline = useTimeline();
  const scroller = useRef<HTMLDivElement>(null);
  const press = usePress(0.96);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    const next = vehicles[Math.min(vehicles.length - 1, Math.max(0, index))];
    if (next && next.id !== vehicleId) setVehicleId(next.id);
  };

  return (
    <section aria-label="Vehicles">
      <div
        ref={scroller}
        onScroll={onScroll}
        className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:gap-5 [&::-webkit-scrollbar]:hidden"
      >
        {vehicles.map((vehicle, i) => (
          <div key={vehicle.id} className="w-full shrink-0 snap-center sm:w-auto">
            <VehicleCard
              vehicle={vehicle}
              avgMileage={computeMileage(timeline, vehicle.id).avg}
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:hidden" aria-hidden>
          {vehicles.map((v) => (
            <span
              key={v.id}
              className={cn(
                "h-[6px] rounded-full transition-all duration-300",
                v.id === vehicleId ? "w-[18px] bg-primary" : "w-[6px] bg-foreground/15",
              )}
            />
          ))}
        </div>
        <motion.div {...press} className="ml-auto">
          <Link
            to="/vehicle/new"
            className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[14px] font-medium text-primary"
          >
            <Plus className="size-4" strokeWidth={2.2} />
            Add Vehicle
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
