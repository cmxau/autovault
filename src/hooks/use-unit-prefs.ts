import { useSyncExternalStore } from "react";
import type { Currency, DistanceSystem } from "@/lib/units";

const KEY = "autovault-unit-prefs";

type UnitPrefs = { system: DistanceSystem; currency: Currency };

const defaults: UnitPrefs = { system: "metric", currency: "INR" };

function readPrefs(): UnitPrefs {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<UnitPrefs>) } : defaults;
  } catch {
    return defaults;
  }
}

let state = readPrefs();
const listeners = new Set<() => void>();

function setState(next: UnitPrefs) {
  state = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(state));
  for (const listener of listeners) listener();
}

export const unitPrefsStore = {
  getState: () => state,
  getServerState: () => defaults,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setSystem(system: DistanceSystem) {
    setState({ ...state, system });
  },
  setCurrency(currency: Currency) {
    setState({ ...state, currency });
  },
};

export function useUnitPrefs() {
  const prefs = useSyncExternalStore(
    unitPrefsStore.subscribe,
    unitPrefsStore.getState,
    unitPrefsStore.getServerState,
  );
  return {
    system: prefs.system,
    currency: prefs.currency,
    setSystem: unitPrefsStore.setSystem,
    setCurrency: unitPrefsStore.setCurrency,
  };
}
