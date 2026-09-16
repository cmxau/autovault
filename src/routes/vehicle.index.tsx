import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/autovault/page-header";
import { EmptyState } from "@/components/autovault/empty-state";
import { PrimaryButton } from "@/components/autovault/buttons";
import { useGarage } from "@/hooks/use-garage";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { formatDistance } from "@/lib/units";
import { garageStore } from "@/lib/store";
import type { Vehicle } from "@/types/autovault";

export const Route = createFileRoute("/vehicle/")({
  head: () => ({
    meta: [
      { title: "Manage Vehicles · AutoVault" },
      { name: "description", content: "Add, edit or remove vehicles in your garage." },
    ],
  }),
  component: ManageVehiclesPage,
});

function moveVehicle(vehicles: Vehicle[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= vehicles.length) return;
  const next = [...vehicles];
  [next[index], next[target]] = [next[target]!, next[index]!];
  garageStore.setVehicles(next);
}

function ManageVehiclesPage() {
  const { vehicles } = useGarage();
  const { system } = useUnitPrefs();

  return (
    <div>
      <PageHeader
        back={{ to: "/settings", label: "Settings" }}
        title="Manage Vehicles"
        action={
          <Link
            to="/vehicle/new"
            className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[14px] font-medium text-primary"
          >
            <Plus className="size-4" strokeWidth={2.2} />
            Add
          </Link>
        }
      />

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles yet."
          description="Add your first vehicle to your garage."
          action={
            <Link to="/vehicle/new" className="block">
              <PrimaryButton>Add Vehicle</PrimaryButton>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {vehicles.map((vehicle, i) => (
            <div
              key={vehicle.id}
              className="surface-tinted flex items-center gap-2 rounded-[18px] pl-4 pr-2 py-3.5"
            >
              <Link
                to="/vehicle/$vehicleId"
                params={{ vehicleId: vehicle.id }}
                className="focus-ring flex min-w-0 flex-1 items-center gap-3.5 rounded-[12px] transition-colors hover:opacity-80"
              >
                <img
                  src={vehicle.image}
                  alt=""
                  className="size-12 shrink-0 rounded-[12px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium tracking-[-0.005em]">
                    {vehicle.nickname}
                  </p>
                  <p className="tnum mt-0.5 text-[13px] text-muted-foreground">
                    {vehicle.year} {vehicle.make} {vehicle.model} ·{" "}
                    {formatDistance(vehicle.odometer, system)}
                  </p>
                </div>
              </Link>
              {vehicles.length > 1 && (
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    aria-label={`Move ${vehicle.nickname} up`}
                    disabled={i === 0}
                    onClick={() => moveVehicle(vehicles, i, -1)}
                    className="focus-ring grid size-8 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${vehicle.nickname} down`}
                    disabled={i === vehicles.length - 1}
                    onClick={() => moveVehicle(vehicles, i, 1)}
                    className="focus-ring grid size-8 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-foreground/[0.06] disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 px-1 text-[12px] leading-relaxed text-muted-foreground">
        Tap a vehicle to view it, edit its details, or remove it. Use the arrows to reorder how
        vehicles appear on the Garage tab.
      </p>
    </div>
  );
}
