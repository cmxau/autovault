import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Gauge, PencilLine, SearchX, Trash2 } from "lucide-react";
import { ErrorPage } from "@/components/autovault/error-page";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { SegmentedControl } from "@/components/autovault/segmented-control";
import { Row, RowGroup } from "@/components/autovault/row";
import { PrimaryButton, SecondaryButton } from "@/components/autovault/buttons";
import { ProgressBar } from "@/components/autovault/metric";
import { BottomSheet } from "@/components/autovault/bottom-sheet";
import { MileageChart } from "@/components/insights/mileage-chart";
import { TimelineEventRow } from "@/components/timeline/timeline-event";
import { VehicleNotesSection } from "@/components/autovault/vehicle-notes";
import { maskReg } from "@/lib/format";
import {
  formatCostPerDistance,
  formatDistance,
  formatMileage,
  formatMoney,
  formatVolume,
} from "@/lib/units";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { garageStore } from "@/lib/store";
import { useDocs, useTimeline, useVehicles } from "@/hooks/use-garage-data";
import {
  computeExpenseCategories,
  computeHealth,
  computeMaintenanceItems,
  computeServiceStatus,
  computeMileage,
  computeRunningCost,
  computeThisMonth,
} from "@/lib/analytics";

type Tab = "overview" | "maintenance" | "fuel" | "expenses" | "glovebox";

export const Route = createFileRoute("/vehicle/$vehicleId")({
  head: () => ({
    meta: [{ title: "Vehicle · AutoVault" }, { name: "robots", content: "noindex" }],
  }),
  component: VehicleDetailPage,
});

function VehicleDetailPage() {
  const { vehicleId } = Route.useParams();
  const vehicles = useVehicles();
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const [tab, setTab] = useState<Tab>("overview");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timeline = useTimeline();
  const docs = useDocs();
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
  const items = computeMaintenanceItems(vehicle, docs, system);
  const health = computeHealth(vehicle, docs);
  const service = computeServiceStatus(vehicle, system);
  const mileageStats = computeMileage(timeline, vehicle.id);
  const trend = mileageStats.trend;
  const month = computeThisMonth(timeline, vehicle.id, now);
  const runningCost = computeRunningCost(timeline, vehicle.id);
  const categories = computeExpenseCategories(timeline, vehicle.id, "month", now);
  const total = categories.reduce((s, c) => s + c.amount, 0);
  const fuelEntries = timeline.filter((e) => e.vehicleId === vehicle.id && e.kind === "fuel");
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
            <PencilLine className="size-[19px]" strokeWidth={1.75} />
          </Link>
        }
      />

      <div
        className="relative overflow-hidden rounded-[25px] border border-hairline"
        style={{
          background: `linear-gradient(170deg, hsl(${vehicle.tint} / 0.18), color-mix(in oklab, var(--card) 94%, transparent) 62%)`,
        }}
      >
        <img
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.nickname}`}
          width={1280}
          height={800}
          className="aspect-[16/9] w-full object-cover"
        />
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-4">
          <div>
            <p className="tnum text-[13px] tracking-[0.06em] text-muted-foreground">
              {maskReg(vehicle.registration)}
            </p>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.variant}
            </p>
          </div>
          <div className="text-right">
            <p className="tnum text-[22px] font-semibold leading-none tracking-[-0.02em]">
              {formatDistance(vehicle.odometer, system)}
            </p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">Odometer</p>
          </div>
        </div>
      </div>

      <SegmentedControl
        className="mb-7 mt-7 overflow-x-auto"
        size="sm"
        value={tab}
        onChange={setTab}
        options={[
          { value: "overview", label: "Overview" },
          { value: "maintenance", label: "Maintenance" },
          { value: "fuel", label: "Fuel" },
          { value: "expenses", label: "Expenses" },
          { value: "glovebox", label: "Glovebox" },
        ]}
      />

      {tab === "overview" && (
        <div className="space-y-7">
          <section>
            <SectionHeader title="Overview" />
            <RowGroup>
              <Row title="Current odometer" trailing={formatDistance(vehicle.odometer, system)} />
              <Row title="Average mileage" trailing={formatMileage(mileageStats.avg, system)} />
              <Row title="Monthly distance" trailing={formatDistance(month.monthKm, system)} />
              <Row
                title="Running cost"
                trailing={formatCostPerDistance(runningCost, system, currency)}
              />
              <Row title="Vehicle health" trailing={`${health}%`} to="/maintenance" />
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

          <section>
            <SectionHeader title="Manage" />
            <RowGroup>
              <Row
                icon={Trash2}
                title="Remove vehicle"
                detail="Also removes its fuel, service and document history"
                onClick={() => setConfirmDelete(true)}
                className="text-urgent"
              />
            </RowGroup>
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
            {items.map((item) => (
              <Row key={item.id} title={item.label} detail={item.detail} status={item.status} />
            ))}
          </RowGroup>
          <VehicleNotesSection vehicle={vehicle} />
        </div>
      )}

      {tab === "fuel" && (
        <div className="space-y-7">
          <div className="surface-tinted rounded-[18px] px-5 pb-5 pt-5">
            <p className="tnum text-[32px] font-semibold leading-none tracking-[-0.025em]">
              {formatMileage(mileageStats.avg, system)}
            </p>
            <p className="mt-1.5 text-[13px] text-muted-foreground">Average mileage</p>
            <MileageChart data={trend} />
          </div>
          <RowGroup>
            {fuelEntries.map((entry) => (
              <Row
                key={entry.id}
                icon={Gauge}
                title={new Date(entry.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                detail={`${formatVolume(entry.litres ?? 0, system)} · ${formatDistance(entry.odometer ?? 0, system)}`}
                trailing={formatMoney(entry.amount ?? 0, currency)}
              />
            ))}
          </RowGroup>
        </div>
      )}

      {tab === "expenses" && (
        <div className="surface-tinted rounded-[18px] px-5 py-2">
          {categories.map((category) => (
            <div key={category.label} className="border-hairline py-3.5 [&+&]:border-t">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[14.5px] font-medium">{category.label}</span>
                <span className="tnum text-[14.5px] font-semibold">
                  {formatMoney(category.amount, currency)}
                </span>
              </div>
              <ProgressBar className="mt-2.5 h-[4px]" value={(category.amount / total) * 100} />
            </div>
          ))}
        </div>
      )}

      {tab === "glovebox" && (
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
      )}

      <BottomSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Remove this vehicle?"
        description={`${vehicle.nickname} and its fuel, service, expense and document history will be deleted from this device.`}
      >
        <div className="space-y-3">
          <PrimaryButton
            className="bg-urgent hover:bg-urgent/90"
            onClick={() => {
              garageStore.deleteVehicle(vehicle.id);
              toast.success("Vehicle removed");
              void navigate({ to: "/" });
            }}
          >
            Remove Vehicle
          </PrimaryButton>
          <SecondaryButton onClick={() => setConfirmDelete(false)}>Cancel</SecondaryButton>
        </div>
      </BottomSheet>
    </div>
  );
}
