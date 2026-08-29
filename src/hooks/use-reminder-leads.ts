import { useCallback, useEffect, useState } from "react";

const KEY = "autovault-reminder-leads";

function read(): Record<string, number[]> {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, number[]>) : {};
  } catch {
    return {};
  }
}

export function useReminderLeads() {
  const [leads, setLeadsState] = useState<Record<string, number[]>>({});

  useEffect(() => setLeadsState(read()), []);

  const toggle = useCallback((id: string, days: number) => {
    setLeadsState((prev) => {
      const current = prev[id] ?? [30, 7];
      const next = current.includes(days) ? current.filter((d) => d !== days) : [...current, days];
      const nextState = { ...prev, [id]: next };
      window.localStorage.setItem(KEY, JSON.stringify(nextState));
      return nextState;
    });
  }, []);

  const forId = useCallback((id: string) => leads[id] ?? [30, 7], [leads]);

  return { forId, toggle };
}
