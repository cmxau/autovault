import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { ChipGroup, FormField, FormGroup, TextInput } from "@/components/autovault/form";
import { PrimaryButton } from "@/components/autovault/buttons";
import { Row, RowGroup } from "@/components/autovault/row";
import { useGarage } from "@/hooks/use-garage";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { currencySymbol, displayToKm, distanceUnitLabel, formatDistance } from "@/lib/units";
import { garageStore } from "@/lib/store";

export const Route = createFileRoute("/add/service")({
  head: () => ({
    meta: [
      { title: "Add Service · AutoVault" },
      {
        name: "description",
        content:
          "Record a service visit: work performed, service centre, cost, invoice and the next service due.",
      },
      { property: "og:title", content: "Add Service · AutoVault" },
      { property: "og:description", content: "Keep an accurate service history for your vehicle." },
    ],
  }),
  component: AddServicePage,
});

const work = [
  "Engine oil",
  "Oil filter",
  "Air filter",
  "Brake pads",
  "Wheel alignment",
  "Tyres",
  "Battery",
  "Other",
];

function AddServicePage() {
  const { vehicle } = useGarage();
  const { system, currency } = useUnitPrefs();
  const distanceLabel = distanceUnitLabel(system);
  const money = currencySymbol(currency);
  const navigate = useNavigate();
  const [performed, setPerformed] = useState<string[]>(["Engine oil", "Oil filter"]);
  const [form, setForm] = useState({
    date: "2026-08-05",
    odometer: String(vehicle?.odometer ?? 0),
    centre: "",
    type: "Periodic service",
    cost: "",
    notes: "",
    nextDate: "",
    nextOdometer: String(vehicle?.nextServiceKm ?? 0),
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [invoice, setInvoice] = useState<File | null>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-[520px]">
        <PageHeader
          back={{ to: "/maintenance", label: "Maintenance" }}
          title="Add Service"
          className="mb-6"
        />
        <NoVehicleEmptyState description="Add a vehicle before logging a service." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[520px]">
      <PageHeader
        back={{ to: "/maintenance", label: "Maintenance" }}
        eyebrow={vehicle.nickname}
        title="Add Service"
        className="mb-6"
      />

      <FormGroup>
        <FormField label="Date">
          <TextInput value={form.date} onChange={set("date")} type="date" />
        </FormField>
        <FormField
          label="Odometer"
          hint={`Last recorded ${formatDistance(vehicle.odometer, system)}`}
        >
          <TextInput
            value={form.odometer}
            onChange={set("odometer")}
            numeric
            suffix={distanceLabel}
          />
        </FormField>
        <FormField label="Centre">
          <TextInput value={form.centre} onChange={set("centre")} placeholder="Honda Solitaire" />
        </FormField>
        <FormField label="Type">
          <TextInput value={form.type} onChange={set("type")} />
        </FormField>
        <FormField label="Total cost">
          <TextInput
            value={form.cost}
            onChange={set("cost")}
            numeric
            suffix={money}
            placeholder="3200"
          />
        </FormField>
        <FormField label="Notes">
          <TextInput value={form.notes} onChange={set("notes")} placeholder="-" />
        </FormField>
      </FormGroup>

      <div className="mt-7">
        <SectionHeader title="Maintenance performed" />
        <ChipGroup
          options={work}
          selected={performed}
          onToggle={(option) =>
            setPerformed((prev) =>
              prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option],
            )
          }
        />
      </div>

      <div className="mt-7">
        <SectionHeader title="Invoice" />
        <RowGroup>
          <Row
            icon={Paperclip}
            title="Attach invoice"
            detail={invoice ? invoice.name : "Saved to your glovebox"}
            onClick={() => invoiceInputRef.current?.click()}
          />
        </RowGroup>
        <input
          ref={invoiceInputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => setInvoice(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="mt-7">
        <SectionHeader title="Next service" />
        <FormGroup>
          <FormField label="Due date">
            <TextInput value={form.nextDate} onChange={set("nextDate")} type="date" />
          </FormField>
          <FormField label="Due at" hint="Whichever comes first">
            <TextInput
              value={form.nextOdometer}
              onChange={set("nextOdometer")}
              numeric
              suffix={distanceLabel}
            />
          </FormField>
        </FormGroup>
      </div>

      <div className="mt-8">
        <PrimaryButton
          onClick={() => {
            const odometerKm = Math.round(displayToKm(Number(form.odometer), system));
            const nextOdometerKm = Math.round(displayToKm(Number(form.nextOdometer), system));
            if (!odometerKm || performed.length === 0) {
              toast.error("Enter an odometer reading and pick at least one work item");
              return;
            }

            garageStore.addTimelineEntry({
              id: crypto.randomUUID(),
              vehicleId: vehicle.id,
              kind: "service",
              title: form.type || "Service",
              date: form.date,
              odometer: odometerKm,
              ...(Number(form.cost) > 0 && { amount: Number(form.cost) }),
              note: [performed.join(", "), form.centre, form.notes].filter(Boolean).join(" · "),
            });
            garageStore.updateVehicle(vehicle.id, {
              odometer: Math.max(vehicle.odometer, odometerKm),
              ...(nextOdometerKm > 0 && { nextServiceKm: nextOdometerKm }),
              ...(form.nextDate && { nextServiceDate: form.nextDate }),
            });

            if (invoice) {
              garageStore.addDoc({
                id: crypto.randomUUID(),
                vehicleId: vehicle.id,
                category: "Service Invoices",
                title: `${form.type || "Service"} · ${form.centre || vehicle.nickname}`,
                issuer: form.centre || vehicle.nickname,
                number: "",
                issued: form.date,
                hasFile: true,
              });
            }

            toast.success("Service record saved", {
              description: invoice
                ? `${performed.length} items recorded, invoice saved to Glovebox.`
                : `${performed.length} items recorded at ${formatDistance(odometerKm, system)}.`,
            });
            void navigate({ to: "/timeline" });
          }}
        >
          Save Service Record
        </PrimaryButton>
      </div>
    </div>
  );
}
