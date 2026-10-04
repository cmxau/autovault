import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { FormField, FormGroup } from "@/components/autovault/form";
import { DocumentForm } from "@/components/autovault/document-form";
import { PrimaryButton } from "@/components/autovault/buttons";
import { useGarage } from "@/hooks/use-garage";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { garageStore } from "@/lib/store";
import {
  docFieldsFrom,
  emptyDocForm,
  validateDocForm,
  type DocFormValue,
} from "@/lib/document-fields";

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

function AddDocumentPage() {
  const { vehicle } = useGarage();
  const navigate = useNavigate();
  const [form, setForm] = useState<DocFormValue>(emptyDocForm());
  const patchForm = (patch: Partial<DocFormValue>) => setForm((prev) => ({ ...prev, ...patch }));
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Add Document" />
        <NoVehicleEmptyState />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        back={{
          to: "/vehicle/$vehicleId",
          params: { vehicleId: vehicle.id },
          search: { tab: "glovebox" },
          label: "Glovebox",
        }}
        eyebrow={vehicle.nickname}
        title="Add Document"
      />

      <DocumentForm value={form} onChange={patchForm} />

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
            const error = validateDocForm(form);
            if (error) {
              toast.error(error);
              return;
            }
            const fields = docFieldsFrom(form);

            garageStore.addDoc({
              id: crypto.randomUUID(),
              vehicleId: vehicle.id,
              ...fields,
              hasFile: file !== null,
            });

            toast.success("Document saved", {
              description: `${fields.category} added to your glovebox.`,
            });
            void navigate({
              to: "/vehicle/$vehicleId",
              params: { vehicleId: vehicle.id },
              search: { tab: "glovebox" },
            });
          }}
        >
          Save Document
        </PrimaryButton>
      </div>
    </div>
  );
}
