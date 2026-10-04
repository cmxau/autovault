import { useSyncExternalStore } from "react";

const KEY = "autovault-custom-reminders";

/** `date` is YYYY-MM-DD: the yearly due day (month/day) or the start of an every-N-days cycle. */
export type Repeat =
  { kind: "yearly"; date: string } | { kind: "days"; date: string; every: number };

type CustomReminder = {
  id: string;
  vehicleId: string;
  label: string;
  detail: string;
  repeat?: Repeat;
};

const DAY = 86_400_000;

function parse(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return { y: y!, m: m! - 1, d: d! };
}

/** Next due date (local midnight) on or after `now`, or null if the reminder doesn't repeat. */
export function nextDue(repeat: Repeat | undefined, now: Date): Date | null {
  if (!repeat) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const { y, m, d } = parse(repeat.date);
  if (repeat.kind === "yearly") {
    const due = new Date(today.getFullYear(), m, d);
    return due < today ? new Date(today.getFullYear() + 1, m, d) : due;
  }
  const start = new Date(y, m, d);
  if (start >= today) return start;
  const elapsed = Math.round((today.getTime() - start.getTime()) / DAY);
  return new Date(start.getTime() + Math.ceil(elapsed / repeat.every) * repeat.every * DAY);
}

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

  const add = (label: string, detail: string, repeat?: Repeat) => {
    setState([
      ...state,
      { id: crypto.randomUUID(), vehicleId, label, detail, ...(repeat && { repeat }) },
    ]);
  };

  const remove = (id: string) => {
    setState(state.filter((r) => r.id !== id));
  };

  const update = (id: string, label: string, detail: string, repeat?: Repeat) => {
    setState(
      state.map((r) => {
        if (r.id !== id) return r;
        const { repeat: _old, ...rest } = r;
        return { ...rest, label, detail, ...(repeat && { repeat }) };
      }),
    );
  };

  return { items: all.filter((r) => r.vehicleId === vehicleId), add, remove, update };
}
