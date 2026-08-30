import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/autovault/page-header";
import { SegmentedControl } from "@/components/autovault/segmented-control";
import { EmptyState } from "@/components/autovault/empty-state";
import { PrimaryButton } from "@/components/autovault/buttons";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { TimelineEventRow } from "@/components/timeline/timeline-event";
import { useGarage } from "@/hooks/use-garage";
import { useTimeline } from "@/hooks/use-garage-data";

type Filter = "all" | "fuel" | "service" | "document" | "expense";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline · AutoVault" },
      {
        name: "description",
        content:
          "A chronological history of every fuel fill, service, document and expense for your vehicle.",
      },
      { property: "og:title", content: "Timeline · AutoVault" },
      {
        property: "og:description",
        content: "The full life history of your vehicle, entry by entry.",
      },
    ],
  }),
  component: TimelinePage,
});

function TimelinePage() {
  const { vehicle } = useGarage();
  const timeline = useTimeline();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");

  const groups = useMemo(() => {
    if (!vehicle) return [];
    const entries = timeline
      .filter((e) => e.vehicleId === vehicle.id)
      .filter((e) => (filter === "all" ? true : e.kind === filter))
      .sort((a, b) => b.date.localeCompare(a.date));

    const map = new Map<string, typeof entries>();
    for (const entry of entries) {
      const key = new Date(entry.date)
        .toLocaleDateString("en-GB", { month: "long", year: "numeric" })
        .toUpperCase();
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return [...map.entries()];
  }, [timeline, vehicle, filter]);

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Timeline" />
        <NoVehicleEmptyState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow={vehicle.nickname} title="Timeline" />

      <SegmentedControl
        className="mb-8"
        size="sm"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All" },
          { value: "fuel", label: "Fuel" },
          { value: "service", label: "Service" },
          { value: "document", label: "Documents" },
          { value: "expense", label: "Expenses" },
        ]}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nothing recorded yet."
          description="Fuel fills, services, documents and expenses you add will appear here as your vehicle's history."
          action={
            <PrimaryButton onClick={() => void navigate({ to: "/add/fuel" })}>
              Add Entry
            </PrimaryButton>
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map(([month, entries]) => (
            <section key={month}>
              <h2 className="mb-4 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
                {month}
              </h2>
              <div>
                {entries.map((entry, i) => (
                  <TimelineEventRow
                    key={entry.id}
                    entry={entry}
                    index={i}
                    last={i === entries.length - 1}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
