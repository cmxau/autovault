export type VehicleKind = "car" | "motorcycle" | "scooter";

export type Vehicle = {
  id: string;
  kind: VehicleKind;
  nickname: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  fuel: string;
  registration: string;
  odometer: number;
  avgMileage: number;
  bestMileage: number;
  worstMileage: number;
  lastFillMileage: number;
  image: string;
  tint: string;
  health: number;
  nextServiceKm: number;
  nextServiceDate: string;
  monthKm: number;
  monthFuelCost: number;
  monthTotalCost: number;
  runningCost: number;
};

export type Status = "ok" | "warn" | "urgent" | "unknown";

export type TimelineKind = "fuel" | "service" | "document" | "expense" | "odometer";

export type TimelineEntry = {
  id: string;
  vehicleId: string;
  kind: TimelineKind;
  title: string;
  date: string;
  odometer?: number;
  litres?: number;
  amount?: number;
  note?: string;
};

export type Doc = {
  id: string;
  vehicleId: string;
  category: string;
  title: string;
  issuer: string;
  number: string;
  issued: string;
  expiry?: string;
  daysLeft?: number;
  hasFile: boolean;
};

export type MaintenanceItem = {
  id: string;
  label: string;
  status: Status;
  detail: string;
};

export type Reminder = {
  id: string;
  vehicleId: string;
  category: string;
  title: string;
  detail: string;
  status: Status;
  leadDays: number[];
};

export type UpcomingItem = {
  id: string;
  label: string;
  detail: string;
  status: Status;
};

export type ExpenseCategory = {
  label: string;
  amount: number;
};

export type MileagePoint = {
  label: string;
  value: number;
};
