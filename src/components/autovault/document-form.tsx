import { BadgeCheck, IdCard, LifeBuoy, ShoppingBag, type LucideIcon } from "lucide-react";
import { appIcons } from "@/lib/icons";
import { SectionHeader } from "@/components/autovault/page-header";
import { FormField, FormGroup, TextInput } from "@/components/autovault/form";
import { FieldRows } from "@/components/autovault/field-rows";
import { TilePicker } from "@/components/autovault/tile-picker";
import { configForCategory, docTypes, type DocFormValue } from "@/lib/document-fields";

const icons: Record<string, LucideIcon> = {
  Insurance: appIcons.insurance,
  PUC: appIcons.emissions,
  "Purchase Documents": ShoppingBag,
  "Registration (RC)": IdCard,
  "Roadside Assistance": LifeBuoy,
  "Service Invoices": appIcons.expense,
  Warranty: BadgeCheck,
  Other: appIcons.other,
};

/** Document type tiles plus the fields that type needs. */
export function DocumentForm({
  value,
  onChange,
}: {
  value: DocFormValue;
  onChange: (patch: Partial<DocFormValue>) => void;
}) {
  const config = configForCategory(value.category);
  const setDetail = (key: string, v: string) =>
    onChange({ details: { ...value.details, [key]: v } });

  return (
    <>
      <SectionHeader title="Type" />
      <TilePicker
        label="Document type"
        value={value.category}
        onChange={(category) => onChange({ category })}
        options={docTypes.map((type) => ({ label: type, icon: icons[type] ?? appIcons.document }))}
      />

      <div className="mt-7">
        <SectionHeader title="Details" />
        <FormGroup>
          {value.category === "Other" && (
            <FormField label="Name it">
              <TextInput
                value={value.customCategory}
                onChange={(customCategory) => onChange({ customCategory })}
                placeholder="e.g. Loan Papers"
              />
            </FormField>
          )}
          <FormField label={config.provider.label}>
            <TextInput
              value={value.issuer}
              onChange={(issuer) => onChange({ issuer })}
              placeholder={config.provider.placeholder}
            />
          </FormField>
          <FormField label={config.number.label}>
            <TextInput
              value={value.number}
              onChange={(number) => onChange({ number })}
              placeholder={config.number.placeholder}
            />
          </FormField>
          <FormField label={config.issued.label}>
            <TextInput
              value={value.issued}
              onChange={(issued) => onChange({ issued })}
              type="date"
            />
          </FormField>
          {config.expiry && (
            <FormField label={config.expiry.label}>
              <TextInput
                value={value.expiry}
                onChange={(expiry) => onChange({ expiry })}
                type="date"
              />
            </FormField>
          )}
          <FieldRows fields={config.extras} values={value.details} onChange={setDetail} />
        </FormGroup>
      </div>
    </>
  );
}
