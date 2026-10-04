import { FormField, InlineChips, TextInput } from "@/components/autovault/form";
import type { FieldSpec } from "@/lib/form-fields";
import { currencySymbol } from "@/lib/units";

/** Renders FieldSpecs as rows of a FormGroup. */
export function FieldRows({
  fields,
  values,
  onChange,
}: {
  fields: FieldSpec[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <>
      {fields.map((field) => {
        const value = values[field.key] ?? "";
        const set = (v: string) => onChange(field.key, v);
        if (field.type === "chips") {
          return (
            <InlineChips
              key={field.key}
              label={field.label}
              options={field.options}
              value={value}
              onChange={set}
            />
          );
        }
        return (
          <FormField key={field.key} label={field.label}>
            <TextInput
              value={value}
              onChange={set}
              type={field.type === "date" ? "date" : "text"}
              {...(field.type === "amount" ? { numeric: true, suffix: currencySymbol("INR") } : {})}
              {...(field.type !== "date" && field.placeholder
                ? { placeholder: field.placeholder }
                : {})}
            />
          </FormField>
        );
      })}
    </>
  );
}
