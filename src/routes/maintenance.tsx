import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { Row, RowGroup } from "@/components/autovault/row";
import { ProgressBar } from "@/components/autovault/metric";
import { SecondaryButton } from "@/components/autovault/buttons";
import { useGarage } from "@/hooks/use-garage";
import { useDocs, useChecklist } from "@/hooks/use-garage-data";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { formatDistance } from "@/lib/units";
import { computeMaintenanceItems, computeServiceStatus } from "@/lib/analytics";
import { VehicleNotesSection } from "@/components/autovault/vehicle-notes";
import { ChecklistSection } from "@/components/autovault/checklist-section";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance · AutoVault" },
      {
        name: "description",
        content: "Next service, checklist status and maintenance records for your vehicle.",
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
  const checklist = useChecklist();
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

      <ChecklistSection vehicle={vehicle} checklist={checklist} />

      <VehicleNotesSection vehicle={vehicle} />

      <div className="mt-8">
        <SecondaryButton onClick={() => void navigate({ to: "/add/service" })}>
          Add Service Record
        </SecondaryButton>
      </div>
    </div>
  );
}
