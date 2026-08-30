import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Car, Bike, Zap, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { FormField, FormGroup, TextInput } from "@/components/autovault/form";
import { PrimaryButton, SecondaryButton } from "@/components/autovault/buttons";
import { ProgressBar } from "@/components/autovault/metric";
import { usePress } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { garageStore } from "@/lib/store";
import { KIND_TINTS, vehiclePlaceholderImage } from "@/lib/placeholder";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { displayToKm, distanceUnitLabel } from "@/lib/units";
import type { Vehicle, VehicleKind } from "@/types/autovault";

export const Route = createFileRoute("/vehicle/new")({
  head: () => ({
    meta: [
      { title: "Add a Vehicle · AutoVault" },
      {
        name: "description",
        content:
          "Add a car, motorcycle or scooter to your garage in five short steps, everything else can wait.",
      },
      { property: "og:title", content: "Add a Vehicle · AutoVault" },
      { property: "og:description", content: "A five-step way to add a vehicle to your garage." },
    ],
  }),
  component: AddVehiclePage,
});

const kinds = [
  { value: "car", label: "Car", icon: Car },
  { value: "motorcycle", label: "Motorcycle", icon: Bike },
  { value: "scooter", label: "Scooter", icon: Zap },
] as const;

const titles = ["What are you adding?", "Vehicle", "Registration", "Odometer", "Personalize"];

function AddVehiclePage() {
  const navigate = useNavigate();
  const { system } = useUnitPrefs();
  const distanceLabel = distanceUnitLabel(system);
  const press = usePress(0.97);
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<string>("car");
  const [form, setForm] = useState({
    make: "",
    model: "",
    variant: "",
    year: "",
    registration: "",
    odometer: "",
    nextServiceKm: "",
    nextServiceDate: "",
    nickname: "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [photo, setPhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const last = step === titles.length - 1;

  const canContinue =
    step === 1
      ? form.make.trim() !== "" && form.model.trim() !== "" && form.year.trim() !== ""
      : step === 2
        ? form.registration.trim() !== ""
        : step === 3
          ? form.odometer.trim() !== ""
          : true;

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

  return (
    <div className="mx-auto max-w-[520px]">
      <PageHeader
        back={{ to: "/", label: "Garage" }}
        eyebrow={`Step ${step + 1} of ${titles.length}`}
        title={titles[step] ?? ""}
        className="mb-5"
      />
      <ProgressBar value={((step + 1) / titles.length) * 100} className="mb-8" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        >
          {step === 0 && (
            <div className="grid gap-3">
              {kinds.map((option) => (
                <motion.button
                  key={option.value}
                  {...press}
                  onClick={() => setKind(option.value)}
                  className={cn(
                    "focus-ring flex min-h-[68px] items-center gap-4 rounded-[18px] border px-4 text-left transition-colors",
                    kind === option.value
                      ? "border-primary/40 bg-primary/[0.07]"
                      : "border-hairline bg-card hover:bg-accent",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-[12px]",
                      kind === option.value
                        ? "bg-primary/12 text-primary"
                        : "bg-foreground/[0.05] text-foreground/70",
                    )}
                  >
                    <option.icon className="size-[19px]" strokeWidth={1.7} />
                  </span>
                  <span className="text-[16px] font-medium tracking-[-0.01em]">{option.label}</span>
                </motion.button>
              ))}
            </div>
          )}

          {step === 1 && (
            <FormGroup>
              <FormField label="Make">
                <TextInput value={form.make} onChange={set("make")} placeholder="Honda" />
              </FormField>
              <FormField label="Model">
                <TextInput value={form.model} onChange={set("model")} placeholder="City" />
              </FormField>
              <FormField label="Variant">
                <TextInput value={form.variant} onChange={set("variant")} placeholder="ZX CVT" />
              </FormField>
              <FormField label="Year">
                <TextInput value={form.year} onChange={set("year")} numeric placeholder="2023" />
              </FormField>
            </FormGroup>
          )}

          {step === 2 && (
            <>
              <FormGroup>
                <FormField label="Number">
                  <TextInput
                    value={form.registration}
                    onChange={set("registration")}
                    placeholder="MH 12 KL 4821"
                  />
                </FormField>
              </FormGroup>
              <p className="mt-3 px-1 text-[12.5px] leading-relaxed text-muted-foreground">
                Registration numbers are stored on this device and shown partly masked on the garage
                screen.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <FormGroup>
                <FormField label="Odometer" hint="Reading right now">
                  <TextInput
                    value={form.odometer}
                    onChange={set("odometer")}
                    numeric
                    suffix={distanceLabel}
                    placeholder="24820"
                  />
                </FormField>
              </FormGroup>

              <div className="mt-7">
                <SectionHeader title="Next Service" />
                <FormGroup>
                  <FormField label="At" hint="Leave blank for +5,000 from odometer">
                    <TextInput
                      value={form.nextServiceKm}
                      onChange={set("nextServiceKm")}
                      numeric
                      suffix={distanceLabel}
                      placeholder="-"
                    />
                  </FormField>
                  <FormField label="Or by date" hint="Leave blank for 6 months from now">
                    <TextInput
                      value={form.nextServiceDate}
                      onChange={set("nextServiceDate")}
                      type="date"
                    />
                  </FormField>
                </FormGroup>
                <p className="mt-2.5 px-1 text-[12px] leading-relaxed text-muted-foreground">
                  Service reminds you at whichever comes first, distance or date. Both can be
                  changed later from the vehicle's edit screen.
                </p>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <FormGroup>
                <FormField label="Nickname">
                  <TextInput
                    value={form.nickname}
                    onChange={set("nickname")}
                    placeholder="Honda City ZX"
                  />
                </FormField>
              </FormGroup>
              <div className="mt-4">
                <SectionHeader title="Photo" />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="focus-ring surface-tinted flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {photo ? (
                    <img src={photo} alt="" className="size-full object-cover" />
                  ) : (
                    <>
                      <ImagePlus className="size-6" strokeWidth={1.4} />
                      <span className="text-[13.5px]">Choose a photo</span>
                    </>
                  )}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                />
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 space-y-3">
        <PrimaryButton
          onClick={() => {
            if (!canContinue) {
              toast.error("Fill in the required fields first");
              return;
            }

            if (!last) {
              setStep((s) => s + 1);
              return;
            }

            const year = Number(form.year) || new Date().getFullYear();
            const odometer = Math.round(displayToKm(Number(form.odometer) || 0, system));
            const tint = KIND_TINTS[kind] ?? KIND_TINTS["car"]!;
            const nickname = form.nickname.trim() || `${form.make} ${form.model}`.trim();

            const nextServiceKm = form.nextServiceKm.trim()
              ? Math.round(displayToKm(Number(form.nextServiceKm), system))
              : odometer + 5000;
            const sixMonthsFromNow = new Date();
            sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
            const nextServiceDate =
              form.nextServiceDate.trim() || sixMonthsFromNow.toISOString().slice(0, 10);

            const vehicle: Vehicle = {
              id: crypto.randomUUID(),
              kind: kind as VehicleKind,
              nickname,
              make: form.make,
              model: form.model,
              variant: form.variant,
              year,
              fuel: "Petrol",
              registration: form.registration,
              odometer,
              avgMileage: 0,
              bestMileage: 0,
              worstMileage: 0,
              lastFillMileage: 0,
              image: photo ?? vehiclePlaceholderImage(tint),
              tint,
              health: 100,
              nextServiceKm,
              nextServiceDate,
              monthKm: 0,
              monthFuelCost: 0,
              monthTotalCost: 0,
              runningCost: 0,
            };

            garageStore.addVehicle(vehicle);
            toast.success("Vehicle added", { description: "It is now part of your garage." });
            void navigate({ to: "/vehicle/$vehicleId", params: { vehicleId: vehicle.id } });
          }}
        >
          {last ? "Add to My Garage" : "Continue"}
        </PrimaryButton>
        {step > 0 && <SecondaryButton onClick={() => setStep((s) => s - 1)}>Back</SecondaryButton>}
        {!last && (
          <p className="pt-1 text-center text-[12px] text-muted-foreground">
            Everything else can be entered later.
          </p>
        )}
      </div>
    </div>
  );
}
