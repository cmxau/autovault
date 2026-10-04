import type { FieldSpec } from "@/lib/form-fields";

/** Extra form fields per expense category. Values are stored in the entry's note as "Label: value". */
type ExpenseCategoryConfig = {
  amountLabel: string;
  amountPlaceholder: string;
  notesPlaceholder: string;
  /** Show an optional odometer field, saved on the entry itself. */
  odometer?: boolean;
  fields: FieldSpec[];
};

export const expenseCategoryConfig: Record<string, ExpenseCategoryConfig> = {
  Accessories: {
    amountLabel: "Price",
    amountPlaceholder: "2500",
    notesPlaceholder: "Warranty, fitment details",
    fields: [
      { key: "item", label: "Item", type: "text", placeholder: "Seat covers" },
      { key: "store", label: "Bought from", type: "text", placeholder: "Amazon" },
    ],
  },
  Insurance: {
    amountLabel: "Premium",
    amountPlaceholder: "12500",
    notesPlaceholder: "Add-ons, NCB",
    fields: [
      { key: "insurer", label: "Insurer", type: "text", placeholder: "HDFC Ergo" },
      {
        key: "policyType",
        label: "Cover",
        type: "chips",
        options: ["Comprehensive", "Third-party", "Own damage"],
      },
      { key: "policyNo", label: "Policy no.", type: "text", placeholder: "P/123456" },
      { key: "validTill", label: "Valid till", type: "date" },
    ],
  },
  Parking: {
    amountLabel: "Fee",
    amountPlaceholder: "60",
    notesPlaceholder: "-",
    fields: [
      { key: "location", label: "Location", type: "text", placeholder: "Phoenix Mall" },
      {
        key: "parkingType",
        label: "Type",
        type: "chips",
        options: ["Hourly", "Daily", "Monthly pass"],
      },
    ],
  },
  PUC: {
    amountLabel: "Fee",
    amountPlaceholder: "100",
    notesPlaceholder: "-",
    fields: [
      { key: "centre", label: "Test centre", type: "text", placeholder: "Shell Petrol Pump" },
      { key: "certNo", label: "Certificate no.", type: "text", placeholder: "PUC/2026/0001" },
      { key: "validTill", label: "Valid till", type: "date" },
    ],
  },
  Repairs: {
    amountLabel: "Total cost",
    amountPlaceholder: "4200",
    notesPlaceholder: "Warranty on the repair, parts used",
    odometer: true,
    fields: [
      { key: "repair", label: "Repair", type: "text", placeholder: "Clutch cable replacement" },
      { key: "workshop", label: "Workshop", type: "text", placeholder: "Local garage" },
    ],
  },
  Tolls: {
    amountLabel: "Amount",
    amountPlaceholder: "250",
    notesPlaceholder: "FASTag recharge",
    fields: [
      { key: "plaza", label: "Plaza / route", type: "text", placeholder: "Mumbai–Pune Expressway" },
      {
        key: "paidVia",
        label: "Paid via",
        type: "chips",
        options: ["FASTag", "Cash", "Card / UPI"],
      },
    ],
  },
  Other: {
    amountLabel: "Amount",
    amountPlaceholder: "1500",
    notesPlaceholder: "What was this for?",
    fields: [],
  },
};

const SEP = " · ";

/** Parts of a note that belong to a field, and whatever free-text notes are left over. */
export function parseExpenseNote(category: string, note: string | undefined) {
  const values: Record<string, string> = {};
  const rest: string[] = [];
  const fields = expenseCategoryConfig[category]?.fields ?? [];
  for (const part of note?.split(SEP) ?? []) {
    const field = fields.find((f) => part.startsWith(`${f.label}: `));
    if (field) values[field.key] = part.slice(field.label.length + 2);
    else if (part) rest.push(part);
  }
  return { values, notes: rest.join(SEP) };
}

export function composeExpenseNote(
  category: string,
  values: Record<string, string>,
  notes: string,
) {
  const fields = expenseCategoryConfig[category]?.fields ?? [];
  return [
    ...fields.flatMap((f) => {
      const value = values[f.key]?.replace(SEP, " ").trim();
      return value ? [`${f.label}: ${value}`] : [];
    }),
    notes.replace(SEP, " ").trim(),
  ]
    .filter(Boolean)
    .join(SEP);
}
