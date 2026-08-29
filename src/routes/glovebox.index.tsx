import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BriefcaseBusiness, Plus, Lock } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { Row, RowGroup } from "@/components/autovault/row";
import { EmptyState } from "@/components/autovault/empty-state";
import { PrimaryButton } from "@/components/autovault/buttons";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { useGarage } from "@/hooks/use-garage";
import { useDocs } from "@/hooks/use-garage-data";
import type { Status } from "@/types/autovault";

export const Route = createFileRoute("/glovebox/")({
  head: () => ({
    meta: [
      { title: "Glovebox — AutoVault" },
      {
        name: "description",
        content:
          "A secure digital glovebox for your RC, insurance, PUC, warranty and service invoices — kept on your device.",
      },
      { property: "og:title", content: "Glovebox — AutoVault" },
      {
        property: "og:description",
        content: "Registration, insurance, PUC and invoices stored privately with your vehicle.",
      },
    ],
  }),
  component: GloveboxPage,
});

function docStatus(daysLeft?: number): Status {
  if (daysLeft === undefined) return "unknown";
  if (daysLeft < 0) return "urgent";
  if (daysLeft <= 45) return "warn";
  return "ok";
}

const order = [
  "Registration (RC)",
  "Insurance",
  "PUC",
  "Warranty",
  "Roadside Assistance",
  "Service Invoices",
  "Purchase Documents",
  "Other",
];

function GloveboxPage() {
  const { vehicle } = useGarage();
  const docs = useDocs();
  const navigate = useNavigate();

  if (!vehicle) {
    return (
      <div>
        <PageHeader title="Glovebox" />
        <NoVehicleEmptyState />
      </div>
    );
  }

  const list = docs.filter((d) => d.vehicleId === vehicle.id);

  const grouped = order
    .map((category) => ({ category, items: list.filter((d) => d.category === category) }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <PageHeader
        eyebrow={vehicle.nickname}
        title="Glovebox"
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5" strokeWidth={1.8} />
            Stored locally on this device
          </span>
        }
        action={
          <Link
            to="/glovebox/new"
            className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[14px] font-medium text-primary"
          >
            <Plus className="size-4" strokeWidth={2.2} />
            Add
          </Link>
        }
      />

      {grouped.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title="Your glovebox is empty."
          description="Keep your RC, insurance, PUC and service documents securely with your vehicle."
          action={
            <PrimaryButton onClick={() => void navigate({ to: "/glovebox/new" })}>
              Add Document
            </PrimaryButton>
          }
        />
      ) : (
        <div className="space-y-7">
          {grouped.map((group) => (
            <section key={group.category}>
              <SectionHeader title={group.category} />
              <RowGroup>
                {group.items.map((doc) => (
                  <Row
                    key={doc.id}
                    title={doc.issuer}
                    status={docStatus(doc.daysLeft)}
                    detail={
                      doc.expiry
                        ? doc.daysLeft !== undefined && doc.daysLeft < 0
                          ? `Expired ${doc.expiry}`
                          : `Expires ${doc.expiry} · ${doc.daysLeft} days remaining`
                        : `Issued ${doc.issued}`
                    }
                    trailing={doc.hasFile ? "PDF" : "No file"}
                    to="/glovebox/$docId"
                    params={{ docId: doc.id }}
                  />
                ))}
              </RowGroup>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
