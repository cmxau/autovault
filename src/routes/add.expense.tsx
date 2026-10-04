import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Package, Paperclip, ParkingCircle, Ticket, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { FormField, FormGroup, TextInput } from "@/components/autovault/form";
import { PrimaryButton, SecondaryButton } from "@/components/autovault/buttons";
import { Row, RowGroup } from "@/components/autovault/row";
import { useGarage } from "@/hooks/use-garage";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import {
  currencySymbol,
  displayToKm,
  distanceUnitLabel,
  formatDistance,
  kmToDisplay,
} from "@/lib/units";
import { todayISO } from "@/lib/format";
import { garageStore } from "@/lib/store";
import { useChecklist, useTimeline } from "@/hooks/use-garage-data";
import { checklistItemsServiced } from "@/lib/analytics";
import { composeExpenseNote, expenseCategoryConfig, parseExpenseNote } from "@/lib/expense-fields";
import { appIcons } from "@/lib/icons";
import { FieldRows } from "@/components/autovault/field-rows";
import { TilePicker } from "@/components/autovault/tile-picker";
import { WorkPicker } from "@/components/autovault/work-picker";
import { cleanWorkName, workLabels } from "@/lib/service-work";

export const Route = createFileRoute("/add/expense")({
  validateSearch: (search: Record<string, unknown>): { edit?: string; category?: "Service" } => ({
    ...(typeof search["edit"] === "string" && { edit: search["edit"] }),
    ...(search["category"] === "Service" && { category: "Service" as const }),
  }),
  head: () => ({
    meta: [
      { title: "Add Expense · AutoVault" },
      {
        name: "description",
        content: "Record services, tolls, parking, repairs, accessories and other vehicle costs.",
      },
      { property: "og:title", content: "Add Expense · AutoVault" },
      { property: "og:description", content: "Track what your vehicle actually costs to run." },
    ],
  }),
  component: AddExpensePage,
});

// Alphabetical, with "Other" last. No Fuel: it has its own page. "Service" is an expense category that also captures the work done and the next service due.
const categories: { label: string; icon: LucideIcon }[] = [
  { label: "Accessories", icon: Package },
  { label: "Insurance", icon: appIcons.insurance },
  { label: "Parking", icon: ParkingCircle },
  { label: "PUC", icon: appIcons.emissions },
  { label: "Repairs", icon: appIcons.repair },
  { label: "Service", icon: appIcons.service },
  { label: "Tolls", icon: Ticket },
  { label: "Other", icon: appIcons.other },
];

function AddExpensePage() {
  const { vehicle } = useGarage();
  const { system } = useUnitPrefs();
  const distanceLabel = distanceUnitLabel(system);
  // Amounts are always entered and stored in INR; the display-currency picker
  // in Settings only converts for viewing, it doesn't change what you type here.
  const money = currencySymbol("INR");
  const navigate = useNavigate();
  const { edit: editId, category: presetCategory } = Route.useSearch();
  const timeline = useTimeline();
  const checklist = useChecklist();
  const editEntry = editId ? timeline.find((e) => e.id === editId) : undefined;
  const editingService = editEntry?.kind === "service";
  const [category, setCategory] = useState(
    editingService ? "Service" : (editEntry?.title ?? presetCategory ?? categories[0]!.label),
  );
  const isService = category === "Service";
  const [date, setDate] = useState(editEntry?.date ?? todayISO());
  const [amount, setAmount] = useState(
    editEntry?.amount !== undefined ? String(editEntry.amount) : "",
  );

  // Service records keep "work · centre · notes" in a single note string.
  const [notePerformed, noteCentre, noteNotes] = editingService
    ? (editEntry?.note?.split(" · ") ?? [])
    : [];
  const performedParts = notePerformed?.split(", ") ?? [];
  const [performed, setPerformed] = useState<string[]>(() =>
    notePerformed
      ? performedParts.filter((p) => workLabels.includes(p))
      : ["Engine oil", "Oil filter"],
  );
  // Work items the user typed in themselves; any number can be added.
  const [customWork, setCustomWork] = useState<string[]>(() =>
    performedParts.filter((p) => p && !workLabels.includes(p)),
  );
  const [customDraft, setCustomDraft] = useState("");
  const vehicleChecklist = checklist.filter((c) => c.vehicleId === vehicle?.id);
  const trackedWork = new Set(
    workLabels.filter((w) => checklistItemsServiced([w], vehicleChecklist, date).length > 0),
  );
  // Plain expenses keep their category fields in the note as "Label: value" parts.
  const parsedNote =
    editEntry && !editingService ? parseExpenseNote(category, editEntry.note) : null;
  const [notes, setNotes] = useState(
    editingService ? (noteNotes ?? "") : (parsedNote?.notes ?? ""),
  );
  const [fields, setFields] = useState<Record<string, string>>(parsedNote?.values ?? {});
  const setField = (key: string, value: string) => setFields((prev) => ({ ...prev, [key]: value }));
  const [expenseOdometer, setExpenseOdometer] = useState(
    !editingService && editEntry?.odometer !== undefined
      ? String(kmToDisplay(editEntry.odometer, system))
      : "",
  );
  const config = expenseCategoryConfig[category];
  const [serviceForm, setServiceForm] = useState({
    odometer:
      editEntry?.odometer !== undefined ? String(kmToDisplay(editEntry.odometer, system)) : "",
    centre: noteCentre ?? "",
    type: editingService ? (editEntry?.title ?? "") : "Periodic service",
    nextDate: "",
    nextOdometer: "",
  });
  const setService = (key: keyof typeof serviceForm) => (value: string) =>
    setServiceForm((prev) => ({ ...prev, [key]: value }));

  const [invoice, setInvoice] = useState<File | null>(null);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-[520px]">
        <PageHeader
          back={{ to: "/insights", label: "Insights" }}
          title="Add Expense"
          className="mb-6"
        />
        <NoVehicleEmptyState description="Add a vehicle before logging an expense." />
      </div>
    );
  }

  // Untouched odometer fields fall back to the vehicle's own values. The vehicle can be
  // missing on the first render of a direct page load, so this can't live in useState.
  const toDisplay = (km: number) => String(Math.round(kmToDisplay(km, system)));
  const odometerValue = serviceForm.odometer || toDisplay(vehicle.odometer);
  const nextOdometerValue = serviceForm.nextOdometer || toDisplay(vehicle.nextServiceKm);

  const saveService = () => {
    const odometerKm = Math.round(displayToKm(Number(odometerValue), system));
    const nextOdometerKm = Math.round(displayToKm(Number(nextOdometerValue), system));
    const pendingItem = cleanWorkName(customDraft);
    const performedFinal = [
      ...performed,
      ...customWork,
      ...(pendingItem && !customWork.includes(pendingItem) ? [pendingItem] : []),
    ];
    if (!odometerKm || performedFinal.length === 0) {
      toast.error("Enter an odometer reading and pick at least one work item");
      return;
    }

    const payload = {
      vehicleId: vehicle.id,
      kind: "service" as const,
      title: serviceForm.type || "Service",
      date,
      odometer: odometerKm,
      ...(Number(amount) > 0 && { amount: Number(amount) }),
      note: [performedFinal.join(", "), serviceForm.centre, notes].filter(Boolean).join(" · "),
    };

    // Servicing something on the checklist resets its "last serviced" date and odometer.
    const serviced = checklistItemsServiced(
      performedFinal,
      checklist.filter((c) => c.vehicleId === vehicle.id),
      date,
    );
    for (const item of serviced) {
      garageStore.updateChecklistItem(item.id, {
        lastServicedDate: date,
        lastServicedOdometer: odometerKm,
      });
    }
    const checklistNote =
      serviced.length > 0
        ? ` ${serviced.length} checklist item${serviced.length > 1 ? "s" : ""} updated.`
        : "";

    if (editEntry) {
      garageStore.updateTimelineEntry(editEntry.id, payload);
      toast.success("Service record updated", {
        ...(checklistNote && { description: checklistNote.trim() }),
      });
      void navigate({ to: "/timeline" });
      return;
    }

    garageStore.addTimelineEntry({ id: crypto.randomUUID(), ...payload });
    garageStore.updateVehicle(vehicle.id, {
      odometer: Math.max(vehicle.odometer, odometerKm),
      ...(nextOdometerKm > 0 && { nextServiceKm: nextOdometerKm }),
      ...(serviceForm.nextDate && { nextServiceDate: serviceForm.nextDate }),
    });

    if (invoice) {
      garageStore.addDoc({
        id: crypto.randomUUID(),
        vehicleId: vehicle.id,
        category: "Service Invoices",
        title: `${serviceForm.type || "Service"} · ${serviceForm.centre || vehicle.nickname}`,
        issuer: serviceForm.centre || vehicle.nickname,
        number: "",
        issued: date,
        hasFile: true,
      });
    }

    toast.success("Service record saved", {
      description: invoice
        ? `${performedFinal.length} items recorded, invoice saved to Glovebox.${checklistNote}`
        : `${performedFinal.length} items recorded at ${formatDistance(odometerKm, system)}.${checklistNote}`,
    });
    void navigate({ to: "/timeline" });
  };

  const saveExpense = () => {
    const amountNum = Number(amount);
    if (!amountNum) {
      toast.error("Enter an amount");
      return;
    }

    const odometerKm = config?.odometer
      ? Math.round(displayToKm(Number(expenseOdometer), system))
      : 0;
    const note = composeExpenseNote(category, fields, notes);

    const payload = {
      vehicleId: vehicle.id,
      kind: "expense" as const,
      title: category,
      date,
      amount: amountNum,
      ...(odometerKm > 0 && { odometer: odometerKm }),
      ...(note && { note }),
    };

    if (editEntry) {
      garageStore.updateTimelineEntry(editEntry.id, payload);
      toast.success("Expense updated");
    } else {
      garageStore.addTimelineEntry({ id: crypto.randomUUID(), ...payload });
      if (odometerKm > vehicle.odometer)
        garageStore.updateVehicle(vehicle.id, { odometer: odometerKm });
      toast.success("Expense saved", { description: `${category} recorded.` });
    }
    void navigate({ to: "/insights" });
  };

  return (
    <div className="mx-auto max-w-[520px]">
      <PageHeader
        back={{ to: "/insights", label: "Insights" }}
        eyebrow={vehicle.nickname}
        title={
          editEntry ? (editingService ? "Edit Service Record" : "Edit Expense") : "Add Expense"
        }
        className="mb-6"
      />

      {/* A saved service and a saved expense are different record kinds, so the category is fixed when editing. */}
      {!editEntry && (
        <>
          <SectionHeader title="Category" />
          <TilePicker
            label="Category"
            value={category}
            onChange={setCategory}
            options={categories}
          />
        </>
      )}

      <div className={editEntry ? undefined : "mt-7"}>
        <FormGroup>
          <FormField label="Date">
            <TextInput value={date} onChange={setDate} type="date" />
          </FormField>
          {isService && (
            <>
              <FormField
                label="Odometer"
                hint={`Last recorded ${formatDistance(vehicle.odometer, system)}`}
              >
                <TextInput
                  value={odometerValue}
                  onChange={setService("odometer")}
                  numeric
                  suffix={distanceLabel}
                />
              </FormField>
              <FormField label="Centre">
                <TextInput
                  value={serviceForm.centre}
                  onChange={setService("centre")}
                  placeholder="Honda Solitaire"
                />
              </FormField>
              <FormField label="Type">
                <TextInput value={serviceForm.type} onChange={setService("type")} />
              </FormField>
            </>
          )}
          {!isService && config && (
            <FieldRows fields={config.fields} values={fields} onChange={setField} />
          )}
          {!isService && config?.odometer && (
            <FormField
              label="Odometer"
              hint={`Optional · last recorded ${formatDistance(vehicle.odometer, system)}`}
            >
              <TextInput
                value={expenseOdometer}
                onChange={setExpenseOdometer}
                numeric
                suffix={distanceLabel}
              />
            </FormField>
          )}
          <FormField label={isService ? "Total cost" : (config?.amountLabel ?? "Amount")}>
            <TextInput
              value={amount}
              onChange={setAmount}
              numeric
              suffix={money}
              placeholder={isService ? "3200" : (config?.amountPlaceholder ?? "1500")}
            />
          </FormField>
          <FormField label="Notes">
            <TextInput
              value={notes}
              onChange={setNotes}
              placeholder={isService ? "-" : (config?.notesPlaceholder ?? "-")}
            />
          </FormField>
        </FormGroup>
      </div>

      {isService && (
        <>
          <div className="mt-7">
            <WorkPicker
              selected={performed}
              onSelectedChange={setPerformed}
              custom={customWork}
              onCustomChange={setCustomWork}
              draft={customDraft}
              onDraftChange={setCustomDraft}
              tracked={trackedWork}
            />
          </div>

          {!editEntry && (
            <>
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
                    <TextInput
                      value={serviceForm.nextDate}
                      onChange={setService("nextDate")}
                      type="date"
                    />
                  </FormField>
                  <FormField label="Due at" hint="Whichever comes first">
                    <TextInput
                      value={nextOdometerValue}
                      onChange={setService("nextOdometer")}
                      numeric
                      suffix={distanceLabel}
                    />
                  </FormField>
                </FormGroup>
              </div>
            </>
          )}
        </>
      )}

      <div className="mt-8">
        <PrimaryButton onClick={isService ? saveService : saveExpense}>
          {editEntry ? "Save Changes" : isService ? "Save Service Record" : "Save Expense"}
        </PrimaryButton>
        {editEntry && (
          <SecondaryButton
            className="mt-3"
            onClick={() => {
              garageStore.deleteTimelineEntry(editEntry.id);
              toast.success(editingService ? "Service record deleted" : "Expense deleted");
              void navigate({ to: editingService ? "/timeline" : "/insights" });
            }}
          >
            Delete Entry
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}
