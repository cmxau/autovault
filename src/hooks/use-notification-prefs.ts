import { useCallback, useEffect, useState } from "react";

const KEY = "autovault-notification-prefs";

type Prefs = { serviceReminders: boolean; expiryReminders: boolean };

const defaults: Prefs = { serviceReminders: true, expiryReminders: true };

function read(): Prefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<Prefs>) } : defaults;
  } catch {
    return defaults;
  }
}

export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<Prefs>(defaults);

  useEffect(() => setPrefs(read()), []);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      window.localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return {
    serviceReminders: prefs.serviceReminders,
    expiryReminders: prefs.expiryReminders,
    setServiceReminders: (value: boolean) => update({ serviceReminders: value }),
    setExpiryReminders: (value: boolean) => update({ expiryReminders: value }),
  };
}
