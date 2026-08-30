import { useSyncExternalStore } from "react";

const SETTINGS_KEY = "autovault-backup-settings";
const LAST_BACKUP_KEY = "autovault-last-backup-at";

type BackupSettings = {
  encryptBackup: boolean;
  includeDocuments: boolean;
};

const defaults: BackupSettings = { encryptBackup: true, includeDocuments: true };

export function readBackupSettings(): BackupSettings {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<BackupSettings>) } : defaults;
  } catch {
    return defaults;
  }
}

let settingsState = readBackupSettings();
const settingsListeners = new Set<() => void>();

function setSettingsState(next: BackupSettings) {
  settingsState = next;
  if (typeof window !== "undefined")
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  for (const listener of settingsListeners) listener();
}

export function useBackupSettings() {
  const settings = useSyncExternalStore(
    (listener) => {
      settingsListeners.add(listener);
      return () => settingsListeners.delete(listener);
    },
    () => settingsState,
    () => defaults,
  );

  return {
    encryptBackup: settings.encryptBackup,
    includeDocuments: settings.includeDocuments,
    setEncryptBackup: (value: boolean) =>
      setSettingsState({ ...settingsState, encryptBackup: value }),
    setIncludeDocuments: (value: boolean) =>
      setSettingsState({ ...settingsState, includeDocuments: value }),
  };
}

export function getLastBackupAt(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_BACKUP_KEY);
}

let lastBackupState = getLastBackupAt();
const lastBackupListeners = new Set<() => void>();

export function setLastBackupAt(iso: string) {
  lastBackupState = iso;
  if (typeof window !== "undefined") window.localStorage.setItem(LAST_BACKUP_KEY, iso);
  for (const listener of lastBackupListeners) listener();
}

export function useLastBackupAt() {
  const lastBackupAt = useSyncExternalStore(
    (listener) => {
      lastBackupListeners.add(listener);
      return () => lastBackupListeners.delete(listener);
    },
    () => lastBackupState,
    () => null,
  );

  return { lastBackupAt, markBackedUp: setLastBackupAt };
}
