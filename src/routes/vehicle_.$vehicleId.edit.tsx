import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus, SearchX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { FormField, FormGroup, TextInput } from "@/components/autovault/form";
import { PrimaryButton, SecondaryButton } from "@/components/autovault/buttons";
import { BottomSheet } from "@/components/autovault/bottom-sheet";
import { ErrorPage } from "@/components/autovault/error-page";
import { Row, RowGroup } from "@/components/autovault/row";
import { garageStore } from "@/lib/store";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { useVehicles } from "@/hooks/use-garage-data";
import { displayToKm, distanceUnitLabel, kmToDisplay, type DistanceSystem } from "@/lib/units";
import type { Vehicle } from "@/types/autovault";

export const Route = createFileRoute("/vehicle_/$vehicleId/edit")({
  head: () => ({
    meta: [{ title: "Edit Vehicle · AutoVault" }, { name: "robots", content: "noindex" }],
  }),
  component: EditVehiclePage,
});

function formFromVehicle(vehicle: Vehicle | undefined, system: DistanceSystem) {
  return {
    nickname: vehicle?.nickname ?? "",
    make: vehicle?.make ?? "",
    model: vehicle?.model ?? "",
    variant: vehicle?.variant ?? "",
    year: vehicle ? String(vehicle.year) : "",
    registration: vehicle?.registration ?? "",
    odometer: vehicle ? String(Math.round(kmToDisplay(vehicle.odometer, system))) : "",
    nextServiceKm: vehicle ? String(Math.round(kmToDisplay(vehicle.nextServiceKm, system))) : "",
    nextServiceDate: vehicle?.nextServiceDate ?? "",
  };
}

function EditVehiclePage() {
  const { vehicleId } = Route.useParams();
  const vehicles = useVehicles();
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const { system } = useUnitPrefs();
  const distanceLabel = distanceUnitLabel(system);
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState(() => formFromVehicle(vehicle, system));
  const [photo, setPhoto] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function handlePhotoChange(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo too large", { description: "Choose an image under 2MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  if (!vehicle) {
    return (
      <ErrorPage
        code={404}
        icon={SearchX}
        title="Vehicle not found"
        description="This vehicle doesn't exist on this device, or its records were removed."
      />
    );
  }

  return (
    <div className="mx-auto max-w-[520px]">
      <PageHeader
        back={{ to: `/vehicle/${vehicle.id}`, label: vehicle.nickname }}
        title="Edit Vehicle"
      />

      <div className="mb-7">
        <SectionHeader title="Photo" />
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className="focus-ring surface-tinted flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <img src={photo ?? vehicle.image} alt="" className="size-full object-cover" />
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePhotoChange(e.target.files?.[0])}
        />
        <p className="mt-2 flex items-center gap-1.5 px-1 text-[12px] text-muted-foreground">
          <ImagePlus className="size-3.5" strokeWidth={1.7} />
          Tap the photo to replace it
        </p>
      </div>

      <FormGroup>
        <FormField label="Nickname">
          <TextInput value={form.nickname} onChange={set("nickname")} />
        </FormField>
        <FormField label="Make">
          <TextInput value={form.make} onChange={set("make")} />
        </FormField>
        <FormField label="Model">
          <TextInput value={form.model} onChange={set("model")} />
        </FormField>
        <FormField label="Variant">
          <TextInput value={form.variant} onChange={set("variant")} />
        </FormField>
        <FormField label="Year">
          <TextInput value={form.year} onChange={set("year")} numeric />
        </FormField>
        <FormField label="Registration">
          <TextInput value={form.registration} onChange={set("registration")} />
        </FormField>
      </FormGroup>

      <div className="mt-7">
        <SectionHeader title="Odometer & Service" />
        <FormGroup>
          <FormField label="Odometer">
            <TextInput
              value={form.odometer}
              onChange={set("odometer")}
              numeric
              suffix={distanceLabel}
            />
          </FormField>
          <FormField label="Next service at">
            <TextInput
              value={form.nextServiceKm}
              onChange={set("nextServiceKm")}
              numeric
              suffix={distanceLabel}
            />
          </FormField>
          <FormField label="Next service date">
            <TextInput value={form.nextServiceDate} onChange={set("nextServiceDate")} type="date" />
          </FormField>
        </FormGroup>
      </div>

      <div className="mt-8">
        <PrimaryButton
          onClick={() => {
            if (!form.make.trim() || !form.model.trim()) {
              toast.error("Enter make and model");
              return;
            }

            garageStore.updateVehicle(vehicle.id, {
              nickname: form.nickname.trim() || `${form.make} ${form.model}`.trim(),
              make: form.make,
              model: form.model,
              variant: form.variant,
              year: Number(form.year) || vehicle.year,
              registration: form.registration,
              odometer: Math.round(displayToKm(Number(form.odometer), system)) || vehicle.odometer,
              nextServiceKm:
                Math.round(displayToKm(Number(form.nextServiceKm), system)) ||
                vehicle.nextServiceKm,
              nextServiceDate: form.nextServiceDate,
              ...(photo && { image: photo }),
            });

            toast.success("Vehicle updated");
            void navigate({ to: "/vehicle/$vehicleId", params: { vehicleId: vehicle.id } });
          }}
        >
          Save Changes
        </PrimaryButton>
      </div>

      <section className="mt-8">
        <SectionHeader title="Danger Zone" />
        <RowGroup>
          <Row
            icon={Trash2}
            title="Remove vehicle"
            detail="Also removes its fuel, service and document history"
            onClick={() => setConfirmDelete(true)}
            className="text-urgent"
          />
        </RowGroup>
      </section>

      <BottomSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Remove this vehicle?"
        description={`${vehicle.nickname} and its fuel, service, expense and document history will be deleted from this device.`}
      >
        <div className="space-y-3">
          <PrimaryButton
            className="bg-urgent hover:bg-urgent/90"
            onClick={() => {
              garageStore.deleteVehicle(vehicle.id);
              toast.success("Vehicle removed");
              void navigate({ to: "/" });
            }}
          >
            Remove Vehicle
          </PrimaryButton>
          <SecondaryButton onClick={() => setConfirmDelete(false)}>Cancel</SecondaryButton>
        </div>
      </BottomSheet>
    </div>
  );
}
