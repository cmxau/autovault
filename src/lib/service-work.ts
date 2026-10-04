/** The work items a service record can tick off, grouped for the picker. */
export const workGroups = [
  { title: "Engine & fluids", items: ["Engine oil", "Oil filter", "Air filter"] },
  {
    title: "Brakes & tyres",
    items: [
      "Brake pads",
      "Tyres",
      "Tyre puncture repair",
      "Tyre air pressure top-up",
      "Wheel alignment",
    ],
  },
  { title: "Electrical & drive", items: ["Battery", "Chain maintenance"] },
];

export const workLabels = workGroups.flatMap((g) => g.items);

/** Commas separate items in the saved note, so they can't be part of a name. */
export function cleanWorkName(raw: string) {
  return raw.replace(/,/g, " ").replace(/\s+/g, " ").trim();
}
