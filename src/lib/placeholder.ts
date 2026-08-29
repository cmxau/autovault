export function vehiclePlaceholderImage(tint: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
    <rect width="640" height="360" fill="hsl(${tint})" />
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const KIND_TINTS: Record<string, string> = {
  car: "215 85% 55%",
  motorcycle: "24 92% 55%",
  scooter: "150 65% 42%",
};
