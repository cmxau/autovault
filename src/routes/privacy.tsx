import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Smartphone, Download, FolderOpen, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { FormGroup, ToggleRow } from "@/components/autovault/form";
import { Row, RowGroup } from "@/components/autovault/row";
import { PrimaryButton, SecondaryButton } from "@/components/autovault/buttons";
import { PassphraseSheet } from "@/components/autovault/passphrase-sheet";
import { BottomSheet } from "@/components/autovault/bottom-sheet";
import { useBackupSettings, useLastBackupAt } from "@/hooks/use-backup-settings";
import { useTimeline } from "@/hooks/use-garage-data";
import { useBackupFrequency, type BackupFrequency } from "@/hooks/use-auto-backup";
import {
  chooseBackupFolder,
  ensureWritePermission,
  forgetBackupFolder,
  getStoredBackupFolder,
  isFileSystemAccessSupported,
} from "@/lib/backup-fs";
import {
  countChangesSince,
  exportAutoVaultBackup,
  exportTimelineCsv,
  restoreBackupFile,
  type ParsedBackup,
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

const FREQUENCY_OPTIONS: { value: BackupFrequency; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

function PrivacyPage() {
  const { encryptBackup, includeDocuments, setEncryptBackup, setIncludeDocuments } =
    useBackupSettings();
  const { lastBackupAt, markBackedUp } = useLastBackupAt();
  const { frequency, setFrequency } = useBackupFrequency();
  const timeline = useTimeline();
  const restoreInputRef = useRef<HTMLInputElement>(null);
  // File System Access support is browser-only info; computing it during render
  // would differ between the server pass and the client's first paint and
  // trigger a hydration mismatch, so it's resolved after mount instead.
  const [fsSupported, setFsSupported] = useState(false);

  const [exportSheetOpen, setExportSheetOpen] = useState(false);
  const [restoreSheetOpen, setRestoreSheetOpen] = useState(false);
  const [frequencySheetOpen, setFrequencySheetOpen] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [pendingTarget, setPendingTarget] = useState<"download" | "folder">("download");
  const [folderConnected, setFolderConnected] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<ParsedBackup | null>(null);
  const [restoreModeSheetOpen, setRestoreModeSheetOpen] = useState(false);

  useEffect(() => {
    setFsSupported(isFileSystemAccessSupported());
    void getStoredBackupFolder().then((handle) => setFolderConnected(handle !== null));
  }, []);

  const changes = countChangesSince(lastBackupAt, timeline);

  async function runExport(passphrase?: string, target: "download" | "folder" = "download") {
    try {
      const folderHandle = target === "folder" ? await getStoredBackupFolder() : null;
      if (target === "folder" && !folderHandle) {
        toast.error("Choose a backup folder first");
        return;
      }
      if (folderHandle) {
        const permitted = await ensureWritePermission(folderHandle, { requestIfNeeded: true });
        if (!permitted) {
          toast.error("Folder access denied");
          return;
        }
      }
      const filename = await exportAutoVaultBackup({
        includeDocuments,
        encrypt: encryptBackup,
        ...(passphrase !== undefined && { passphrase }),
        folderHandle,
      });
      markBackedUp(new Date().toISOString());
      toast.success(target === "folder" ? "Backup saved" : "Backup exported", {
        description: filename,
      });
    } catch (err) {
      toast.error("Backup failed", { description: err instanceof Error ? err.message : undefined });
    }
  }

  function startExport(target: "download" | "folder") {
    if (encryptBackup) {
      setPendingTarget(target);
      setExportSheetOpen(true);
    } else {
      void runExport(undefined, target);
    }
  }

  function handleExportClick() {
    startExport("download");
  }

  async function handleChooseFolder() {
    try {
      await chooseBackupFolder();
      setFolderConnected(true);
      toast.success("Backup folder connected", { description: "Saving into an AutoVault folder" });
    } catch {
      // user cancelled the picker
    }
  }

  async function handleForgetFolder() {
    await forgetBackupFolder();
    setFolderConnected(false);
    toast.success("Backup folder disconnected");
  }

  function handleBackupNow() {
    if (!folderConnected) {
      toast.error("Choose a backup folder first");
      return;
    }
    startExport("folder");
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
      setPendingRestore(result);
      setRestoreModeSheetOpen(true);
    } catch (err) {
      toast.error("Couldn't restore that file", {
        description: err instanceof Error ? err.message : "Choose a valid .autovault file",
      });
    }
  }

  function applyRestore(mode: "replace" | "merge") {
    if (!pendingRestore) return;
    pendingRestore.apply(mode);
    toast.success(mode === "merge" ? "Garage merged" : "Garage restored", {
      description: `${pendingRestore.vehicleCount} vehicles, ${pendingRestore.entryCount} entries`,
    });
    setPendingRestore(null);
    setRestoreModeSheetOpen(false);
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

      <section className="mt-8">
        <SectionHeader title="Auto Backup" />
        <RowGroup>
          <Row
            icon={FolderOpen}
            title="Backup folder"
            detail={
              !fsSupported
                ? "Not supported in this browser"
                : folderConnected
                  ? "Connected · AutoVault folder"
                  : "Not set"
            }
            {...(fsSupported && {
              onClick: folderConnected ? handleForgetFolder : handleChooseFolder,
            })}
          />
          <Row
            title="Frequency"
            trailing={FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label}
            onClick={() => setFrequencySheetOpen(true)}
          />
        </RowGroup>

        <div className="mt-4">
          <PrimaryButton icon={Download} onClick={handleBackupNow}>
            Back Up Now
          </PrimaryButton>
        </div>

        <p className="mt-3 px-1 text-[12px] leading-relaxed text-muted-foreground">
          {fsSupported
            ? "Backups are saved into an AutoVault folder inside the location you choose. Scheduled backups run unencrypted so they can happen without a passphrase prompt; use Export above for an encrypted copy."
            : "Automatic folder backups need Chrome, Edge or another Chromium browser on desktop. Use Export above to save a backup manually here."}
        </p>
      </section>

      <PassphraseSheet
        open={exportSheetOpen}
        title="Encrypt backup"
        description="Choose a passphrase: you'll need it to restore this file"
        confirmLabel={pendingTarget === "folder" ? "Save" : "Export"}
        onClose={() => setExportSheetOpen(false)}
        onSubmit={(passphrase) => {
          setExportSheetOpen(false);
          void runExport(passphrase, pendingTarget);
        }}
      />

      <BottomSheet
        open={frequencySheetOpen}
        onClose={() => setFrequencySheetOpen(false)}
        title="Backup Frequency"
        description="How often AutoVault should save automatically to your backup folder"
      >
        <div className="flex flex-col gap-1.5">
          {FREQUENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setFrequency(option.value);
                setFrequencySheetOpen(false);
              }}
              className="focus-ring flex min-h-[52px] items-center justify-between rounded-[14px] px-3.5 text-left transition-colors hover:bg-foreground/[0.05]"
            >
              <span className="text-[15px]">{option.label}</span>
              {frequency === option.value && (
                <Check className="size-[18px] text-primary" strokeWidth={2.2} />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

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

      <BottomSheet
        open={restoreModeSheetOpen}
        onClose={() => {
          setRestoreModeSheetOpen(false);
          setPendingRestore(null);
        }}
        title="Restore or merge?"
        {...(pendingRestore && {
          description: `This file has ${pendingRestore.vehicleCount} vehicles and ${pendingRestore.entryCount} entries.`,
        })}
      >
        <div className="space-y-3">
          <PrimaryButton onClick={() => applyRestore("merge")}>
            Merge with current garage
          </PrimaryButton>
          <SecondaryButton onClick={() => applyRestore("replace")}>
            Replace current garage
          </SecondaryButton>
          <p className="px-1 text-[12px] leading-relaxed text-muted-foreground">
            Merge keeps everything you have now and adds anything new from the file, overwriting
            only entries with a matching ID. Replace deletes your current garage and uses only
            what's in the file.
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}
