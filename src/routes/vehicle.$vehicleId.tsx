import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PencilLine, SearchX } from "lucide-react";
import { ErrorPage } from "@/components/autovault/error-page";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { SegmentedControl } from "@/components/autovault/segmented-control";
import { Row, RowGroup } from "@/components/autovault/row";
import { SecondaryButton } from "@/components/autovault/buttons";
import { ProgressBar } from "@/components/autovault/metric";
import { TimelineEventRow } from "@/components/timeline/timeline-event";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { VehicleNotesSection } from "@/components/autovault/vehicle-notes";
import { ChecklistSection } from "@/components/autovault/checklist-section";
import {
  formatCostPerDistance,
  formatDistance,
  formatEfficiency,
  primaryFuelUnit as getPrimaryFuelUnit,
} from "@/lib/units";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { useDocs, useTimeline, useVehicles, useChecklist } from "@/hooks/use-garage-data";
import {
  computeMaintenanceItems,
  computeServiceStatus,
  computeMileage,
  computeRunningCost,
  computeThisMonth,
} from "@/lib/analytics";

type Tab = "overview" | "maintenance" | "glovebox";

const tabs: Tab[] = ["overview", "maintenance", "glovebox"];

export const Route = createFileRoute("/vehicle/$vehicleId")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => ({
    ...(tabs.includes(search["tab"] as Tab) && { tab: search["tab"] as Tab }),
  }),
  head: () => ({
    meta: [{ title: "Vehicle · AutoVault" }, { name: "robots", content: "noindex" }],
  }),
  component: VehicleDetailPage,
});

function VehicleDetailPage() {
  const { vehicleId } = Route.useParams();
  const vehicles = useVehicles();
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const { tab: initialTab } = Route.useSearch();
  const [tab, setTab] = useState<Tab>(initialTab ?? "overview");
  const timeline = useTimeline();
  const docs = useDocs();
  const checklist = useChecklist();
  const navigate = useNavigate();
  const { system, currency } = useUnitPrefs();

  if (!vehicle) {
    return (
      <ErrorPage
        code={404}
        icon={SearchX}
        title="Vehicle not found"
        description="This vehicle doesn't exist on this device, or its records were removed."
      />
    );
  }

  const now = new Date();
  // "Next service" is already shown prominently in the Maintenance tab's hero card.
  const items = computeMaintenanceItems(vehicle, docs, system, checklist).filter(
    (i) => i.id !== "service",
  );
  const service = computeServiceStatus(vehicle, system);
  const mileageStats = computeMileage(timeline, vehicle.id);
  // Bi-fuel vehicles mix units; these overview tiles just show the petrol side.
  const primaryFuelUnit = getPrimaryFuelUnit(vehicle.fuel);
  const month = computeThisMonth(timeline, vehicle.id, now);
  const runningCost = computeRunningCost(timeline, vehicle.id);
  const vehicleDocs = docs.filter((d) => d.vehicleId === vehicle.id);
  const remaining = vehicle.nextServiceKm - vehicle.odometer;

  return (
    <div>
      <PageHeader
        back={{ to: "/", label: "Garage" }}
        title={vehicle.nickname}
        className="mb-5"
        action={
          <Link
            to="/vehicle/$vehicleId/edit"
            params={{ vehicleId: vehicle.id }}
            aria-label="Edit vehicle"
            className="focus-ring grid size-11 place-items-center rounded-full text-foreground transition-colors hover:bg-accent"
          >
            <PencilLine className="size-[18px]" strokeWidth={1.75} />
          </Link>
        }
      />

      <VehicleCard vehicle={vehicle} avgMileage={mileageStats.avg} link={false} />

      <SegmentedControl
        className="mb-7 mt-7"
        size="sm"
        value={tab}
        onChange={setTab}
        options={[
          { value: "overview", label: "Overview" },
          { value: "maintenance", label: "Maintenance" },
          { value: "glovebox", label: "Glovebox" },
        ]}
      />

      {tab === "overview" && (
        <div className="space-y-7">
          <section>
            <SectionHeader title="Overview" />
            <RowGroup>
              <Row title="Current odometer" trailing={formatDistance(vehicle.odometer, system)} />
              <Row
                title="Average mileage"
                trailing={formatEfficiency(mileageStats.avg, primaryFuelUnit, system)}
              />
              <Row title="Monthly distance" trailing={formatDistance(month.monthKm, system)} />
              <Row
                title="Running cost"
                trailing={formatCostPerDistance(runningCost, system, currency)}
              />
              <Row
                title="Next service"
                trailing={`${formatDistance(vehicle.nextServiceKm, system)} · ${vehicle.nextServiceDate}`}
              />
            </RowGroup>
          </section>

          <section>
            <SectionHeader title="Recent" />
            <div>
              {timeline
                .filter((e) => e.vehicleId === vehicle.id)
                .slice(0, 3)
                .map((entry, i, arr) => (
                  <TimelineEventRow
                    key={entry.id}
                    entry={entry}
                    index={i}
                    last={i === arr.length - 1}
                  />
                ))}
            </div>
          </section>
        </div>
      )}

      {tab === "maintenance" && (
        <div className="space-y-7">
          <div className="surface-tinted rounded-[18px] px-5 py-5">
            <p className="text-[13px] text-muted-foreground">Next service</p>
            <p className="tnum mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em]">
              {formatDistance(vehicle.nextServiceKm, system)}
            </p>
            <ProgressBar
              className="mt-5"
              value={((10000 - remaining) / 10000) * 100}
              tone={
                service.status === "urgent"
                  ? "urgent"
                  : service.status === "warn"
                    ? "warn"
                    : "primary"
              }
            />
            <p className="tnum mt-2.5 text-[12.5px] text-muted-foreground">{service.detail}</p>
          </div>
          <RowGroup>
            {items.map((item) =>
              item.id.startsWith("compliance-") ? (
                <Row
                  key={item.id}
                  title={item.label}
                  detail={item.detail}
                  status={item.status}
                  to="/glovebox/new"
                />
              ) : docs.some((d) => d.id === item.id) ? (
                <Row
                  key={item.id}
                  title={item.label}
                  detail={item.detail}
                  status={item.status}
                  to="/glovebox/$docId"
                  params={{ docId: item.id }}
                />
              ) : (
                <Row key={item.id} title={item.label} detail={item.detail} status={item.status} />
              ),
            )}
          </RowGroup>
          <ChecklistSection vehicle={vehicle} checklist={checklist} />
          <VehicleNotesSection vehicle={vehicle} />
          <SecondaryButton
            onClick={() => void navigate({ to: "/add/expense", search: { category: "Service" } })}
          >
            Add Service Record
          </SecondaryButton>
        </div>
      )}

      {tab === "glovebox" && (
        <div className="space-y-5">
          <RowGroup>
            {vehicleDocs.map((doc) => (
              <Row
                key={doc.id}
                title={doc.category}
                detail={doc.expiry ? `${doc.issuer} · expires ${doc.expiry}` : doc.issuer}
                to="/glovebox/$docId"
                params={{ docId: doc.id }}
              />
            ))}
          </RowGroup>
          <SecondaryButton onClick={() => void navigate({ to: "/glovebox/new" })}>
            Add Document
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}
