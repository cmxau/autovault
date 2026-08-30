import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { FormField, FormGroup, TextInput, ChipGroup } from "@/components/autovault/form";
import { PrimaryButton } from "@/components/autovault/buttons";
import { useGarage } from "@/hooks/use-garage";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { garageStore } from "@/lib/store";
import { daysUntil } from "@/lib/format";

export const Route = createFileRoute("/glovebox/new")({
  head: () => ({
    meta: [
      { title: "Add Document · AutoVault" },
      {
        name: "description",
        content:
          "Add a registration, insurance, PUC or invoice document to your vehicle's glovebox.",
      },
      { property: "og:title", content: "Add Document · AutoVault" },
      { property: "og:description", content: "Store a vehicle document privately on your device." },
    ],
  }),
  component: AddDocumentPage,
});

const categories = [
  "Registration (RC)",
  "Insurance",
  "PUC",
  "Warranty",
  "Roadside Assistance",
  "Service Invoices",
  "Purchase Documents",
  "Other",
];

function AddDocumentPage() {
  const { vehicle } = useGarage();
  const navigate = useNavigate();
  const [category, setCategory] = useState("Insurance");
  const [issuer, setIssuer] = useState("");
  const [number, setNumber] = useState("");
  const [issued, setIssued] = useState("");
  const [expiry, setExpiry] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!vehicle) {
    return (
      <div>
        <PageHeader back={{ to: "/glovebox", label: "Glovebox" }} title="Add Document" />
        <NoVehicleEmptyState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        back={{ to: "/glovebox", label: "Glovebox" }}
        eyebrow={vehicle.nickname}
        title="Add Document"
      />

      <SectionHeader title="Type" />
      <ChipGroup options={categories} selected={[category]} onToggle={setCategory} />

      <div className="mt-7">
        <SectionHeader title="Details" />
        <FormGroup>
          <FormField label="Provider">
            <TextInput value={issuer} onChange={setIssuer} placeholder="ICICI Lombard" />
          </FormField>
          <FormField label="Number">
            <TextInput value={number} onChange={setNumber} placeholder="3005/AB/928471/26" />
          </FormField>
          <FormField label="Issued">
            <TextInput value={issued} onChange={setIssued} type="date" />
          </FormField>
          <FormField label="Expires">
            <TextInput value={expiry} onChange={setExpiry} type="date" />
          </FormField>
        </FormGroup>
      </div>

      <div className="mt-7">
        <SectionHeader title="File" />
        <FormGroup>
          <FormField label="Attachment">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="focus-ring py-2 text-[15px] font-medium text-primary"
            >
              {file ? file.name : "Choose file"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </FormField>
        </FormGroup>
        <p className="mt-2.5 px-1 text-[12px] text-muted-foreground">
          Files stay on this device and are included in encrypted backups you export.
        </p>
      </div>

      <div className="mt-8">
        <PrimaryButton
          onClick={() => {
            if (!issuer || !issued) {
              toast.error("Enter a provider name and issue date");
              return;
            }

            garageStore.addDoc({
              id: crypto.randomUUID(),
              vehicleId: vehicle.id,
              category,
              title: `${category} · ${issuer}`,
              issuer,
              number,
              issued,
              ...(expiry && { expiry, daysLeft: daysUntil(expiry) }),
              hasFile: file !== null,
            });

            toast.success("Document saved", { description: `${category} added to your glovebox.` });
            void navigate({ to: "/glovebox" });
          }}
        >
          Save Document
        </PrimaryButton>
      </div>
    </div>
  );
}
