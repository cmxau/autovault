import { useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/autovault/page-header";
import { DocumentForm } from "@/components/autovault/document-form";
import { PrimaryButton } from "@/components/autovault/buttons";
import { garageStore } from "@/lib/store";
import {
  docFieldsFrom,
  docFormFrom,
  validateDocForm,
  type DocFormValue,
} from "@/lib/document-fields";

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

function EditDocumentPage() {
  const { doc } = Route.useLoaderData();
  const navigate = useNavigate();
  const [form, setForm] = useState<DocFormValue>(() => docFormFrom(doc));
  const patchForm = (patch: Partial<DocFormValue>) => setForm((prev) => ({ ...prev, ...patch }));

  return (
    <div>
      <PageHeader back={{ to: `/glovebox/${doc.id}`, label: "Document" }} title="Edit Document" />

      <DocumentForm value={form} onChange={patchForm} />

      <div className="mt-8">
        <PrimaryButton
          onClick={() => {
            const error = validateDocForm(form);
            if (error) {
              toast.error(error);
              return;
            }

            // Rebuild the doc so an expiry or extras the new type doesn't use are dropped.
            const { expiry: _expiry, daysLeft: _daysLeft, details: _details, ...base } = doc;
            garageStore.setDocs(
              garageStore
                .getState()
                .docs.map((d) => (d.id === doc.id ? { ...base, ...docFieldsFrom(form) } : d)),
            );

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
