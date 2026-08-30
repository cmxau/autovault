import { garageStore } from "@/lib/store";
import type { Vehicle, TimelineEntry, Doc, VehicleNote } from "@/types/autovault";
import {
  decryptWithPassphrase,
  encryptWithPassphrase,
  isEncryptedEnvelope,
  type EncryptedEnvelope,
} from "@/lib/crypto";

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

export async function exportAutoVaultBackup({
  includeDocuments,
  encrypt,
  passphrase,
}: {
  includeDocuments: boolean;
  encrypt: boolean;
  passphrase?: string;
}) {
  const { vehicles, timeline, docs, notes } = garageStore.getState();
  const payload = {
    exportedAt: new Date().toISOString(),
    vehicles,
    timeline,
    notes,
    ...(includeDocuments && { docs }),
  };
  const filename = `garage-${todayStamp()}.autovault`;

  if (encrypt) {
    if (!passphrase) throw new Error("Passphrase required to encrypt backup");
    const envelope = await encryptWithPassphrase(JSON.stringify(payload), passphrase);
    downloadFile(filename, JSON.stringify(envelope), "application/json");
  } else {
    downloadFile(filename, JSON.stringify(payload, null, 2), "application/json");
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

  const filename = `autovault-export-${todayStamp()}.csv`;
  downloadFile(filename, csv, "text/csv");
  return filename;
}

type RestoredBackup = { vehicleCount: number; entryCount: number };

export async function restoreBackupFile(
  file: File,
  passphrase?: string,
): Promise<RestoredBackup | { needsPassphrase: true }> {
  const text = await file.text();
  const raw: unknown = JSON.parse(text);

  if (isEncryptedEnvelope(raw)) {
    if (!passphrase) return { needsPassphrase: true };
    const plaintext = await decryptWithPassphrase(raw as EncryptedEnvelope, passphrase);
    return applyBackupPayload(JSON.parse(plaintext));
  }

  return applyBackupPayload(raw);
}

function applyBackupPayload(parsed: unknown): RestoredBackup {
  const p = parsed as {
    vehicles?: unknown[];
    timeline?: unknown[];
    docs?: unknown[];
    notes?: unknown[];
  };
  if (!Array.isArray(p.vehicles) || !Array.isArray(p.timeline)) {
    throw new Error("Not a valid .autovault file");
  }
  garageStore.restore({
    vehicles: p.vehicles as Vehicle[],
    timeline: p.timeline as TimelineEntry[],
    ...(Array.isArray(p.docs) && { docs: p.docs as Doc[] }),
    ...(Array.isArray(p.notes) && { notes: p.notes as VehicleNote[] }),
  });
  return { vehicleCount: p.vehicles.length, entryCount: p.timeline.length };
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
