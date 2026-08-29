import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { StatusDot } from "@/components/autovault/status-indicator";
import { SecondaryButton } from "@/components/autovault/buttons";
import { PrimaryButton } from "@/components/autovault/buttons";
import { BottomSheet } from "@/components/autovault/bottom-sheet";
import { FormField, FormGroup, TextInput } from "@/components/autovault/form";
import { useGarage } from "@/hooks/use-garage";
import { useDocs } from "@/hooks/use-garage-data";
import { useReminderLeads } from "@/hooks/use-reminder-leads";
import { useNotificationPrefs } from "@/hooks/use-notification-prefs";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { useCustomReminders } from "@/hooks/use-custom-reminders";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { computeUpcoming } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reminders")({
  head: () => ({
    meta: [
      { title: "Reminders — AutoVault" },
      {
        name: "description",
        content:
          "Date and odometer based reminders for service, insurance, PUC, warranty and custom maintenance.",
      },
      { property: "og:title", content: "Reminders — AutoVault" },
      {
        property: "og:description",
        content: "Never miss a renewal — reminders for service, insurance, PUC and more.",
      },
    ],
  }),
  component: RemindersPage,
});

const leadOptions = [30, 7, 1];

function RemindersPage() {
  const { vehicle } = useGarage();
  const docs = useDocs();
  const { forId, toggle } = useReminderLeads();
  const {
    items: custom,
    add: addCustom,
    remove: removeCustom,
  } = useCustomReminders(vehicle?.id ?? "");
  const { serviceReminders, expiryReminders } = useNotificationPrefs();
  const { system } = useUnitPrefs();
  const [addOpen, setAddOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Reminders" />
        <NoVehicleEmptyState />
      </div>
    );
  }

  const derived = computeUpcoming(vehicle, docs, system).filter((item) =>
    item.id === "service" ? serviceReminders : expiryReminders,
  );

  return (
    <div>
      <PageHeader eyebrow={vehicle.nickname} title="Reminders" />

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
                <Bell className="size-[17px] shrink-0 text-muted-foreground/70" strokeWidth={1.6} />
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
          return (
            <article key={reminder.id} className="surface-tinted rounded-[18px] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[15.5px] font-medium tracking-[-0.005em]">
                    <StatusDot status="unknown" />
                    {reminder.label}
                  </p>
                  {reminder.detail && (
                    <p className="tnum mt-1 text-[13px] text-muted-foreground">{reminder.detail}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Delete reminder"
                  onClick={() => {
                    removeCustom(reminder.id);
                    toast.success("Reminder removed");
                  }}
                  className="focus-ring text-muted-foreground/70 transition-colors hover:text-urgent"
                >
                  <Trash2 className="size-[17px]" strokeWidth={1.6} />
                </button>
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
        <SecondaryButton onClick={() => setAddOpen(true)}>New Reminder</SecondaryButton>
        <p className="mt-3 px-1 text-[12px] leading-relaxed text-muted-foreground">
          Service and document reminders above are generated from your records. Custom reminders are
          a plain note you set the lead time on.
        </p>
      </section>

      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New Reminder"
        description="A custom, freeform reminder for this vehicle"
      >
        <div className="space-y-4">
          <FormGroup>
            <FormField label="Title">
              <TextInput value={label} onChange={setLabel} placeholder="Tyre rotation" />
            </FormField>
            <FormField label="Note">
              <TextInput value={detail} onChange={setDetail} placeholder="Every 10,000 km" />
            </FormField>
          </FormGroup>
          <PrimaryButton
            onClick={() => {
              if (!label.trim()) {
                toast.error("Enter a title");
                return;
              }
              addCustom(label.trim(), detail.trim());
              setLabel("");
              setDetail("");
              setAddOpen(false);
              toast.success("Reminder added");
            }}
          >
            Add Reminder
          </PrimaryButton>
        </div>
      </BottomSheet>
    </div>
  );
}
