import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { FormField, FormGroup, TextInput, ToggleRow } from "@/components/autovault/form";
import { PrimaryButton, SecondaryButton } from "@/components/autovault/buttons";
import { SegmentedControl } from "@/components/autovault/segmented-control";
import { useGarage } from "@/hooks/use-garage";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import {
  currencySymbol,
  displayToFuelQuantity,
  displayToKm,
  distanceUnitLabel,
  formatDistance,
  formatEfficiency,
  fuelQuantityToDisplay,
  fuelUnitFor,
  fuelUnitLabel,
  kmToDisplay,
  type FuelUnit,
} from "@/lib/units";
import { garageStore } from "@/lib/store";
import { useTimeline } from "@/hooks/use-garage-data";

export const Route = createFileRoute("/add/fuel")({
  validateSearch: (search: Record<string, unknown>): { edit?: string } => ({
    ...(typeof search["edit"] === "string" && { edit: search["edit"] }),
  }),
  head: () => ({
    meta: [
      { title: "Add Fuel · AutoVault" },
      {
        name: "description",
        content:
          "Log a fill-up in seconds: litres, amount and odometer. AutoVault works out the per-litre price and mileage.",
      },
      { property: "og:title", content: "Add Fuel · AutoVault" },
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
  const { system } = useUnitPrefs();
  const navigate = useNavigate();
  const { edit: editId } = Route.useSearch();
  const timeline = useTimeline();
  const editEntry = editId ? timeline.find((e) => e.id === editId) : undefined;
  const distanceLabel = distanceUnitLabel(system);
  // Amounts are always entered and stored in INR; the display-currency picker
  // in Settings only converts for viewing, it doesn't change what you type here.
  const money = currencySymbol("INR");

  // A bi-fuel vehicle (e.g. "Petrol + CNG") can be filled with either fuel on
  // a given trip, so ask which one this fill-up was rather than assuming.
  const isBiFuel = vehicle?.fuel === "Petrol + CNG";
  const [fuelChoice, setFuelChoice] = useState<"Petrol" | "CNG">("Petrol");
  const unit: FuelUnit =
    editEntry?.fuelUnit ??
    (isBiFuel ? fuelUnitFor(fuelChoice) : fuelUnitFor(vehicle?.fuel ?? "Petrol"));
  const unitLabel = fuelUnitLabel(unit, system);

  const [date, setDate] = useState(editEntry?.date ?? "2026-08-05");
  const [odometer, setOdometer] = useState(
    editEntry?.odometer !== undefined
      ? String(kmToDisplay(editEntry.odometer, system))
      : String((vehicle?.odometer ?? 0) + 320),
  );
  const [quantity, setQuantity] = useState(
    editEntry?.litres !== undefined
      ? String(fuelQuantityToDisplay(editEntry.litres, unit, system))
      : "8.6",
  );
  const [price, setPrice] = useState("");
  const [total, setTotal] = useState(
    editEntry?.amount !== undefined ? String(editEntry.amount) : "920",
  );
  const [fullTank, setFullTank] = useState(true);
  const [station, setStation] = useState(editEntry?.note?.split(" · ")[0] ?? "");
  const [notes, setNotes] = useState(editEntry?.note?.split(" · ")[1] ?? "");

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
    const qty = displayToFuelQuantity(Number(quantity), unit, system);
    const oKm = displayToKm(Number(odometer), system);
    if (!fullTank || !qty || oKm <= vehicle.odometer) return null;
    return (oKm - vehicle.odometer) / qty;
  }, [quantity, odometer, fullTank, vehicle, system, unit]);

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
      <PageHeader
        back={{ to: "/", label: "Garage" }}
        title={editEntry ? "Edit Fuel Entry" : "Add Fuel"}
        className="mb-5"
      />

      <SegmentedControl
        className="mb-7"
        size="sm"
        value={vehicle.id}
        onChange={setVehicleId}
        options={vehicles.map((v) => ({ value: v.id, label: v.nickname }))}
      />

      {isBiFuel && (
        <div className="mb-5">
          <SegmentedControl
            size="sm"
            value={fuelChoice}
            onChange={setFuelChoice}
            options={[
              { value: "Petrol", label: "Petrol" },
              { value: "CNG", label: "CNG" },
            ]}
          />
        </div>
      )}

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
          <TextInput value={quantity} onChange={setQuantity} numeric suffix={unitLabel} />
        </FormField>
        <FormField
          label="Price"
          hint={derived ? `${money}${derived.unit.toFixed(2)}/${unitLabel} calculated` : undefined}
        >
          <TextInput
            value={price}
            onChange={setPrice}
            numeric
            suffix={`${money}/${unitLabel}`}
            placeholder="-"
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
            <TextInput value={notes} onChange={setNotes} placeholder="-" />
          </FormField>
        </FormGroup>
      </div>

      <div className="mt-8">
        <PrimaryButton
          onClick={() => {
            const odometerKm = displayToKm(Number(odometer), system);
            const storedQuantity = displayToFuelQuantity(Number(quantity), unit, system);
            if (!derived || !odometerKm || !storedQuantity) {
              toast.error("Enter quantity, price or total, and odometer");
              return;
            }

            const payload = {
              vehicleId: vehicle.id,
              kind: "fuel" as const,
              title: isBiFuel ? `Fuel (${fuelChoice})` : "Fuel",
              date,
              odometer: Math.round(odometerKm),
              litres: storedQuantity,
              fuelUnit: unit,
              amount: derived.total,
              ...((station || notes) && { note: [station, notes].filter(Boolean).join(" · ") }),
            };

            if (editEntry) {
              garageStore.updateTimelineEntry(editEntry.id, payload);
              toast.success("Fuel entry updated");
            } else {
              garageStore.addTimelineEntry({ id: crypto.randomUUID(), ...payload });
              garageStore.updateVehicle(vehicle.id, {
                odometer: Math.max(vehicle.odometer, Math.round(odometerKm)),
              });
              toast.success("Fuel entry saved", {
                description: estimatedMileage
                  ? `Calculated mileage: ${formatEfficiency(estimatedMileage, unit, system)}`
                  : "Add another full-tank entry to calculate mileage.",
              });
            }
            void navigate({ to: "/timeline" });
          }}
        >
          {editEntry ? "Save Changes" : "Save Fuel Entry"}
        </PrimaryButton>
        {editEntry && (
          <SecondaryButton
            className="mt-3"
            onClick={() => {
              garageStore.deleteTimelineEntry(editEntry.id);
              toast.success("Fuel entry deleted");
              void navigate({ to: "/timeline" });
            }}
          >
            Delete Entry
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}
