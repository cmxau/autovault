import { useNavigate } from "@tanstack/react-router";
import { appIcons } from "@/lib/icons";
import { EmptyState } from "@/components/autovault/empty-state";
import { PrimaryButton } from "@/components/autovault/buttons";

export function NoVehicleEmptyState({
  description = "Add a vehicle to your garage to start tracking it.",
}: {
  description?: string;
}) {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon={appIcons.vehicle}
      title="No vehicle yet."
      description={description}
      action={
        <PrimaryButton onClick={() => void navigate({ to: "/vehicle/new" })}>
          Add Vehicle
        </PrimaryButton>
      }
    />
  );
}
