import { useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { FormField, FormGroup, TextInput } from "@/components/autovault/form";
import { Row, RowGroup } from "@/components/autovault/row";
import { BottomSheet } from "@/components/autovault/bottom-sheet";
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
  const isKnownCategory = categories.includes(doc.category);
  const [category, setCategory] = useState(isKnownCategory ? doc.category : "Other");
  const [customCategory, setCustomCategory] = useState(isKnownCategory ? "" : doc.category);
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [issuer, setIssuer] = useState(doc.issuer);
  const [number, setNumber] = useState(doc.number);
  const [issued, setIssued] = useState(doc.issued);
  const [expiry, setExpiry] = useState(doc.expiry ?? "");

  return (
    <div>
      <PageHeader back={{ to: `/glovebox/${doc.id}`, label: "Document" }} title="Edit Document" />

      <SectionHeader title="Type" />
      <RowGroup>
        <Row
          title="Document type"
          trailing={category === "Other" && customCategory.trim() ? customCategory : category}
          onClick={() => setTypeSheetOpen(true)}
        />
      </RowGroup>
      {category === "Other" && (
        <div className="mt-3">
          <FormGroup>
            <FormField label="Name it">
              <TextInput
                value={customCategory}
                onChange={setCustomCategory}
                placeholder="e.g. Loan Papers"
              />
            </FormField>
          </FormGroup>
        </div>
      )}

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

            const finalCategory =
              category === "Other" && customCategory.trim() ? customCategory.trim() : category;

            garageStore.updateDoc(doc.id, {
              category: finalCategory,
              title: `${finalCategory} · ${issuer}`,
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

      <BottomSheet
        open={typeSheetOpen}
        onClose={() => setTypeSheetOpen(false)}
        title="Document type"
      >
        <div className="flex flex-col gap-1.5">
          {categories.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setCategory(option);
                setTypeSheetOpen(false);
              }}
              className="focus-ring flex min-h-[52px] items-center justify-between rounded-[14px] px-3.5 text-left transition-colors hover:bg-foreground/[0.05]"
            >
              <span className="text-[15px]">{option}</span>
              {category === option && (
                <Check className="size-[18px] text-primary" strokeWidth={2.2} />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
