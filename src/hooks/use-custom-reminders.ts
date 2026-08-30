import { useCallback, useEffect, useState } from "react";

const KEY = "autovault-custom-reminders";

export type CustomReminder = {
  id: string;
  vehicleId: string;
  label: string;
  detail: string;
};

function read(): CustomReminder[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CustomReminder[]) : [];
  } catch {
    return [];
  }
}

function write(items: CustomReminder[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function useCustomReminders(vehicleId: string) {
  const [all, setAll] = useState<CustomReminder[]>([]);

  useEffect(() => setAll(read()), []);

  const add = useCallback(
    (label: string, detail: string) => {
      setAll((prev) => {
        const next = [...prev, { id: crypto.randomUUID(), vehicleId, label, detail }];
        write(next);
        return next;
      });
    },
    [vehicleId],
  );

  const remove = useCallback((id: string) => {
    setAll((prev) => {
      const next = prev.filter((r) => r.id !== id);
      write(next);
      return next;
    });
  }, []);

  const update = useCallback((id: string, label: string, detail: string) => {
    setAll((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, label, detail } : r));
      write(next);
      return next;
    });
  }, []);

  return { items: all.filter((r) => r.vehicleId === vehicleId), add, remove, update };
}
