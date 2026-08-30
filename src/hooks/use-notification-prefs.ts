import { useCallback, useEffect, useState } from "react";

const KEY = "autovault-notification-prefs";

type Prefs = { serviceReminders: boolean; expiryReminders: boolean; pushEnabled: boolean };

const defaults: Prefs = { serviceReminders: true, expiryReminders: true, pushEnabled: false };

function read(): Prefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<Prefs>) } : defaults;
  } catch {
    return defaults;
  }
}

export function readNotificationPrefs(): Prefs {
  if (typeof window === "undefined") return defaults;
  return read();
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

  /** Must be called from a user gesture (e.g. a toggle's onChange). */
  const setPushEnabled = useCallback(
    async (value: boolean) => {
      if (!value) {
        update({ pushEnabled: false });
        return;
      }
      if (typeof Notification === "undefined") {
        update({ pushEnabled: false });
        return;
      }
      const permission =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;
      update({ pushEnabled: permission === "granted" });
    },
    [update],
  );

  return {
    serviceReminders: prefs.serviceReminders,
    expiryReminders: prefs.expiryReminders,
    pushEnabled: prefs.pushEnabled,
    setServiceReminders: (value: boolean) => update({ serviceReminders: value }),
    setExpiryReminders: (value: boolean) => update({ expiryReminders: value }),
    setPushEnabled,
  };
}
