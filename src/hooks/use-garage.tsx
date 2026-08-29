import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useVehicles } from "@/hooks/use-garage-data";
import type { Vehicle } from "@/types/autovault";

type GarageContext = {
  vehicles: Vehicle[];
  vehicle: Vehicle | null;
  vehicleId: string | null;
  setVehicleId: (id: string) => void;
};

const Ctx = createContext<GarageContext | null>(null);

export function GarageProvider({ children }: { children: ReactNode }) {
  const vehicles = useVehicles();
  const [vehicleId, setVehicleId] = useState<string | null>(vehicles[0]?.id ?? null);

  const value = useMemo(() => {
    const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0] ?? null;
    return { vehicles, vehicle, vehicleId: vehicle?.id ?? null, setVehicleId };
  }, [vehicles, vehicleId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGarage() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGarage must be used inside GarageProvider");
  return ctx;
}
