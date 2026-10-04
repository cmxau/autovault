import { createContext, useContext } from "react";
import type { Vehicle } from "@/types/autovault";

export type GarageContext = {
  vehicles: Vehicle[];
  vehicle: Vehicle | null;
  vehicleId: string | null;
  setVehicleId: (id: string) => void;
};

export const GarageCtx = createContext<GarageContext | null>(null);

export function useGarage() {
  const ctx = useContext(GarageCtx);
  if (!ctx) throw new Error("useGarage must be used inside GarageProvider");
  return ctx;
}
