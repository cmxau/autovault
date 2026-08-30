import { useSyncExternalStore } from "react";

const KEY = "autovault-reminder-leads";

function read(): Record<string, number[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, number[]>) : {};
  } catch {
    return {};
  }
}

let state = read();
const listeners = new Set<() => void>();

function setState(next: Record<string, number[]>) {
  state = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
  for (const listener of listeners) listener();
}

export function useReminderLeads() {
  const leads = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => ({}) as Record<string, number[]>,
  );

  const toggle = (id: string, days: number) => {
    const current = state[id] ?? [30, 7];
    const next = current.includes(days) ? current.filter((d) => d !== days) : [...current, days];
    setState({ ...state, [id]: next });
  };

  const forId = (id: string) => leads[id] ?? [30, 7];

  return { forId, toggle };
}
