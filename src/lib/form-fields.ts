/** A data-driven form field, shared by the per-category expense and per-type document forms. */
export type FieldSpec =
  | { key: string; label: string; type: "text"; placeholder?: string }
  | { key: string; label: string; type: "date" }
  | { key: string; label: string; type: "amount"; placeholder?: string }
  | { key: string; label: string; type: "chips"; options: string[] };
