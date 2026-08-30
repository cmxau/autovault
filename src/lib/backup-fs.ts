// Wraps the File System Access API so AutoVault can write backups directly into
// a real folder on disk instead of just triggering a browser download. Only
// Chromium-based desktop browsers support this (Chrome, Edge, Opera, Brave).
// Safari and Firefox have no equivalent API at all, so there is no way to give
// them real folder access; callers must fall back to a plain download there.

const DB_NAME = "autovault-fs";
const STORE_NAME = "handles";
const HANDLE_KEY = "backup-folder";

export function isFileSystemAccessSupported() {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Opens the native folder picker, then gets-or-creates an "AutoVault" subfolder inside it. */
export async function chooseBackupFolder(): Promise<FileSystemDirectoryHandle> {
  const picked = await window.showDirectoryPicker!({ id: "autovault-backups", mode: "readwrite" });
  const autoVaultDir = await picked.getDirectoryHandle("AutoVault", { create: true });
  await idbSet(HANDLE_KEY, autoVaultDir);
  return autoVaultDir;
}

export async function getStoredBackupFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null;
  try {
    const handle = await idbGet<FileSystemDirectoryHandle>(HANDLE_KEY);
    return handle ?? null;
  } catch {
    return null;
  }
}

export async function forgetBackupFolder() {
  await idbDelete(HANDLE_KEY);
}

/** Checks/re-requests write permission on a stored handle. Re-requesting needs a user gesture. */
export async function ensureWritePermission(
  handle: FileSystemDirectoryHandle,
  { requestIfNeeded }: { requestIfNeeded: boolean },
): Promise<boolean> {
  const opts = { mode: "readwrite" as const };
  const status = await handle.queryPermission(opts);
  if (status === "granted") return true;
  if (!requestIfNeeded) return false;
  const requested = await handle.requestPermission(opts);
  return requested === "granted";
}

export async function writeBackupFile(
  handle: FileSystemDirectoryHandle,
  filename: string,
  content: string,
) {
  const fileHandle = await handle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}
