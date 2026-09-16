import { useState } from "react";
import { Wrench, Plus } from "lucide-react";
import { SectionHeader } from "@/components/autovault/page-header";
import { Row, RowGroup } from "@/components/autovault/row";
import { BottomSheet } from "@/components/autovault/bottom-sheet";
import { FormField, TextInput, ChipGroup } from "@/components/autovault/form";
import { SegmentedControl } from "@/components/autovault/segmented-control";
import { PrimaryButton, SecondaryButton } from "@/components/autovault/buttons";
import { garageStore } from "@/lib/store";
import {
  computeChecklistStatus,
  CHECKLIST_PRESETS,
  AIR_PRESSURE_KM_OPTIONS,
  AIR_PRESSURE_DAY_OPTIONS,
} from "@/lib/analytics";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import type { ChecklistItem, Vehicle } from "@/types/autovault";

export function ChecklistSection({
  vehicle,
  checklist,
}: {
  vehicle: Vehicle;
  checklist: ChecklistItem[];
}) {
  const { system } = useUnitPrefs();
  const [serviceSheet, setServiceSheet] = useState<ChecklistItem | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [date, setDate] = useState("");
  const [odometer, setOdometer] = useState("");

  const kmOptions = AIR_PRESSURE_KM_OPTIONS[vehicle.kind];
  const [intervalPreset, setIntervalPreset] = useState<(typeof CHECKLIST_PRESETS)[number] | null>(
    null,
  );
  const [intervalMode, setIntervalMode] = useState<"km" | "days">("km");
  const [intervalKm, setIntervalKm] = useState<number | "custom">(kmOptions[0]!);
  const [intervalDays, setIntervalDays] = useState<number | "custom">(AIR_PRESSURE_DAY_OPTIONS[0]!);
  const [customKm, setCustomKm] = useState("");
  const [customDays, setCustomDays] = useState("");

  const items = checklist.filter((c) => c.vehicleId === vehicle.id);
  const usedKinds = new Set(items.map((c) => c.kind));
  const available = CHECKLIST_PRESETS.filter((p) => !usedKinds.has(p.kind));

  const openService = (item: ChecklistItem) => {
    setServiceSheet(item);
    setDate(item.lastServicedDate ?? new Date().toISOString().slice(0, 10));
    setOdometer(item.lastServicedOdometer?.toString() ?? vehicle.odometer.toString());
  };

  const saveService = () => {
    if (!serviceSheet) return;
    garageStore.updateChecklistItem(serviceSheet.id, {
      ...(date && { lastServicedDate: date }),
      ...(odometer && { lastServicedOdometer: Number(odometer) }),
    });
    setServiceSheet(null);
  };

  const addPreset = (preset: (typeof CHECKLIST_PRESETS)[number]) => {
    if (preset.customInterval) {
      setIntervalPreset(preset);
      setAddSheetOpen(false);
      return;
    }
    garageStore.addChecklistItem({
      id: crypto.randomUUID(),
      vehicleId: vehicle.id,
      kind: preset.kind,
      label: preset.label,
      ...(preset.intervalKm !== undefined && { intervalKm: preset.intervalKm }),
      ...(preset.intervalMonths !== undefined && { intervalMonths: preset.intervalMonths }),
    });
    setAddSheetOpen(false);
  };

  const saveCustomInterval = () => {
    if (!intervalPreset) return;
    const km = intervalKm === "custom" ? Number(customKm) : intervalKm;
    const days = intervalDays === "custom" ? Number(customDays) : intervalDays;
    if (intervalMode === "km" && !km) return;
    if (intervalMode === "days" && !days) return;

    garageStore.addChecklistItem({
      id: crypto.randomUUID(),
      vehicleId: vehicle.id,
      kind: intervalPreset.kind,
      label: intervalPreset.label,
      ...(intervalMode === "km" && { intervalKm: km }),
      ...(intervalMode === "days" && { intervalDays: days }),
    });
    setIntervalPreset(null);
    setCustomKm("");
    setCustomDays("");
  };

  return (
    <section className="mt-8">
      <SectionHeader
        title="Checklist"
        action={
          available.length > 0 && (
            <button
              type="button"
              onClick={() => setAddSheetOpen(true)}
              className="focus-ring flex items-center gap-1 rounded-[10px] px-2 py-1 text-[13px] font-medium text-primary"
            >
              <Plus className="size-4" strokeWidth={2} />
              Add
            </button>
          )
        }
      />
      {items.length === 0 ? (
        <div className="surface-tinted rounded-[18px] px-5 py-6 text-center">
          <p className="text-[13px] text-muted-foreground">
            Track tyres, brakes, fluids and battery with their own service intervals.
          </p>
          <div className="mt-4">
            <SecondaryButton onClick={() => setAddSheetOpen(true)}>Add item</SecondaryButton>
          </div>
        </div>
      ) : (
        <RowGroup>
          {items.map((item) => {
            const { status, detail } = computeChecklistStatus(item, vehicle, system);
            return (
              <Row
                key={item.id}
                icon={Wrench}
                title={item.label}
                detail={detail}
                status={status}
                onClick={() => openService(item)}
              />
            );
          })}
        </RowGroup>
      )}

      <BottomSheet
        open={!!serviceSheet}
        onClose={() => setServiceSheet(null)}
        title={serviceSheet?.label ?? ""}
        description="Log when this was last serviced to track when it's next due."
      >
        <FormField label="Date">
          <TextInput type="date" value={date} onChange={setDate} />
        </FormField>
        <FormField label="Odometer">
          <TextInput
            numeric
            value={odometer}
            onChange={setOdometer}
            suffix={system === "metric" ? "km" : "mi"}
          />
        </FormField>
        <div className="mt-5 flex gap-3">
          {serviceSheet && (
            <SecondaryButton
              onClick={() => {
                garageStore.deleteChecklistItem(serviceSheet.id);
                setServiceSheet(null);
              }}
            >
              Remove
            </SecondaryButton>
          )}
          <PrimaryButton onClick={saveService}>Save</PrimaryButton>
        </div>
      </BottomSheet>

      <BottomSheet
        open={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        title="Add checklist item"
        description="Pick a common item to start tracking."
      >
        <div className="flex flex-col gap-2 py-1">
          {available.map((preset) => (
            <button
              key={preset.kind}
              type="button"
              onClick={() => addPreset(preset)}
              className="focus-ring surface-tinted flex min-h-11 items-center justify-between rounded-[12px] px-4 py-2.5 text-left text-[14.5px] font-medium"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={!!intervalPreset}
        onClose={() => setIntervalPreset(null)}
        title={intervalPreset?.label ?? ""}
        description="How often should this be checked?"
      >
        <SegmentedControl
          className="mb-4"
          size="sm"
          value={intervalMode}
          onChange={setIntervalMode}
          options={[
            { value: "km", label: "By distance" },
            { value: "days", label: "By days" },
          ]}
        />
        {intervalMode === "km" ? (
          <>
            <ChipGroup
              options={[...kmOptions.map(String), "Custom"]}
              selected={[intervalKm === "custom" ? "Custom" : String(intervalKm)]}
              onToggle={(option) => setIntervalKm(option === "Custom" ? "custom" : Number(option))}
            />
            {intervalKm === "custom" && (
              <div className="mt-3">
                <FormField label="Every">
                  <TextInput
                    numeric
                    value={customKm}
                    onChange={setCustomKm}
                    suffix={system === "metric" ? "km" : "mi"}
                  />
                </FormField>
              </div>
            )}
          </>
        ) : (
          <>
            <ChipGroup
              options={[...AIR_PRESSURE_DAY_OPTIONS.map(String), "Custom"]}
              selected={[intervalDays === "custom" ? "Custom" : String(intervalDays)]}
              onToggle={(option) =>
                setIntervalDays(option === "Custom" ? "custom" : Number(option))
              }
            />
            {intervalDays === "custom" && (
              <div className="mt-3">
                <FormField label="Every">
                  <TextInput numeric value={customDays} onChange={setCustomDays} suffix="days" />
                </FormField>
              </div>
            )}
          </>
        )}
        <PrimaryButton className="mt-5" onClick={saveCustomInterval}>
          Add
        </PrimaryButton>
      </BottomSheet>
    </section>
  );
}
