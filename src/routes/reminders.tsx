import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, PencilLine, Trash2 } from "lucide-react";
import { appIcons } from "@/lib/icons";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { StatusDot } from "@/components/autovault/status-indicator";
import { SecondaryButton } from "@/components/autovault/buttons";
import { PrimaryButton } from "@/components/autovault/buttons";
import { BottomSheet } from "@/components/autovault/bottom-sheet";
import { ChipGroup, FormField, FormGroup, TextInput } from "@/components/autovault/form";
import { useGarage } from "@/hooks/use-garage";
import { useDocs } from "@/hooks/use-garage-data";
import { useReminderLeads } from "@/hooks/use-reminder-leads";
import { useNotificationPrefs } from "@/hooks/use-notification-prefs";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { nextDue, useCustomReminders, type Repeat } from "@/hooks/use-custom-reminders";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { computeUpcoming } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { Status } from "@/types/autovault";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders · AutoVault" },
      {
        name: "description",
        content:
          "Date and odometer based reminders for service, insurance, PUC, warranty and custom maintenance.",
      },
      { property: "og:title", content: "Reminders · AutoVault" },
      {
        property: "og:description",
        content: "Never miss a renewal: reminders for service, insurance, PUC and more.",
      },
    ],
  }),
  component: RemindersPage,
});

const leadOptions = [30, 7, 1];
const repeatOptions = ["None", "Yearly", "Every N days"];

function describeRepeat(repeat: Repeat | undefined, now: Date) {
  const due = nextDue(repeat, now);
  if (!repeat || !due) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  const when = due.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const cadence = repeat.kind === "yearly" ? "Yearly" : `Every ${repeat.every} days`;
  const status: Status = days <= 7 ? "urgent" : days <= 30 ? "warn" : "ok";
  return { text: `${cadence} · next ${when}`, status };
}

function RemindersPage() {
  const { vehicle } = useGarage();
  const docs = useDocs();
  const { forId, toggle } = useReminderLeads();
  const {
    items: custom,
    add: addCustom,
    remove: removeCustom,
    update: updateCustom,
  } = useCustomReminders(vehicle?.id ?? "");
  const { serviceReminders, expiryReminders } = useNotificationPrefs();
  const { system } = useUnitPrefs();
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [repeatKind, setRepeatKind] = useState("None");
  const [repeatDate, setRepeatDate] = useState("");
  const [repeatEvery, setRepeatEvery] = useState("");

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Reminders" back={{ to: "/settings", label: "Settings" }} />
        <NoVehicleEmptyState />
      </div>
    );
  }

  const derived = computeUpcoming(vehicle, docs, system).filter((item) =>
    item.id === "service" ? serviceReminders : expiryReminders,
  );

  return (
    <div>
      <PageHeader
        eyebrow={vehicle.nickname}
        title="Reminders"
        back={{ to: "/settings", label: "Settings" }}
      />

      <div className="space-y-4">
        {derived.map((reminder) => {
          const selected = forId(reminder.id);
          return (
            <article key={reminder.id} className="surface-tinted rounded-[18px] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[15.5px] font-medium tracking-[-0.005em]">
                    <StatusDot status={reminder.status} />
                    {reminder.label}
                  </p>
                  <p className="tnum mt-1 text-[13px] text-muted-foreground">{reminder.detail}</p>
                </div>
                <appIcons.reminder
                  className="size-[18px] shrink-0 text-muted-foreground/70"
                  strokeWidth={1.75}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-hairline pt-4">
                {leadOptions.map((days) => {
                  const active = selected.includes(days);
                  return (
                    <button
                      key={days}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(reminder.id, days)}
                      className={cn(
                        "focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] transition-colors",
                        active
                          ? "border-primary/35 bg-primary/10 font-medium text-primary"
                          : "border-hairline text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {active && <Check className="size-3.5" strokeWidth={2.5} />}
                      {days} day{days > 1 ? "s" : ""} before
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}

        {custom.map((reminder) => {
          const selected = forId(reminder.id);
          const schedule = describeRepeat(reminder.repeat, new Date());
          return (
            <article key={reminder.id} className="surface-tinted rounded-[18px] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[15.5px] font-medium tracking-[-0.005em]">
                    <StatusDot status={schedule?.status ?? "unknown"} />
                    {reminder.label}
                  </p>
                  {schedule && (
                    <p className="tnum mt-1 text-[13px] text-muted-foreground">{schedule.text}</p>
                  )}
                  {reminder.detail && (
                    <p className="tnum mt-1 text-[13px] text-muted-foreground">{reminder.detail}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    aria-label="Edit reminder"
                    onClick={() => {
                      setEditingId(reminder.id);
                      setLabel(reminder.label);
                      setDetail(reminder.detail);
                      setRepeatKind(
                        reminder.repeat
                          ? reminder.repeat.kind === "yearly"
                            ? "Yearly"
                            : "Every N days"
                          : "None",
                      );
                      setRepeatDate(reminder.repeat?.date ?? "");
                      setRepeatEvery(
                        reminder.repeat?.kind === "days" ? String(reminder.repeat.every) : "",
                      );
                      setAddOpen(true);
                    }}
                    className="focus-ring text-muted-foreground/70 transition-colors hover:text-primary"
                  >
                    <PencilLine className="size-[18px]" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete reminder"
                    onClick={() => {
                      removeCustom(reminder.id);
                      toast.success("Reminder removed");
                    }}
                    className="focus-ring text-muted-foreground/70 transition-colors hover:text-urgent"
                  >
                    <Trash2 className="size-[18px]" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-hairline pt-4">
                {leadOptions.map((days) => {
                  const active = selected.includes(days);
                  return (
                    <button
                      key={days}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(reminder.id, days)}
                      className={cn(
                        "focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] transition-colors",
                        active
                          ? "border-primary/35 bg-primary/10 font-medium text-primary"
                          : "border-hairline text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {active && <Check className="size-3.5" strokeWidth={2.5} />}
                      {days} day{days > 1 ? "s" : ""} before
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-8">
        <SectionHeader title="Add" />
        <SecondaryButton
          onClick={() => {
            setEditingId(null);
            setLabel("");
            setDetail("");
            setRepeatKind("None");
            setRepeatDate("");
            setRepeatEvery("");
            setAddOpen(true);
          }}
        >
          New Reminder
        </SecondaryButton>
        <p className="mt-3 px-1 text-[12px] leading-relaxed text-muted-foreground">
          Service and document reminders above are generated from your records. Custom reminders are
          a note you can set to repeat yearly or every N days.
        </p>
      </section>

      <BottomSheet
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Reminder" : "New Reminder"}
        description="A custom, freeform reminder for this vehicle"
      >
        <div className="space-y-4">
          <FormGroup>
            <FormField label="Title">
              <TextInput value={label} onChange={setLabel} placeholder="Tyre pressure check" />
            </FormField>
            <FormField label="Note">
              <TextInput value={detail} onChange={setDetail} placeholder="Check all four tyres" />
            </FormField>
          </FormGroup>
          <ChipGroup options={repeatOptions} selected={[repeatKind]} onToggle={setRepeatKind} />
          {repeatKind !== "None" && (
            <FormGroup>
              <FormField label={repeatKind === "Yearly" ? "Due date" : "Starting"}>
                <TextInput type="date" value={repeatDate} onChange={setRepeatDate} />
              </FormField>
              {repeatKind === "Every N days" && (
                <FormField label="Repeat every">
                  <TextInput
                    numeric
                    value={repeatEvery}
                    onChange={setRepeatEvery}
                    placeholder="30"
                    suffix="days"
                  />
                </FormField>
              )}
            </FormGroup>
          )}
          <PrimaryButton
            onClick={() => {
              if (!label.trim()) {
                toast.error("Enter a title");
                return;
              }
              let repeat: Repeat | undefined;
              if (repeatKind !== "None") {
                const every = Math.floor(Number(repeatEvery));
                if (!repeatDate) {
                  toast.error("Pick a date");
                  return;
                }
                if (repeatKind === "Every N days") {
                  if (!(every >= 1)) {
                    toast.error("Enter a number of days");
                    return;
                  }
                  repeat = { kind: "days", date: repeatDate, every };
                } else {
                  repeat = { kind: "yearly", date: repeatDate };
                }
              }
              if (editingId) {
                updateCustom(editingId, label.trim(), detail.trim(), repeat);
                toast.success("Reminder updated");
              } else {
                addCustom(label.trim(), detail.trim(), repeat);
                toast.success("Reminder added");
              }
              setLabel("");
              setDetail("");
              setRepeatKind("None");
              setRepeatDate("");
              setRepeatEvery("");
              setEditingId(null);
              setAddOpen(false);
            }}
          >
            {editingId ? "Save Changes" : "Add Reminder"}
          </PrimaryButton>
        </div>
      </BottomSheet>
    </div>
  );
}
