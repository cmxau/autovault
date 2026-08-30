export type DistanceSystem = "metric" | "imperial";
export type Currency = "INR" | "USD" | "EUR" | "GBP";

const KM_PER_MILE = 1.609344;
const LITRES_PER_GALLON = 3.78541;

export function kmToDisplay(km: number, system: DistanceSystem) {
  return system === "imperial" ? km / KM_PER_MILE : km;
}

export function displayToKm(value: number, system: DistanceSystem) {
  return system === "imperial" ? value * KM_PER_MILE : value;
}

export function litresToDisplay(litres: number, system: DistanceSystem) {
  return system === "imperial" ? litres / LITRES_PER_GALLON : litres;
}

export function displayToLitres(value: number, system: DistanceSystem) {
  return system === "imperial" ? value * LITRES_PER_GALLON : value;
}

export function distanceUnitLabel(system: DistanceSystem) {
  return system === "imperial" ? "mi" : "km";
}

export function volumeUnitLabel(system: DistanceSystem) {
  return system === "imperial" ? "gal" : "L";
}

export function mileageUnitLabel(system: DistanceSystem) {
  return system === "imperial" ? "mi/gal" : "km/L";
}

export function formatDistance(km: number, system: DistanceSystem) {
  const v = kmToDisplay(km, system);
  return `${Math.round(v).toLocaleString("en-IN")} ${distanceUnitLabel(system)}`;
}

export function formatVolume(litres: number, system: DistanceSystem) {
  const v = litresToDisplay(litres, system);
  return `${v.toFixed(2).replace(/\.00$/, "")} ${volumeUnitLabel(system)}`;
}

export function formatMileage(kmPerLitre: number, system: DistanceSystem) {
  const v = system === "imperial" ? kmPerLitre * (LITRES_PER_GALLON / KM_PER_MILE) : kmPerLitre;
  return `${v.toFixed(1)} ${mileageUnitLabel(system)}`;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

export function currencySymbol(currency: Currency) {
  return CURRENCY_SYMBOLS[currency];
}

/**
 * All amounts are entered and stored in INR; there is no per-entry currency,
 * and no live exchange rate API (this app makes no network calls). These are
 * fixed, approximate rates set at build time, not real-time FX. Selecting a
 * different display currency converts INR amounts for viewing only; it does
 * not change what you type into a form.
 */
const FIXED_INR_RATES: Record<Currency, number> = {
  INR: 1,
  USD: 1 / 83,
  EUR: 1 / 90,
  GBP: 1 / 105,
};

export function convertFromInr(amountInr: number, currency: Currency) {
  return amountInr * FIXED_INR_RATES[currency];
}

export function formatCostPerDistance(
  costPerKmInr: number,
  system: DistanceSystem,
  currency: Currency,
) {
  const perUnit = system === "imperial" ? costPerKmInr * KM_PER_MILE : costPerKmInr;
  return `${formatMoney(perUnit, currency, { decimals: 2 })}/${distanceUnitLabel(system)}`;
}

export function formatMoney(
  amountInr: number,
  currency: Currency,
  opts: { decimals?: number } = {},
) {
  const converted = convertFromInr(amountInr, currency);
  return `${currencySymbol(currency)}${converted.toLocaleString("en-IN", {
    minimumFractionDigits: opts.decimals ?? 0,
    maximumFractionDigits: opts.decimals ?? 0,
  })}`;
}
