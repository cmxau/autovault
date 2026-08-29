import { useRef } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { FileText, Lock, Eye, RefreshCw, PencilLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { Row, RowGroup } from "@/components/autovault/row";
import { garageStore } from "@/lib/store";
import { useDocs } from "@/hooks/use-garage-data";

export const Route = createFileRoute("/glovebox/$docId")({
  head: () => ({
    meta: [
      { title: "Document — AutoVault" },
      {
        name: "description",
        content:
          "Provider, policy number, issue and expiry details for a document in your glovebox.",
      },
      { property: "og:title", content: "Document — AutoVault" },
      {
        property: "og:description",
        content: "Vehicle document details kept privately on your device.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ params }) => {
    const doc = garageStore.getState().docs.find((d) => d.id === params.docId);
    if (!doc) throw notFound();
    return { doc };
  },
  component: DocumentPage,
});

function DocumentPage() {
  const { doc: initialDoc } = Route.useLoaderData();
  const docs = useDocs();
  const doc = docs.find((d) => d.id === initialDoc.id) ?? initialDoc;
  const navigate = useNavigate();
  const replaceInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <PageHeader
        back={{ to: "/glovebox", label: "Glovebox" }}
        eyebrow={doc.category}
        title={doc.issuer}
        subtitle={doc.expiry ? `Expires ${doc.expiry}` : `Issued ${doc.issued}`}
      />

      <div className="surface-tinted flex aspect-[4/3] max-h-[320px] items-center justify-center rounded-[25px]">
        <div className="text-center">
          <FileText className="mx-auto size-7 text-muted-foreground/60" strokeWidth={1.25} />
          <p className="mt-3 text-[13.5px] text-muted-foreground">
            {doc.hasFile ? `${doc.title}.pdf` : "No file attached yet"}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <SectionHeader title="Details" />
        <RowGroup>
          <Row title="Provider" trailing={doc.issuer} />
          <Row title="Number" trailing={doc.number} />
          <Row title="Issue date" trailing={doc.issued} />
          {doc.expiry && (
            <Row
              title="Expiry date"
              trailing={`${doc.expiry}${doc.daysLeft !== undefined && doc.daysLeft >= 0 ? ` · ${doc.daysLeft} days` : ""}`}
            />
          )}
        </RowGroup>
      </section>

      <section className="mt-8">
        <SectionHeader title="Actions" />
        <RowGroup>
          <Row
            icon={Eye}
            title="View document"
            onClick={() =>
              doc.hasFile
                ? toast("Opening document", { description: "Rendered from local storage." })
                : toast("No file attached", { description: "Replace file to add one." })
            }
          />
          <Row
            icon={RefreshCw}
            title="Replace file"
            onClick={() => replaceInputRef.current?.click()}
          />
          <input
            ref={replaceInputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => {
              if (!e.target.files?.[0]) return;
              garageStore.updateDoc(doc.id, { hasFile: true });
              toast.success("File attached");
              e.target.value = "";
            }}
          />
          <Row
            icon={PencilLine}
            title="Edit details"
            to="/glovebox/$docId/edit"
            params={{ docId: doc.id }}
          />
          <Row
            icon={Trash2}
            title="Delete document"
            onClick={() => {
              garageStore.deleteDoc(doc.id);
              toast.success("Document deleted", { description: "Removed from this device." });
              void navigate({ to: "/glovebox" });
            }}
            className="text-urgent"
          />
        </RowGroup>
      </section>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-[12.5px] text-muted-foreground">
        <Lock className="size-3.5" strokeWidth={1.8} />
        Stored locally on this device
      </p>
    </div>
  );
}
