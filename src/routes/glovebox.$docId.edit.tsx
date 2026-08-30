import { useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { FormField, FormGroup, TextInput, ChipGroup } from "@/components/autovault/form";
import { PrimaryButton } from "@/components/autovault/buttons";
import { garageStore } from "@/lib/store";
import { daysUntil } from "@/lib/format";

export const Route = createFileRoute("/glovebox/$docId/edit")({
  head: () => ({
    meta: [{ title: "Edit Document · AutoVault" }, { name: "robots", content: "noindex" }],
  }),
  loader: ({ params }) => {
    const doc = garageStore.getState().docs.find((d) => d.id === params.docId);
    if (!doc) throw notFound();
    return { doc };
  },
  component: EditDocumentPage,
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

function EditDocumentPage() {
  const { doc } = Route.useLoaderData();
  const navigate = useNavigate();
  const [category, setCategory] = useState(doc.category);
  const [issuer, setIssuer] = useState(doc.issuer);
  const [number, setNumber] = useState(doc.number);
  const [issued, setIssued] = useState(doc.issued);
  const [expiry, setExpiry] = useState(doc.expiry ?? "");

  return (
    <div>
      <PageHeader back={{ to: `/glovebox/${doc.id}`, label: "Document" }} title="Edit Document" />

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

      <div className="mt-8">
        <PrimaryButton
          onClick={() => {
            if (!issuer || !issued) {
              toast.error("Enter a provider name and issue date");
              return;
            }

            garageStore.updateDoc(doc.id, {
              category,
              title: `${category} · ${issuer}`,
              issuer,
              number,
              issued,
              ...(expiry && { expiry, daysLeft: daysUntil(expiry) }),
            });

            toast.success("Document updated");
            void navigate({ to: "/glovebox/$docId", params: { docId: doc.id } });
          }}
        >
          Save Changes
        </PrimaryButton>
      </div>
    </div>
  );
}
