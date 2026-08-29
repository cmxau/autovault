import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { FormField, FormGroup, TextInput, ToggleRow } from "@/components/autovault/form";
import { PrimaryButton } from "@/components/autovault/buttons";
import { SegmentedControl } from "@/components/autovault/segmented-control";
import { useGarage } from "@/hooks/use-garage";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import {
  currencySymbol,
  displayToKm,
  displayToLitres,
  distanceUnitLabel,
  formatDistance,
  formatMileage,
  volumeUnitLabel,
} from "@/lib/units";
import { garageStore } from "@/lib/store";

export const Route = createFileRoute("/add/fuel")({
  head: () => ({
    meta: [
      { title: "Add Fuel — AutoVault" },
      {
        name: "description",
        content:
          "Log a fill-up in seconds: litres, amount and odometer. AutoVault works out the per-litre price and mileage.",
      },
      { property: "og:title", content: "Add Fuel — AutoVault" },
      {
        property: "og:description",
        content: "Quick fuel entry with automatic mileage calculation.",
      },
    ],
  }),
  component: AddFuelPage,
});

function AddFuelPage() {
  const { vehicles, vehicle, setVehicleId } = useGarage();
  const { system, currency } = useUnitPrefs();
  const navigate = useNavigate();
  const distanceLabel = distanceUnitLabel(system);
  const volumeLabel = volumeUnitLabel(system);
  const money = currencySymbol(currency);

  const [date, setDate] = useState("2026-08-05");
  const [odometer, setOdometer] = useState(String((vehicle?.odometer ?? 0) + 320));
  const [quantity, setQuantity] = useState("8.6");
  const [price, setPrice] = useState("");
  const [total, setTotal] = useState("920");
  const [fullTank, setFullTank] = useState(true);
  const [station, setStation] = useState("");
  const [notes, setNotes] = useState("");

  const derived = useMemo(() => {
    const q = Number(quantity);
    const t = Number(total);
    const p = Number(price);
    if (q > 0 && t > 0) return { unit: t / q, total: t };
    if (q > 0 && p > 0) return { unit: p, total: q * p };
    return null;
  }, [quantity, total, price]);

  const estimatedMileage = useMemo(() => {
    if (!vehicle) return null;
    const qLitres = displayToLitres(Number(quantity), system);
    const oKm = displayToKm(Number(odometer), system);
    if (!fullTank || !qLitres || oKm <= vehicle.odometer) return null;
    return (oKm - vehicle.odometer) / qLitres;
  }, [quantity, odometer, fullTank, vehicle, system]);

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-[520px]">
        <PageHeader back={{ to: "/", label: "Garage" }} title="Add Fuel" className="mb-5" />
        <NoVehicleEmptyState description="Add a vehicle before logging fuel." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[520px]">
      <PageHeader back={{ to: "/", label: "Garage" }} title="Add Fuel" className="mb-5" />

      <SegmentedControl
        className="mb-7"
        size="sm"
        value={vehicle.id}
        onChange={setVehicleId}
        options={vehicles.map((v) => ({ value: v.id, label: v.nickname }))}
      />

      <FormGroup>
        <FormField label="Date">
          <TextInput value={date} onChange={setDate} type="date" />
        </FormField>
        <FormField
          label="Odometer"
          hint={`Last recorded ${formatDistance(vehicle.odometer, system)}`}
        >
          <TextInput value={odometer} onChange={setOdometer} numeric suffix={distanceLabel} />
        </FormField>
        <FormField label="Quantity">
          <TextInput value={quantity} onChange={setQuantity} numeric suffix={volumeLabel} />
        </FormField>
        <FormField
          label="Price"
          hint={
            derived ? `${money}${derived.unit.toFixed(2)}/${volumeLabel} calculated` : undefined
          }
        >
          <TextInput
            value={price}
            onChange={setPrice}
            numeric
            suffix={`${money}/${volumeLabel}`}
            placeholder="—"
          />
        </FormField>
        <FormField label="Total">
          <TextInput value={total} onChange={setTotal} numeric suffix={money} />
        </FormField>
        <ToggleRow
          label="Full tank"
          detail="Needed for mileage calculation"
          checked={fullTank}
          onChange={setFullTank}
        />
      </FormGroup>

      <div className="mt-7">
        <SectionHeader title="Optional" />
        <FormGroup>
          <FormField label="Station">
            <TextInput value={station} onChange={setStation} placeholder="HP, Baner" />
          </FormField>
          <FormField label="Notes">
            <TextInput value={notes} onChange={setNotes} placeholder="—" />
          </FormField>
        </FormGroup>
      </div>

      <div className="mt-8">
        <PrimaryButton
          onClick={() => {
            const odometerKm = displayToKm(Number(odometer), system);
            const quantityLitres = displayToLitres(Number(quantity), system);
            if (!derived || !odometerKm || !quantityLitres) {
              toast.error("Enter quantity, price or total, and odometer");
              return;
            }

            garageStore.addTimelineEntry({
              id: crypto.randomUUID(),
              vehicleId: vehicle.id,
              kind: "fuel",
              title: "Fuel",
              date,
              odometer: Math.round(odometerKm),
              litres: quantityLitres,
              amount: derived.total,
              ...((station || notes) && { note: [station, notes].filter(Boolean).join(" — ") }),
            });
            garageStore.updateVehicle(vehicle.id, {
              odometer: Math.max(vehicle.odometer, Math.round(odometerKm)),
            });

            toast.success("Fuel entry saved", {
              description: estimatedMileage
                ? `Calculated mileage: ${formatMileage(estimatedMileage, system)}`
                : "Add another full-tank entry to calculate mileage.",
            });
            void navigate({ to: "/timeline" });
          }}
        >
          Save Fuel Entry
        </PrimaryButton>
      </div>
    </div>
  );
}
