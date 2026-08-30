import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { readBackupSettings, getLastBackupAt, setLastBackupAt } from "@/hooks/use-backup-settings";
import { getStoredBackupFolder, ensureWritePermission } from "@/lib/backup-fs";
import { exportAutoVaultBackup } from "@/lib/backup";

export type BackupFrequency = "off" | "daily" | "weekly" | "biweekly" | "monthly";

const KEY = "autovault-backup-frequency";
const CHECKED_KEY = "autovault-backup-last-checked";

const FREQUENCY_DAYS: Record<Exclude<BackupFrequency, "off">, number> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

function readFrequency(): BackupFrequency {
  if (typeof window === "undefined") return "off";
  const raw = window.localStorage.getItem(KEY);
  return raw === "daily" || raw === "weekly" || raw === "biweekly" || raw === "monthly"
    ? raw
    : "off";
}

let state = readFrequency();
const listeners = new Set<() => void>();

function setState(next: BackupFrequency) {
  state = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, next);
  for (const listener of listeners) listener();
}

export const backupFrequencyStore = {
  getState: () => state,
  getServerState: () => "off" as BackupFrequency,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setFrequency: setState,
};

export function useBackupFrequency() {
  const frequency = useSyncExternalStore(
    backupFrequencyStore.subscribe,
    backupFrequencyStore.getState,
    backupFrequencyStore.getServerState,
  );
  return { frequency, setFrequency: backupFrequencyStore.setFrequency };
}

function isDue(frequency: BackupFrequency, lastBackupAt: string | null): boolean {
  if (frequency === "off") return false;
  if (!lastBackupAt) return true;
  const intervalMs = FREQUENCY_DAYS[frequency] * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(lastBackupAt).getTime() >= intervalMs;
}

/**
 * Runs once per app load. Only writes a real, silent backup when a backup
 * folder handle is already granted (Chromium desktop only); there is no way
 * to trigger a genuinely automatic download on any browser without a user
 * gesture, so on unsupported browsers this just leaves a reminder toast.
 */
export function useAutoBackup() {
  useEffect(() => {
    const alreadyCheckedThisLoad = window.sessionStorage.getItem(CHECKED_KEY);
    if (alreadyCheckedThisLoad) return;
    window.sessionStorage.setItem(CHECKED_KEY, "1");

    const frequency = readFrequency();
    const lastBackupAt = getLastBackupAt();
    if (!isDue(frequency, lastBackupAt)) return;

    void (async () => {
      const folder = await getStoredBackupFolder();
      if (!folder) {
        toast("Auto-backup due", {
          description: "Set a backup folder in Data & Privacy to back up automatically.",
        });
        return;
      }
      const permitted = await ensureWritePermission(folder, { requestIfNeeded: false });
      if (!permitted) {
        toast("Auto-backup due", {
          description: "Re-grant folder access in Data & Privacy to resume automatic backups.",
        });
        return;
      }
      try {
        const { includeDocuments } = readBackupSettings();
        const filename = await exportAutoVaultBackup({
          includeDocuments,
          encrypt: false,
          folderHandle: folder,
        });
        setLastBackupAt(new Date().toISOString());
        toast.success("Auto-backup saved", { description: filename });
      } catch {
        toast.error("Auto-backup failed", { description: "Try backing up manually." });
      }
    })();
  }, []);
}
