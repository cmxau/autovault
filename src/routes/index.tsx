import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { Row, RowGroup } from "@/components/autovault/row";
import { VehicleCarousel } from "@/components/vehicles/vehicle-carousel";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { useGarage } from "@/hooks/use-garage";
import { useDocs, useTimeline } from "@/hooks/use-garage-data";
import { useNotificationPrefs } from "@/hooks/use-notification-prefs";
import { hasOnboarded } from "@/hooks/use-onboarding";
import { greeting } from "@/lib/format";
import { useProfileName } from "@/hooks/use-profile";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { formatDistance, formatMileage, formatMoney, formatCostPerDistance } from "@/lib/units";
import {
  computeHealth,
  computeMileage,
  computeRunningCost,
  computeThisMonth,
  computeUpcoming,
} from "@/lib/analytics";
import { ease } from "@/lib/motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Garage · AutoVault" },
      {
        name: "description",
        content:
          "See every vehicle you own at a glance: odometer, mileage, upcoming renewals and this month's running cost, all stored on your device.",
      },
      { property: "og:title", content: "My Garage · AutoVault" },
      {
        property: "og:description",
        content:
          "Odometer, mileage, upcoming renewals and running cost for every vehicle in your garage.",
      },
    ],
  }),
  component: GaragePage,
});

function GaragePage() {
  const { vehicle } = useGarage();
  const timeline = useTimeline();
  const docs = useDocs();
  const reduce = useReducedMotion();
  const { system, currency } = useUnitPrefs();
  const { serviceReminders, expiryReminders } = useNotificationPrefs();
  const now = new Date();
  // Local time differs between server and browser, so resolve after hydration.
  const profileName = useProfileName();
  const [eyebrow, setEyebrow] = useState("Welcome back");
  useEffect(() => setEyebrow(greeting(new Date(), profileName)), [profileName]);

  const navigate = useNavigate();
  useEffect(() => {
    if (!hasOnboarded()) void navigate({ to: "/welcome" });
  }, [navigate]);

  const header = (
    <PageHeader
      eyebrow={eyebrow}
      title="My Garage"
      subtitle={
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-ok" strokeWidth={1.8} />
          Stored on this device
        </span>
      }
    />
  );

  if (!vehicle) {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ease}
      >
        {header}
        <VehicleCarousel />
        <NoVehicleEmptyState description="Add your first vehicle to start tracking mileage, service and documents." />
      </motion.div>
    );
  }

  const items = computeUpcoming(vehicle, docs, system).filter((item) =>
    item.id === "service" ? serviceReminders : expiryReminders,
  );
  const mileageStats = computeMileage(timeline, vehicle.id);
  const month = computeThisMonth(timeline, vehicle.id, now);
  const runningCost = computeRunningCost(timeline, vehicle.id);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={ease}
    >
      {header}

      <VehicleCarousel />

      <section className="mt-9">
        <SectionHeader
          title="Upcoming"
          action={
            <Link
              to="/reminders"
              className="focus-ring inline-flex items-center gap-0.5 text-[13px] font-medium text-primary"
            >
              All reminders
              <ChevronRight className="size-3.5" strokeWidth={2.2} />
            </Link>
          }
        />
        <RowGroup>
          {items.map((item) => (
            <Row
              key={item.id}
              title={item.label}
              detail={item.detail}
              status={item.status}
              to="/reminders"
            />
          ))}
        </RowGroup>
      </section>

      <section className="mt-9">
        <SectionHeader title="This month" />
        <div className="surface-tinted rounded-[18px] px-5 py-5">
          <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
            <SummaryFigure value={formatDistance(month.monthKm, system)} label="Driven" />
            <SummaryFigure
              value={formatMoney(month.monthFuelCost, currency)}
              label="Fuel"
              divided
            />
            <SummaryFigure
              value={formatCostPerDistance(runningCost, system, currency)}
              label="Running cost"
              divided
              className="sm:border-l"
            />
            <SummaryFigure
              value={formatMileage(mileageStats.avg, system)}
              label="Mileage"
              divided
            />
          </div>
        </div>
      </section>

      <section className="mt-9">
        <SectionHeader title="Vehicle" />
        <RowGroup>
          <Row
            title="Vehicle health"
            detail="Based on your maintenance records"
            trailing={`${computeHealth(vehicle, docs)}%`}
            to="/maintenance"
          />
          <Row title="Glovebox" detail="RC, insurance, PUC and invoices" to="/glovebox" />
          <Row title="Timeline" detail="Full history of this vehicle" to="/timeline" />
        </RowGroup>
      </section>
    </motion.div>
  );
}

function SummaryFigure({
  value,
  label,
  divided,
  className,
}: {
  value: string;
  label: string;
  divided?: boolean;
  className?: string;
}) {
  return (
    <div className={`${divided ? "border-l border-hairline pl-5" : "pr-5"} ${className ?? ""}`}>
      <p className="tnum text-[21px] font-semibold leading-none tracking-[-0.02em]">{value}</p>
      <p className="mt-1.5 text-[12px] text-muted-foreground">{label}</p>
    </div>
  );
}
