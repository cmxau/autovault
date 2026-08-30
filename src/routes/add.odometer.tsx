import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/autovault/page-header";
import { FormField, FormGroup, TextInput } from "@/components/autovault/form";
import { PrimaryButton } from "@/components/autovault/buttons";
import { useGarage } from "@/hooks/use-garage";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { displayToKm, distanceUnitLabel, formatDistance } from "@/lib/units";
import { garageStore } from "@/lib/store";

export const Route = createFileRoute("/add/odometer")({
  head: () => ({
    meta: [
      { title: "Update Odometer · AutoVault" },
      {
        name: "description",
        content: "Keep your distance, mileage and service countdown accurate with a quick reading.",
      },
      { property: "og:title", content: "Update Odometer · AutoVault" },
      { property: "og:description", content: "Record the current odometer reading in seconds." },
    ],
  }),
  component: UpdateOdometerPage,
});

function UpdateOdometerPage() {
  const { vehicle } = useGarage();
  const { system } = useUnitPrefs();
  const distanceLabel = distanceUnitLabel(system);
  const navigate = useNavigate();
  const [date, setDate] = useState("2026-08-05");
  const [reading, setReading] = useState(String(vehicle?.odometer ?? 0));

  const readingKm = displayToKm(Number(reading), system);
  const delta = readingKm - (vehicle?.odometer ?? 0);

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-[520px]">
        <PageHeader back={{ to: "/", label: "Garage" }} title="Update Odometer" className="mb-6" />
        <NoVehicleEmptyState description="Add a vehicle before updating its odometer." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[520px]">
      <PageHeader
        back={{ to: "/", label: "Garage" }}
        eyebrow={vehicle.nickname}
        title="Update Odometer"
        className="mb-6"
      />

      <div className="surface-tinted mb-7 rounded-[25px] px-5 py-6">
        <p className="text-[13px] text-muted-foreground">Last recorded</p>
        <p className="tnum mt-1 text-[34px] font-semibold leading-none tracking-[-0.03em]">
          {formatDistance(vehicle.odometer, system)}
        </p>
        {delta > 0 && (
          <p className="tnum mt-2 text-[13px] text-primary">
            +{formatDistance(delta, system)} since then
          </p>
        )}
      </div>

      <FormGroup>
        <FormField label="Date">
          <TextInput value={date} onChange={setDate} type="date" />
        </FormField>
        <FormField label="Reading">
          <TextInput value={reading} onChange={setReading} numeric suffix={distanceLabel} />
        </FormField>
      </FormGroup>

      <div className="mt-8">
        <PrimaryButton
          onClick={() => {
            const readingNumKm = Math.round(readingKm);
            if (!readingNumKm || readingNumKm < vehicle.odometer) {
              toast.error(`Reading must be ${formatDistance(vehicle.odometer, system)} or more`);
              return;
            }

            garageStore.addTimelineEntry({
              id: crypto.randomUUID(),
              vehicleId: vehicle.id,
              kind: "odometer",
              title: "Odometer update",
              date,
              odometer: readingNumKm,
            });
            garageStore.updateVehicle(vehicle.id, { odometer: readingNumKm });

            toast.success("Odometer updated", {
              description: formatDistance(readingNumKm, system),
            });
            void navigate({ to: "/" });
          }}
        >
          Save Reading
        </PrimaryButton>
      </div>
    </div>
  );
}
