import {
  BriefcaseBusiness,
  Bell,
  Car,
  ClipboardList,
  CircleGauge,
  Cog,
  Droplets,
  Ellipsis,
  FileText,
  Fuel,
  Gauge,
  Hammer,
  Lock,
  Receipt,
  ShieldCheck,
  Wind,
  Wrench,
} from "lucide-react";

/**
 * One icon per concept, so the same thing looks the same everywhere.
 * Add new concepts here instead of importing a different lucide icon at the call site.
 */
export const appIcons = {
  vehicle: Car,
  timeline: ClipboardList,
  fuel: Fuel,
  /** Fuel efficiency / average mileage. */
  mileage: Droplets,
  odometer: Gauge,
  service: Wrench,
  /** A repair, as opposed to scheduled service. */
  repair: Hammer,
  expense: Receipt,
  /** A single stored document. */
  document: FileText,
  /** The glovebox as a whole. */
  glovebox: BriefcaseBusiness,
  insurance: ShieldCheck,
  /** PUC / emissions, and air-related work. */
  emissions: Wind,
  engineOil: Cog,
  tyrePressure: CircleGauge,
  /** On-device storage and privacy. */
  privacy: Lock,
  reminder: Bell,
  /** The catch-all option in a category or type picker. */
  other: Ellipsis,
} as const;
