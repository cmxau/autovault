import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Smartphone, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { FormGroup, ToggleRow } from "@/components/autovault/form";
import { Row, RowGroup } from "@/components/autovault/row";
import { PrimaryButton, SecondaryButton } from "@/components/autovault/buttons";
import { PassphraseSheet } from "@/components/autovault/passphrase-sheet";
import { useBackupSettings, useLastBackupAt } from "@/hooks/use-backup-settings";
import { useTimeline } from "@/hooks/use-garage-data";
import {
  countChangesSince,
  exportAutoVaultBackup,
  exportTimelineCsv,
  restoreBackupFile,
} from "@/lib/backup";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Data & Privacy · AutoVault" },
      {
        name: "description",
        content:
          "Your garage never leaves your device. Encrypt and export your data, or restore it, on your terms.",
      },
      { property: "og:title", content: "Data & Privacy · AutoVault" },
      {
        property: "og:description",
        content: "AutoVault keeps vehicle data, documents and history on your device.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { encryptBackup, includeDocuments, setEncryptBackup, setIncludeDocuments } =
    useBackupSettings();
  const { lastBackupAt, markBackedUp } = useLastBackupAt();
  const timeline = useTimeline();
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const [exportSheetOpen, setExportSheetOpen] = useState(false);
  const [restoreSheetOpen, setRestoreSheetOpen] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);

  const changes = countChangesSince(lastBackupAt, timeline);

  async function runExport(passphrase?: string) {
    try {
      const filename = await exportAutoVaultBackup({
        includeDocuments,
        encrypt: encryptBackup,
        ...(passphrase !== undefined && { passphrase }),
      });
      markBackedUp(new Date().toISOString());
      toast.success("Backup exported", { description: filename });
    } catch (err) {
      toast.error("Export failed", { description: err instanceof Error ? err.message : undefined });
    }
  }

  function handleExportClick() {
    if (encryptBackup) {
      setExportSheetOpen(true);
    } else {
      void runExport();
    }
  }

  function handleExportCsv() {
    const filename = exportTimelineCsv();
    toast.success("CSV exported", { description: filename });
  }

  async function processRestore(file: File, passphrase?: string) {
    try {
      const result = await restoreBackupFile(file, passphrase);
      if ("needsPassphrase" in result) {
        setPendingRestoreFile(file);
        setRestoreSheetOpen(true);
        return;
      }
      toast.success("Garage restored", {
        description: `${result.vehicleCount} vehicles, ${result.entryCount} entries`,
      });
    } catch (err) {
      toast.error("Couldn't restore that file", {
        description: err instanceof Error ? err.message : "Choose a valid .autovault file",
      });
    }
  }

  return (
    <div>
      <PageHeader title="Your garage never leaves your device." />

      <div className="surface-tinted flex items-start gap-3 rounded-[25px] px-5 py-5">
        <Smartphone className="mt-0.5 size-[17px] shrink-0 text-primary" strokeWidth={1.7} />
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Vehicle data, documents, service and fuel history all stay on this device · AutoVault
          servers hold no personal vehicle database, there is no account, and nothing to sync.
        </p>
      </div>

      <section className="mt-8">
        <SectionHeader title="Security" />
        <FormGroup>
          <ToggleRow
            label="Backup Encryption"
            detail="Encrypt exported .autovault files with a passphrase"
            checked={encryptBackup}
            onChange={setEncryptBackup}
          />
          <ToggleRow
            label="Include document files"
            detail="RC, insurance, invoices"
            checked={includeDocuments}
            onChange={setIncludeDocuments}
          />
        </FormGroup>
      </section>

      <section className="mt-8">
        <SectionHeader title="Backup" />

        <div className="surface-tinted rounded-[25px] px-5 py-5">
          <p className="text-[13px] text-muted-foreground">Last backup</p>
          <p className="tnum mt-1 text-[26px] font-semibold leading-none tracking-[-0.02em]">
            {lastBackupAt
              ? new Date(lastBackupAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Never"}
          </p>

          <dl className="mt-5 border-t border-hairline pt-4">
            <p className="mb-2 text-[12.5px] text-muted-foreground">Changes since backup</p>
            {changes.length === 0 && (
              <p className="text-[14.5px] text-muted-foreground">Nothing new to back up</p>
            )}
            {changes.map((change) => (
              <div key={change.label} className="flex items-baseline justify-between py-1">
                <dt className="text-[14.5px]">{change.label}</dt>
                <dd className="tnum text-[14.5px] font-semibold">{change.count}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <PrimaryButton icon={Download} onClick={handleExportClick}>
            Export
          </PrimaryButton>
          <SecondaryButton icon={Upload} onClick={() => restoreInputRef.current?.click()}>
            Restore
          </SecondaryButton>
          <input
            ref={restoreInputRef}
            type="file"
            accept=".autovault,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void processRestore(file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="mt-4">
          <RowGroup>
            <Row
              title="Export CSV"
              detail="Fuel, service and expense tables"
              onClick={handleExportCsv}
            />
          </RowGroup>
        </div>

        <p className="mt-3 px-1 text-[12px] leading-relaxed text-muted-foreground">
          A .autovault file can be stored anywhere you like and restored on any device running
          AutoVault.
        </p>
      </section>

      <PassphraseSheet
        open={exportSheetOpen}
        title="Encrypt backup"
        description="Choose a passphrase: you'll need it to restore this file"
        confirmLabel="Export"
        onClose={() => setExportSheetOpen(false)}
        onSubmit={(passphrase) => {
          setExportSheetOpen(false);
          void runExport(passphrase);
        }}
      />

      <PassphraseSheet
        open={restoreSheetOpen}
        title="Enter passphrase"
        description="This backup is encrypted"
        confirmLabel="Restore"
        onClose={() => {
          setRestoreSheetOpen(false);
          setPendingRestoreFile(null);
        }}
        onSubmit={(passphrase) => {
          setRestoreSheetOpen(false);
          if (pendingRestoreFile) void processRestore(pendingRestoreFile, passphrase);
          setPendingRestoreFile(null);
        }}
      />
    </div>
  );
}
