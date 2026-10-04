import { daysUntil } from "@/lib/format";
import type { FieldSpec } from "@/lib/form-fields";
import type { Doc } from "@/types/autovault";

type DocTypeConfig = {
  provider: { label: string; placeholder: string };
  number: { label: string; placeholder: string };
  issued: { label: string };
  /** Missing means this kind of document doesn't expire. */
  expiry?: { label: string };
  extras: FieldSpec[];
};

const generic: DocTypeConfig = {
  provider: { label: "Provider", placeholder: "Issuing company" },
  number: { label: "Number", placeholder: "Reference number" },
  issued: { label: "Issued" },
  expiry: { label: "Expires" },
  extras: [],
};

const docTypeConfig: Record<string, DocTypeConfig> = {
  Insurance: {
    provider: { label: "Insurer", placeholder: "ICICI Lombard" },
    number: { label: "Policy no.", placeholder: "3005/AB/928471/26" },
    issued: { label: "Start date" },
    expiry: { label: "Valid till" },
    extras: [
      {
        key: "cover",
        label: "Cover",
        type: "chips",
        options: ["Comprehensive", "Third-party", "Own damage"],
      },
      { key: "premium", label: "Premium", type: "amount", placeholder: "12500" },
    ],
  },
  PUC: {
    provider: { label: "Test centre", placeholder: "Shell Petrol Pump" },
    number: { label: "Certificate no.", placeholder: "PUC/2026/0001" },
    issued: { label: "Tested on" },
    expiry: { label: "Valid till" },
    extras: [],
  },
  "Purchase Documents": {
    provider: { label: "Dealer", placeholder: "Dealership name" },
    number: { label: "Invoice no.", placeholder: "INV/2026/0042" },
    issued: { label: "Purchase date" },
    extras: [{ key: "price", label: "Price", type: "amount", placeholder: "850000" }],
  },
  "Registration (RC)": {
    provider: { label: "Issuing RTO", placeholder: "MH-02 Andheri RTO" },
    number: { label: "Registration no.", placeholder: "MH02AB1234" },
    issued: { label: "Registered on" },
    expiry: { label: "Valid till" },
    extras: [
      { key: "owner", label: "Owner", type: "text", placeholder: "Name on the RC" },
      { key: "chassis", label: "Chassis no.", type: "text" },
      { key: "engine", label: "Engine no.", type: "text" },
    ],
  },
  "Roadside Assistance": {
    provider: { label: "Provider", placeholder: "Tata Motors RSA" },
    number: { label: "Membership no.", placeholder: "RSA-123456" },
    issued: { label: "Starts" },
    expiry: { label: "Renews on" },
    extras: [{ key: "helpline", label: "Helpline", type: "text", placeholder: "1800 …" }],
  },
  "Service Invoices": {
    provider: { label: "Service centre", placeholder: "Honda Solitaire" },
    number: { label: "Invoice no.", placeholder: "SI/2026/0042" },
    issued: { label: "Invoice date" },
    extras: [{ key: "amount", label: "Amount", type: "amount", placeholder: "3200" }],
  },
  Warranty: {
    provider: { label: "Provider", placeholder: "Manufacturer or extended-warranty company" },
    number: { label: "Warranty no.", placeholder: "W-123456" },
    issued: { label: "Starts" },
    expiry: { label: "Ends" },
    extras: [
      { key: "covers", label: "Covers", type: "text", placeholder: "Engine, gearbox" },
      { key: "limit", label: "Distance limit", type: "text", placeholder: "1,00,000 km" },
    ],
  },
  Other: generic,
};

/** Alphabetical, with "Other" last. */
export const docTypes = [
  "Insurance",
  "PUC",
  "Purchase Documents",
  "Registration (RC)",
  "Roadside Assistance",
  "Service Invoices",
  "Warranty",
  "Other",
];

/** Config for a stored category; custom ("Other") names fall back to the generic one. */
export function configForCategory(category: string): DocTypeConfig {
  return docTypeConfig[category] ?? generic;
}

export type DocFormValue = {
  category: string;
  customCategory: string;
  issuer: string;
  number: string;
  issued: string;
  expiry: string;
  details: Record<string, string>;
};

export function emptyDocForm(category = docTypes[0]!): DocFormValue {
  return {
    category,
    customCategory: "",
    issuer: "",
    number: "",
    issued: "",
    expiry: "",
    details: {},
  };
}

export function docFormFrom(doc: Doc): DocFormValue {
  const known = docTypes.includes(doc.category);
  return {
    category: known ? doc.category : "Other",
    customCategory: known ? "" : doc.category,
    issuer: doc.issuer,
    number: doc.number,
    issued: doc.issued,
    expiry: doc.expiry ?? "",
    details: doc.details ?? {},
  };
}

function finalCategory(value: DocFormValue) {
  return value.category === "Other" && value.customCategory.trim()
    ? value.customCategory.trim()
    : value.category;
}

export function validateDocForm(value: DocFormValue) {
  const config = configForCategory(value.category);
  if (!value.issuer.trim() || !value.issued) {
    return `Enter the ${config.provider.label.toLowerCase()} and ${config.issued.label.toLowerCase()}`;
  }
  return null;
}

/** The Doc fields a form produces; only the current type's expiry and extras are kept. */
export function docFieldsFrom(value: DocFormValue) {
  const config = configForCategory(value.category);
  const category = finalCategory(value);
  const details = Object.fromEntries(
    config.extras.flatMap((e) => {
      const v = value.details[e.key]?.trim();
      return v ? [[e.key, v]] : [];
    }),
  );
  const expiry = config.expiry ? value.expiry : "";
  return {
    category,
    title: `${category} · ${value.issuer.trim()}`,
    issuer: value.issuer.trim(),
    number: value.number.trim(),
    issued: value.issued,
    ...(expiry && { expiry, daysLeft: daysUntil(expiry) }),
    ...(Object.keys(details).length > 0 && { details }),
  };
}
