import { useEffect } from "react";
import { garageStore } from "@/lib/store";
import { readNotificationPrefs } from "@/hooks/use-notification-prefs";
import { computeServiceStatus, computeChecklistStatus } from "@/lib/analytics";

const CHECKED_KEY = "autovault-notif-last-checked";
const NOTIFIED_KEY = "autovault-notif-sent";
/** Don't re-notify for the same item within this window, even if still due. */
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

type NotifiedLog = Record<string, string>;

function readLog(): NotifiedLog {
  try {
    const raw = window.localStorage.getItem(NOTIFIED_KEY);
    return raw ? (JSON.parse(raw) as NotifiedLog) : {};
  } catch {
    return {};
  }
}

function writeLog(log: NotifiedLog) {
  window.localStorage.setItem(NOTIFIED_KEY, JSON.stringify(log));
}

function recentlyNotified(log: NotifiedLog, id: string) {
  const at = log[id];
  return at ? Date.now() - new Date(at).getTime() < COOLDOWN_MS : false;
}

async function notify(title: string, body: string) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: title,
  });
}

/**
 * Runs once per app load. Fires real OS notifications (via the service
 * worker) for anything overdue or due very soon, so users see them even
 * with the tab closed on a subsequent check. Requires the user to have
 * already granted permission (Settings → Notifications → Push notifications).
 */
export function useReminderNotifications() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyCheckedThisLoad = window.sessionStorage.getItem(CHECKED_KEY);
    if (alreadyCheckedThisLoad) return;
    window.sessionStorage.setItem(CHECKED_KEY, "1");

    const prefs = readNotificationPrefs();
    if (!prefs.pushEnabled) return;
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

    void (async () => {
      const { vehicles, docs, checklist } = garageStore.getState();
      const log = readLog();
      let changed = false;

      for (const vehicle of vehicles) {
        if (prefs.serviceReminders) {
          const service = computeServiceStatus(vehicle);
          if (service.status === "urgent" || service.status === "warn") {
            const id = `service-${vehicle.id}`;
            if (!recentlyNotified(log, id)) {
              await notify(`${vehicle.nickname}: service due`, service.detail);
              log[id] = new Date().toISOString();
              changed = true;
            }
          }
        }

        if (prefs.expiryReminders) {
          for (const doc of docs.filter((d) => d.vehicleId === vehicle.id && d.expiry)) {
            const urgent = doc.daysLeft !== undefined && doc.daysLeft <= 30;
            if (urgent) {
              const id = `doc-${doc.id}`;
              if (!recentlyNotified(log, id)) {
                const body =
                  doc.daysLeft !== undefined && doc.daysLeft < 0
                    ? `Expired ${doc.expiry}`
                    : `Expires ${doc.expiry}`;
                await notify(`${vehicle.nickname}: ${doc.category} expiring`, body);
                log[id] = new Date().toISOString();
                changed = true;
              }
            }
          }
        }

        for (const item of checklist.filter((c) => c.vehicleId === vehicle.id)) {
          const status = computeChecklistStatus(item, vehicle).status;
          if (status === "urgent" || status === "warn") {
            const id = `checklist-${item.id}`;
            if (!recentlyNotified(log, id)) {
              await notify(
                `${vehicle.nickname}: ${item.label} due`,
                computeChecklistStatus(item, vehicle).detail,
              );
              log[id] = new Date().toISOString();
              changed = true;
            }
          }
        }
      }

      if (changed) writeLog(log);
    })();
  }, []);
}
