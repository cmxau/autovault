import type {
  Doc,
  MaintenanceItem,
  Status,
  TimelineEntry,
  UpcomingItem,
  Vehicle,
} from "@/types/autovault";
import { formatDistance, type DistanceSystem } from "@/lib/units";
import { monthsUntil } from "@/lib/format";

export type Range = "month" | "6m" | "year" | "all";

function ofVehicle<T extends { vehicleId: string }>(items: T[], vehicleId: string) {
  return items.filter((i) => i.vehicleId === vehicleId);
}

export function computeMileage(timeline: TimelineEntry[], vehicleId: string) {
  const fuel = ofVehicle(timeline, vehicleId)
    .filter((e) => e.kind === "fuel" && e.odometer !== undefined && e.litres)
    .sort((a, b) => (a.odometer ?? 0) - (b.odometer ?? 0));

  const points: { date: string; value: number }[] = [];
  for (let i = 1; i < fuel.length; i++) {
    const prev = fuel[i - 1]!;
    const cur = fuel[i]!;
    const distance = (cur.odometer ?? 0) - (prev.odometer ?? 0);
    const litres = cur.litres ?? 0;
    if (distance > 0 && litres > 0) points.push({ date: cur.date, value: distance / litres });
  }

  if (points.length === 0) {
    return {
      avg: 0,
      best: 0,
      worst: 0,
      lastFill: 0,
      trend: [] as { label: string; value: number }[],
    };
  }

  const values = points.map((p) => p.value);
  return {
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    best: Math.max(...values),
    worst: Math.min(...values),
    lastFill: values[values.length - 1]!,
    trend: points.map((p) => ({
      label: new Date(p.date).toLocaleDateString("en-GB", { month: "short" }),
      value: Number(p.value.toFixed(1)),
    })),
  };
}

export function rangeWindow(range: Range, now: Date) {
  const to = now;
  const from = new Date(now);
  if (range === "month") from.setMonth(from.getMonth() - 1);
  else if (range === "6m") from.setMonth(from.getMonth() - 6);
  else if (range === "year") from.setFullYear(from.getFullYear() - 1);
  else from.setFullYear(from.getFullYear() - 100);
  return { from, to };
}

export function computeExpenseCategories(
  timeline: TimelineEntry[],
  vehicleId: string,
  range: Range,
  now: Date,
) {
  const { from, to } = rangeWindow(range, now);
  const entries = ofVehicle(timeline, vehicleId).filter((e) => {
    const t = new Date(e.date).getTime();
    return e.amount && t >= from.getTime() && t <= to.getTime();
  });

  const labelFor = (e: TimelineEntry) =>
    e.kind === "fuel" ? "Fuel" : e.kind === "service" ? "Service" : e.title;

  const totals = new Map<string, number>();
  for (const e of entries) {
    const label = labelFor(e);
    totals.set(label, (totals.get(label) ?? 0) + (e.amount ?? 0));
  }
  return [...totals.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function computeThisMonth(timeline: TimelineEntry[], vehicleId: string, now: Date) {
  const entries = ofVehicle(timeline, vehicleId).filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthFuelCost = entries
    .filter((e) => e.kind === "fuel")
    .reduce((s, e) => s + (e.amount ?? 0), 0);
  const monthTotalCost = entries.reduce((s, e) => s + (e.amount ?? 0), 0);
  const odometers = entries.map((e) => e.odometer).filter((n): n is number => n !== undefined);
  const monthKm = odometers.length >= 2 ? Math.max(...odometers) - Math.min(...odometers) : 0;
  return { monthKm, monthFuelCost, monthTotalCost };
}

export function computeRunningCost(timeline: TimelineEntry[], vehicleId: string) {
  const entries = ofVehicle(timeline, vehicleId);
  const odometers = entries.map((e) => e.odometer).filter((n): n is number => n !== undefined);
  const totalCost = entries.reduce((s, e) => s + (e.amount ?? 0), 0);
  if (odometers.length < 2) return 0;
  const km = Math.max(...odometers) - Math.min(...odometers);
  return km > 0 ? totalCost / km : 0;
}

export function computeHealth(vehicle: Vehicle, docs: Doc[]) {
  let score = 100;
  const remaining = vehicle.nextServiceKm - vehicle.odometer;
  if (remaining < 0) score -= 30;
  else if (remaining < 500) score -= 10;

  for (const doc of ofVehicle(docs, vehicle.id)) {
    if (doc.daysLeft === undefined) continue;
    if (doc.daysLeft < 0) score -= 15;
    else if (doc.daysLeft <= 30) score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}

export function computeServiceStatus(vehicle: Vehicle, system: DistanceSystem = "metric") {
  const kmRemaining = vehicle.nextServiceKm - vehicle.odometer;
  const months = vehicle.nextServiceDate ? monthsUntil(vehicle.nextServiceDate) : null;
  const kmOverdue = kmRemaining < 0;
  const monthsOverdue = months !== null && months < 0;
  const overdue = kmOverdue || monthsOverdue;
  const status: Status = overdue
    ? "urgent"
    : kmRemaining < 500 || (months !== null && months <= 1)
      ? "warn"
      : "ok";

  if (overdue) {
    const parts = [
      kmOverdue ? formatDistance(Math.abs(kmRemaining), system) : null,
      monthsOverdue ? `${Math.abs(months!)} mo` : null,
    ].filter(Boolean);
    return { status, detail: `Overdue by ${parts.join(" or ")}` };
  }

  const distanceText = formatDistance(kmRemaining, system);
  if (months === null) return { status, detail: `${distanceText} remaining` };
  return {
    status,
    detail: `${distanceText} or ${months} mo remaining, whichever comes first`,
  };
}

export function computeMaintenanceItems(
  vehicle: Vehicle,
  docs: Doc[],
  system: DistanceSystem = "metric",
): MaintenanceItem[] {
  const service = computeServiceStatus(vehicle, system);
  const items: MaintenanceItem[] = [
    {
      id: "service",
      label: "Next service",
      status: service.status,
      detail: service.detail,
    },
  ];

  for (const doc of ofVehicle(docs, vehicle.id).filter((d) => d.expiry)) {
    const status: Status =
      doc.daysLeft !== undefined && doc.daysLeft < 0
        ? "urgent"
        : doc.daysLeft !== undefined && doc.daysLeft <= 30
          ? "warn"
          : "ok";
    items.push({
      id: doc.id,
      label: doc.category,
      status,
      detail:
        doc.daysLeft !== undefined && doc.daysLeft < 0
          ? `Expired ${doc.expiry}`
          : `Expires ${doc.expiry}`,
    });
  }
  return items;
}

const URGENCY_RANK: Record<Status, number> = { urgent: 0, warn: 1, unknown: 2, ok: 3 };

export function computeUpcoming(
  vehicle: Vehicle,
  docs: Doc[],
  system: DistanceSystem = "metric",
): UpcomingItem[] {
  const service = computeServiceStatus(vehicle, system);
  const items: UpcomingItem[] = [
    {
      id: "service",
      label: "Service due",
      detail: service.detail,
      status: service.status,
    },
  ];

  for (const doc of ofVehicle(docs, vehicle.id).filter((d) => d.expiry)) {
    items.push({
      id: doc.id,
      label: doc.category,
      detail:
        doc.daysLeft !== undefined && doc.daysLeft < 0
          ? `Expired ${doc.expiry}`
          : `Expires in ${doc.daysLeft} days`,
      status:
        doc.daysLeft !== undefined && doc.daysLeft < 0
          ? "urgent"
          : doc.daysLeft !== undefined && doc.daysLeft <= 30
            ? "warn"
            : "ok",
    });
  }

  return items.sort((a, b) => URGENCY_RANK[a.status] - URGENCY_RANK[b.status]);
}
