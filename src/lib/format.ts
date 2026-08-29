export const greeting = (d = new Date(), name = "") => {
  const h = d.getHours();
  const base =
    h < 5
      ? "Good night"
      : h < 12
        ? "Good morning"
        : h < 17
          ? "Good afternoon"
          : h < 21
            ? "Good evening"
            : "Good night";
  return name ? `${base}, ${name}` : base;
};

export const daysUntil = (dateStr: string, from = new Date()) => {
  const ms = new Date(dateStr).getTime() - new Date(from.toDateString()).getTime();
  return Math.round(ms / 86_400_000);
};

export const monthsUntil = (dateStr: string, from = new Date()): number | null => {
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  let months =
    (target.getFullYear() - from.getFullYear()) * 12 + (target.getMonth() - from.getMonth());
  if (target.getDate() < from.getDate()) months -= 1;
  return months;
};

export const maskReg = (reg: string) => {
  const parts = reg.split(" ");
  if (parts.length < 4) return reg;
  return `${parts[0]} •• •• ${parts[3]}`;
};
