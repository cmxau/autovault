import { garageStore } from "@/lib/store";
import type { Vehicle, TimelineEntry, Doc, VehicleNote, ChecklistItem } from "@/types/autovault";
import {
  decryptWithPassphrase,
  encryptWithPassphrase,
  isEncryptedEnvelope,
  type EncryptedEnvelope,
} from "@/lib/crypto";
import { writeBackupFile } from "@/lib/backup-fs";

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function todayStamp() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" }).toLowerCase();
  return `${day}${month}${d.getFullYear()}`;
}

/** e.g. AutoVault-Backup-2026-08-31-1432.autovault */
function meaningfulBackupFilename() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `AutoVault-Backup-${date}-${time}.autovault`;
}

export async function exportAutoVaultBackup({
  includeDocuments,
  encrypt,
  passphrase,
  folderHandle,
}: {
  includeDocuments: boolean;
  encrypt: boolean;
  passphrase?: string;
  folderHandle?: FileSystemDirectoryHandle | null;
}) {
  const { vehicles, timeline, docs, notes, checklist } = garageStore.getState();
  const payload = {
    exportedAt: new Date().toISOString(),
    vehicles,
    timeline,
    notes,
    checklist,
    ...(includeDocuments && { docs }),
  };
  const filename = meaningfulBackupFilename();

  let content: string;
  if (encrypt) {
    if (!passphrase) throw new Error("Passphrase required to encrypt backup");
    const envelope = await encryptWithPassphrase(JSON.stringify(payload), passphrase);
    content = JSON.stringify(envelope);
  } else {
    content = JSON.stringify(payload, null, 2);
  }

  if (folderHandle) {
    await writeBackupFile(folderHandle, filename, content);
  } else {
    downloadFile(filename, content, "application/json");
  }
  return filename;
}

export function exportTimelineCsv() {
  const { vehicles, timeline } = garageStore.getState();
  const rows = timeline
    .filter(
      (entry) => entry.kind === "fuel" || entry.kind === "service" || entry.kind === "expense",
    )
    .map((entry) => {
      const vehicle = vehicles.find((v) => v.id === entry.vehicleId);
      return [
        entry.date,
        vehicle?.nickname ?? entry.vehicleId,
        entry.kind,
        entry.title,
        entry.odometer ?? "",
        entry.litres ?? "",
        entry.amount ?? "",
        entry.note ?? "",
      ];
    });

  const header = ["Date", "Vehicle", "Type", "Title", "Odometer", "Litres", "Amount", "Note"];
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const filename = `AutoVault-Timeline-${todayStamp()}.csv`;
  downloadFile(filename, csv, "text/csv");
  return filename;
}

export type ParsedBackup = {
  vehicleCount: number;
  entryCount: number;
  /** Actually writes the parsed backup into the store, in the chosen mode. */
  apply: (mode: "replace" | "merge") => void;
};

export async function restoreBackupFile(
  file: File,
  passphrase?: string,
): Promise<ParsedBackup | { needsPassphrase: true }> {
  const text = await file.text();
  const raw: unknown = JSON.parse(text);

  if (isEncryptedEnvelope(raw)) {
    if (!passphrase) return { needsPassphrase: true };
    const plaintext = await decryptWithPassphrase(raw as EncryptedEnvelope, passphrase);
    return parseBackupPayload(JSON.parse(plaintext));
  }

  return parseBackupPayload(raw);
}

function parseBackupPayload(parsed: unknown): ParsedBackup {
  const p = parsed as {
    vehicles?: unknown[];
    timeline?: unknown[];
    docs?: unknown[];
    notes?: unknown[];
    checklist?: unknown[];
  };
  if (!Array.isArray(p.vehicles) || !Array.isArray(p.timeline)) {
    throw new Error("Not a valid .autovault file");
  }
  const data = {
    vehicles: p.vehicles as Vehicle[],
    timeline: p.timeline as TimelineEntry[],
    ...(Array.isArray(p.docs) && { docs: p.docs as Doc[] }),
    ...(Array.isArray(p.notes) && { notes: p.notes as VehicleNote[] }),
    ...(Array.isArray(p.checklist) && { checklist: p.checklist as ChecklistItem[] }),
  };
  return {
    vehicleCount: p.vehicles.length,
    entryCount: p.timeline.length,
    apply: (mode) => garageStore.restore(data, mode),
  };
}

const KIND_LABELS: Record<string, string> = {
  fuel: "Fuel entries",
  service: "Service records",
  document: "Documents",
  expense: "Expenses",
  odometer: "Odometer updates",
};

export function countChangesSince(lastBackupAt: string | null, timeline: TimelineEntry[]) {
  const since = lastBackupAt ? new Date(lastBackupAt).getTime() : 0;
  const changed = timeline.filter((entry) => new Date(entry.date).getTime() > since);
  const counts: Record<string, number> = {};
  for (const entry of changed) {
    const label = KIND_LABELS[entry.kind] ?? entry.kind;
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.entries(counts).map(([label, count]) => ({ label, count }));
}
