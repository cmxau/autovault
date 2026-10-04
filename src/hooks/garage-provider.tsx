import { useMemo, useState, type ReactNode } from "react";
import { useVehicles } from "@/hooks/use-garage-data";
import { GarageCtx } from "@/hooks/use-garage";

export function GarageProvider({ children }: { children: ReactNode }) {
  const vehicles = useVehicles();
  const [vehicleId, setVehicleId] = useState<string | null>(vehicles[0]?.id ?? null);

  const value = useMemo(() => {
    const vehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0] ?? null;
    return { vehicles, vehicle, vehicleId: vehicle?.id ?? null, setVehicleId };
  }, [vehicles, vehicleId]);

  return <GarageCtx.Provider value={value}>{children}</GarageCtx.Provider>;
}
