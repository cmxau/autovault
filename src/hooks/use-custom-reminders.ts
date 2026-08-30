import { useSyncExternalStore } from "react";

const KEY = "autovault-custom-reminders";

export type CustomReminder = {
  id: string;
  vehicleId: string;
  label: string;
  detail: string;
};

function read(): CustomReminder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CustomReminder[]) : [];
  } catch {
    return [];
  }
}

let state = read();
const listeners = new Set<() => void>();

function setState(next: CustomReminder[]) {
  state = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
  for (const listener of listeners) listener();
}

export function useCustomReminders(vehicleId: string) {
  const all = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => [] as CustomReminder[],
  );

  const add = (label: string, detail: string) => {
    setState([...state, { id: crypto.randomUUID(), vehicleId, label, detail }]);
  };

  const remove = (id: string) => {
    setState(state.filter((r) => r.id !== id));
  };

  const update = (id: string, label: string, detail: string) => {
    setState(state.map((r) => (r.id === id ? { ...r, label, detail } : r)));
  };

  return { items: all.filter((r) => r.vehicleId === vehicleId), add, remove, update };
}
