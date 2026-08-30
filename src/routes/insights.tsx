import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Droplets } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { SegmentedControl } from "@/components/autovault/segmented-control";
import { Metric, ProgressBar } from "@/components/autovault/metric";
import { EmptyState } from "@/components/autovault/empty-state";
import { PrimaryButton } from "@/components/autovault/buttons";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { MileageChart } from "@/components/insights/mileage-chart";
import { useGarage } from "@/hooks/use-garage";
import { useTimeline } from "@/hooks/use-garage-data";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { formatCostPerDistance, formatMileage, formatMoney } from "@/lib/units";
import {
  computeExpenseCategories,
  computeMileage,
  computeRunningCost,
  type Range,
} from "@/lib/analytics";

type Tab = "mileage" | "expenses";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights · AutoVault" },
      {
        name: "description",
        content:
          "Track mileage trends, running cost per kilometre and where your vehicle spending actually goes.",
      },
      { property: "og:title", content: "Insights · AutoVault" },
      {
        property: "og:description",
        content: "Mileage trends and expense breakdowns for your vehicles.",
      },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { vehicle } = useGarage();
  const timeline = useTimeline();
  const { system, currency } = useUnitPrefs();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("mileage");
  const [range, setRange] = useState<Range>("month");
  const now = new Date();

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Insights" />
        <NoVehicleEmptyState />
      </div>
    );
  }

  const mileageStats = computeMileage(timeline, vehicle.id);
  const trend = mileageStats.trend;
  const categories = computeExpenseCategories(timeline, vehicle.id, range, now);
  const total = categories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div>
      <PageHeader eyebrow={vehicle.nickname} title="Insights" />

      <SegmentedControl
        className="mb-8 max-w-[320px]"
        value={tab}
        onChange={setTab}
        options={[
          { value: "mileage", label: "Mileage" },
          { value: "expenses", label: "Expenses" },
        ]}
      />

      {tab === "mileage" ? (
        trend.length === 0 ? (
          <EmptyState
            icon={Droplets}
            title="Start with your next fill-up."
            description="Add two full-tank fuel entries and AutoVault can begin calculating your mileage."
            action={
              <PrimaryButton onClick={() => void navigate({ to: "/add/fuel" })}>
                Add Fuel
              </PrimaryButton>
            }
          />
        ) : (
          <>
            <div className="surface-tinted rounded-[25px] px-5 pb-5 pt-6">
              <p className="tnum text-[44px] font-semibold leading-none tracking-[-0.03em]">
                {formatMileage(mileageStats.avg, system)}
              </p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                Average mileage · full-tank entries only
              </p>
              <MileageChart data={trend} />
            </div>

            <section className="mt-8">
              <SectionHeader title="Range" />
              <div className="surface-tinted grid grid-cols-2 gap-y-6 rounded-[18px] px-5 py-5 sm:grid-cols-4">
                <Metric value={formatMileage(mileageStats.best, system)} label="Best" />
                <Metric value={formatMileage(mileageStats.worst, system)} label="Worst" />
                <Metric value={formatMileage(mileageStats.lastFill, system)} label="Last fill" />
                <Metric value={String(trend.length)} label="Fill-ups tracked" />
              </div>
            </section>
          </>
        )
      ) : (
        <>
          <SegmentedControl
            className="mb-6"
            size="sm"
            value={range}
            onChange={setRange}
            options={[
              { value: "month", label: "Month" },
              { value: "6m", label: "6 Months" },
              { value: "year", label: "Year" },
              { value: "all", label: "All Time" },
            ]}
          />

          <div className="surface-tinted rounded-[25px] px-5 py-6">
            <p className="text-[13px] text-muted-foreground">
              {
                { month: "This month", "6m": "Last 6 months", year: "This year", all: "All time" }[
                  range
                ]
              }
            </p>
            <p className="tnum mt-1.5 text-[40px] font-semibold leading-none tracking-[-0.03em]">
              {formatMoney(Math.round(total), currency)}
            </p>
            <p className="tnum mt-3 text-[13px] text-muted-foreground">
              Cost / {system === "imperial" ? "mi" : "km"} ·{" "}
              {formatCostPerDistance(computeRunningCost(timeline, vehicle.id), system, currency)}
            </p>
          </div>

          {categories.length === 0 ? (
            <EmptyState
              icon={Droplets}
              title="Nothing recorded in this range."
              description="Fuel, service and expense entries you add will show up here."
              action={
                <PrimaryButton onClick={() => void navigate({ to: "/add/expense" })}>
                  Add Expense
                </PrimaryButton>
              }
            />
          ) : (
            <section className="mt-8">
              <SectionHeader title="Categories" />
              <div className="surface-tinted rounded-[18px] px-5 py-2">
                {categories.map((category) => (
                  <div key={category.label} className="border-hairline py-3.5 [&+&]:border-t">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-[14.5px] font-medium">{category.label}</span>
                      <span className="tnum text-[14.5px] font-semibold">
                        {formatMoney(Math.round(category.amount), currency)}
                      </span>
                    </div>
                    <ProgressBar
                      className="mt-2.5 h-[4px]"
                      value={(category.amount / total) * 100}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
