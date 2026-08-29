import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { ChipGroup, FormField, FormGroup, TextInput } from "@/components/autovault/form";
import { PrimaryButton } from "@/components/autovault/buttons";
import { useGarage } from "@/hooks/use-garage";
import { NoVehicleEmptyState } from "@/components/autovault/no-vehicle";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { currencySymbol } from "@/lib/units";
import { garageStore } from "@/lib/store";

export const Route = createFileRoute("/add/expense")({
  head: () => ({
    meta: [
      { title: "Add Expense — AutoVault" },
      {
        name: "description",
        content: "Record tolls, parking, repairs, accessories and other vehicle costs.",
      },
      { property: "og:title", content: "Add Expense — AutoVault" },
      { property: "og:description", content: "Track what your vehicle actually costs to run." },
    ],
  }),
  component: AddExpensePage,
});

const categories = [
  "Fuel",
  "Service",
  "Insurance",
  "PUC",
  "Tolls",
  "Parking",
  "Repairs",
  "Accessories",
  "Other",
];

function AddExpensePage() {
  const { vehicle } = useGarage();
  const { currency } = useUnitPrefs();
  const money = currencySymbol(currency);
  const navigate = useNavigate();
  const [category, setCategory] = useState("Tolls");
  const [date, setDate] = useState("2026-08-05");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-[520px]">
        <PageHeader
          back={{ to: "/insights", label: "Insights" }}
          title="Add Expense"
          className="mb-6"
        />
        <NoVehicleEmptyState description="Add a vehicle before logging an expense." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[520px]">
      <PageHeader
        back={{ to: "/insights", label: "Insights" }}
        eyebrow={vehicle.nickname}
        title="Add Expense"
        className="mb-6"
      />

      <SectionHeader title="Category" />
      <ChipGroup options={categories} selected={[category]} onToggle={setCategory} />

      <div className="mt-7">
        <FormGroup>
          <FormField label="Date">
            <TextInput value={date} onChange={setDate} type="date" />
          </FormField>
          <FormField label="Amount">
            <TextInput
              value={amount}
              onChange={setAmount}
              numeric
              suffix={money}
              placeholder="1500"
            />
          </FormField>
          <FormField label="Notes">
            <TextInput value={notes} onChange={setNotes} placeholder="FASTag recharge" />
          </FormField>
        </FormGroup>
      </div>

      <div className="mt-8">
        <PrimaryButton
          onClick={() => {
            const amountNum = Number(amount);
            if (!amountNum) {
              toast.error("Enter an amount");
              return;
            }

            garageStore.addTimelineEntry({
              id: crypto.randomUUID(),
              vehicleId: vehicle.id,
              kind: "expense",
              title: category,
              date,
              amount: amountNum,
              ...(notes && { note: notes }),
            });

            toast.success("Expense saved", { description: `${category} recorded.` });
            void navigate({ to: "/insights" });
          }}
        >
          Save Expense
        </PrimaryButton>
      </div>
    </div>
  );
}
