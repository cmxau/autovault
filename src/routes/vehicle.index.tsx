import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Plus } from "lucide-react";
import { PageHeader } from "@/components/autovault/page-header";
import { EmptyState } from "@/components/autovault/empty-state";
import { PrimaryButton } from "@/components/autovault/buttons";
import { useGarage } from "@/hooks/use-garage";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { formatDistance } from "@/lib/units";

export const Route = createFileRoute("/vehicle/")({
  head: () => ({
    meta: [
      { title: "Manage Vehicles · AutoVault" },
      { name: "description", content: "Add, edit or remove vehicles in your garage." },
    ],
  }),
  component: ManageVehiclesPage,
});

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
          {vehicles.map((vehicle) => (
            <Link
              key={vehicle.id}
              to="/vehicle/$vehicleId"
              params={{ vehicleId: vehicle.id }}
              className="focus-ring surface-tinted flex items-center gap-3.5 rounded-[18px] px-4 py-3.5 transition-colors hover:bg-foreground/[0.03]"
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
          ))}
        </div>
      )}

      <p className="mt-6 px-1 text-[12px] leading-relaxed text-muted-foreground">
        Tap a vehicle to view it, edit its details, or remove it.
      </p>
    </div>
  );
}
