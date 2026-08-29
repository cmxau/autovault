import { useCallback, useEffect, useState } from "react";

const SETTINGS_KEY = "autovault-backup-settings";
const LAST_BACKUP_KEY = "autovault-last-backup-at";

type BackupSettings = {
  encryptBackup: boolean;
  includeDocuments: boolean;
};

const defaults: BackupSettings = { encryptBackup: true, includeDocuments: true };

function readSettings(): BackupSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as Partial<BackupSettings>) };
  } catch {
    return defaults;
  }
}

export function useBackupSettings() {
  const [settings, setSettings] = useState<BackupSettings>(defaults);

  useEffect(() => {
    setSettings(readSettings());
  }, []);

  const update = useCallback((patch: Partial<BackupSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return {
    encryptBackup: settings.encryptBackup,
    includeDocuments: settings.includeDocuments,
    setEncryptBackup: (value: boolean) => update({ encryptBackup: value }),
    setIncludeDocuments: (value: boolean) => update({ includeDocuments: value }),
  };
}

export function getLastBackupAt(): string | null {
  return window.localStorage.getItem(LAST_BACKUP_KEY);
}

export function setLastBackupAt(iso: string) {
  window.localStorage.setItem(LAST_BACKUP_KEY, iso);
}

export function useLastBackupAt() {
  const [lastBackupAt, setState] = useState<string | null>(null);

  useEffect(() => {
    setState(getLastBackupAt());
  }, []);

  const markBackedUp = useCallback((iso: string) => {
    setLastBackupAt(iso);
    setState(iso);
  }, []);

  return { lastBackupAt, markBackedUp };
}
