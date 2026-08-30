import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { Row, RowGroup } from "@/components/autovault/row";
import { ProgressBar } from "@/components/autovault/metric";
import { SecondaryButton } from "@/components/autovault/buttons";
import { useGarage } from "@/hooks/use-garage";
import { useDocs } from "@/hooks/use-garage-data";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { formatDistance } from "@/lib/units";
import { computeHealth, computeMaintenanceItems, computeServiceStatus } from "@/lib/analytics";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance · AutoVault" },
      {
        name: "description",
        content:
          "Next service, maintenance item status and a record-based health summary for your vehicle.",
      },
      { property: "og:title", content: "Maintenance · AutoVault" },
      {
        property: "og:description",
        content: "Next service countdown and maintenance status from your own records.",
      },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const { vehicle } = useGarage();
  const docs = useDocs();
  const navigate = useNavigate();
  const { system } = useUnitPrefs();

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Maintenance" />
        <NoVehicleEmptyState />
      </div>
    );
  }

  const items = computeMaintenanceItems(vehicle, docs, system);
  const health = computeHealth(vehicle, docs);
  const service = computeServiceStatus(vehicle, system);

  const serviceStart = vehicle.nextServiceKm - 10000;
  const progress =
    ((vehicle.odometer - serviceStart) / (vehicle.nextServiceKm - serviceStart)) * 100;
  const remaining = vehicle.nextServiceKm - vehicle.odometer;

  return (
    <div>
      <PageHeader eyebrow={vehicle.nickname} title="Maintenance" />

      <div className="surface-tinted rounded-[25px] px-5 py-6">
        <p className="text-[13px] text-muted-foreground">Next service</p>
        <p className="tnum mt-1.5 text-[32px] font-semibold leading-none tracking-[-0.025em]">
          {formatDistance(vehicle.nextServiceKm, system)}
        </p>
        {vehicle.nextServiceDate && (
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            or {vehicle.nextServiceDate}, whichever comes first
          </p>
        )}

        <ProgressBar
          className="mt-6"
          value={progress}
          tone={
            service.status === "urgent" ? "urgent" : service.status === "warn" ? "warn" : "primary"
          }
        />
        <div className="tnum mt-2.5 flex items-baseline justify-between text-[12.5px] text-muted-foreground">
          <span>{formatDistance(vehicle.odometer, system)}</span>
          <span className="font-medium text-foreground">{service.detail}</span>
          <span>{formatDistance(vehicle.nextServiceKm, system)}</span>
        </div>
      </div>

      <section className="mt-8">
        <SectionHeader title="Items" />
        <RowGroup>
          {items.map((item) => (
            <Row key={item.id} title={item.label} detail={item.detail} status={item.status} />
          ))}
        </RowGroup>
      </section>

      <section className="mt-8">
        <SectionHeader title="Vehicle health" />
        <div className="surface-tinted rounded-[18px] px-5 py-5">
          <div className="flex items-end gap-3">
            <p className="tnum text-[40px] font-semibold leading-none tracking-[-0.03em]">
              {health}%
            </p>
            <p className="pb-1 text-[13px] text-muted-foreground">
              Based on your maintenance records
            </p>
          </div>
          <ProgressBar className="mt-4" value={health} tone={health < 60 ? "warn" : "ok"} />
          <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
            AutoVault does not inspect your vehicle. This score reflects only the service due date
            and document expiries you keep on record.
          </p>
        </div>
      </section>

      <div className="mt-8">
        <SecondaryButton onClick={() => void navigate({ to: "/add/service" })}>
          Add Service Record
        </SecondaryButton>
      </div>
    </div>
  );
}
