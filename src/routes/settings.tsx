import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Car,
  Bell,
  ShieldCheck,
  Sun,
  Moon,
  MonitorSmartphone,
  BriefcaseBusiness,
  Wrench,
  Check,
  Download,
  Bug,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionHeader } from "@/components/autovault/page-header";
import { Row, RowGroup } from "@/components/autovault/row";
import { SegmentedControl } from "@/components/autovault/segmented-control";
import { FormField, FormGroup, TextInput, ToggleRow } from "@/components/autovault/form";
import { PrimaryButton } from "@/components/autovault/buttons";
import { BottomSheet } from "@/components/autovault/bottom-sheet";
import { useTheme } from "@/hooks/use-theme";
import { useGarage } from "@/hooks/use-garage";
import { useNotificationPrefs } from "@/hooks/use-notification-prefs";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { setProfileName, useProfileName } from "@/hooks/use-profile";
import type { Currency, DistanceSystem } from "@/lib/units";

const GITHUB_REPO = "cmxau/autovault";

function openGithubIssue(template: string) {
  window.open(
    `https://github.com/${GITHUB_REPO}/issues/new?template=${template}`,
    "_blank",
    "noopener,noreferrer",
  );
}

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AutoVault" },
      {
        name: "description",
        content:
          "Manage vehicles, units, reminders, app lock, backups and appearance for your AutoVault garage.",
      },
      { property: "og:title", content: "Settings — AutoVault" },
      { property: "og:description", content: "Garage, notification, privacy and data settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { vehicles } = useGarage();
  const { theme, setTheme } = useTheme();
  const { serviceReminders, expiryReminders, setServiceReminders, setExpiryReminders } =
    useNotificationPrefs();
  const { system, currency, setSystem, setCurrency } = useUnitPrefs();
  const { canPrompt, installed, isIOS, promptInstall } = usePwaInstall();
  const profileName = useProfileName();
  const [termsOpen, setTermsOpen] = useState(false);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [iosInstallOpen, setIosInstallOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(profileName);

  const systemOptions: { value: DistanceSystem; label: string }[] = [
    { value: "metric", label: "Metric — Kilometres · Litres" },
    { value: "imperial", label: "Imperial — Miles · Gallons" },
  ];
  const currencyOptions: { value: Currency; label: string }[] = [
    { value: "INR", label: "₹ INR — Indian Rupee" },
    { value: "USD", label: "$ USD — US Dollar" },
    { value: "EUR", label: "€ EUR — Euro" },
    { value: "GBP", label: "£ GBP — British Pound" },
  ];

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="space-y-7">
        <section>
          <SectionHeader title="Profile" />
          <RowGroup>
            <Row
              title="Your name"
              trailing={profileName || "Not set"}
              onClick={() => {
                setNameDraft(profileName);
                setNameOpen(true);
              }}
            />
          </RowGroup>
        </section>

        <section>
          <SectionHeader title="Garage" />
          <RowGroup>
            <Row
              icon={Car}
              title="Manage vehicles"
              detail={`${vehicles.length} vehicles`}
              to="/vehicle/new"
            />
            <Row icon={BriefcaseBusiness} title="Glovebox" to="/glovebox" />
            <Row icon={Wrench} title="Maintenance" to="/maintenance" />
            <Row
              title="Units"
              trailing={system === "imperial" ? "Miles · Gallons" : "Kilometres · Litres"}
              onClick={() => setUnitsOpen(true)}
            />
            <Row
              title="Currency"
              trailing={currencyOptions.find((c) => c.value === currency)?.label.split(" — ")[0]}
              onClick={() => setCurrencyOpen(true)}
            />
          </RowGroup>
        </section>

        <section>
          <SectionHeader title="Notifications" />
          <FormGroup>
            <ToggleRow
              label="Service reminders"
              detail="Distance and date based"
              checked={serviceReminders}
              onChange={setServiceReminders}
            />
            <ToggleRow
              label="Document expiry reminders"
              detail="Insurance, PUC, warranty"
              checked={expiryReminders}
              onChange={setExpiryReminders}
            />
          </FormGroup>
          <div className="mt-3">
            <RowGroup>
              <Row icon={Bell} title="All reminders" to="/reminders" />
            </RowGroup>
          </div>
        </section>

        <section>
          <SectionHeader title="Data & Privacy" />
          <RowGroup>
            <Row
              icon={ShieldCheck}
              title="Data & Privacy"
              detail="Encryption, export, restore, CSV"
              to="/privacy"
            />
          </RowGroup>
        </section>

        <section>
          <SectionHeader title="Appearance" />
          <SegmentedControl
            value={theme}
            onChange={setTheme}
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
          <div className="mt-3 flex items-center gap-4 px-1 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MonitorSmartphone className="size-3.5" strokeWidth={1.6} />
              Follows your device
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sun className="size-3.5" strokeWidth={1.6} />
              <Moon className="size-3.5" strokeWidth={1.6} />
            </span>
          </div>
        </section>

        {!installed && (
          <section>
            <SectionHeader title="App" />
            <RowGroup>
              <Row
                icon={Download}
                title="Install as App"
                detail={
                  canPrompt
                    ? "Add AutoVault to your home screen"
                    : isIOS
                      ? "Add to Home Screen from the Share menu"
                      : "Not supported by this browser"
                }
                onClick={async () => {
                  if (canPrompt) {
                    const outcome = await promptInstall();
                    if (outcome === "accepted") toast.success("AutoVault installed");
                    return;
                  }
                  if (isIOS) {
                    setIosInstallOpen(true);
                    return;
                  }
                  toast.error("Install isn't available in this browser");
                }}
              />
            </RowGroup>
          </section>
        )}

        <section>
          <SectionHeader title="About" />
          <RowGroup>
            <Row
              icon={Bug}
              title="Report a Bug"
              detail="Opens a GitHub issue"
              onClick={() => openGithubIssue("bug_report.yml")}
            />
            <Row
              icon={Lightbulb}
              title="Request a Feature"
              detail="Opens a GitHub issue"
              onClick={() => openGithubIssue("feature_request.yml")}
            />
            <Row title="Terms" onClick={() => setTermsOpen(true)} />
            <Row title="Version" trailing="1.0.0 (24)" />
          </RowGroup>
        </section>
      </div>

      <BottomSheet open={nameOpen} onClose={() => setNameOpen(false)} title="Your name">
        <div className="space-y-4">
          <FormGroup>
            <FormField label="Name">
              <TextInput value={nameDraft} onChange={setNameDraft} placeholder="Your name" />
            </FormField>
          </FormGroup>
          <PrimaryButton
            onClick={() => {
              setProfileName(nameDraft.trim());
              setNameOpen(false);
            }}
          >
            Save
          </PrimaryButton>
        </div>
      </BottomSheet>

      <BottomSheet open={unitsOpen} onClose={() => setUnitsOpen(false)} title="Units">
        <div className="flex flex-col gap-1.5">
          {systemOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSystem(option.value);
                setUnitsOpen(false);
              }}
              className="focus-ring flex min-h-[52px] items-center justify-between rounded-[14px] px-3.5 text-left transition-colors hover:bg-foreground/[0.05]"
            >
              <span className="text-[15px]">{option.label}</span>
              {system === option.value && (
                <Check className="size-[18px] text-primary" strokeWidth={2.2} />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={currencyOpen} onClose={() => setCurrencyOpen(false)} title="Currency">
        <div className="flex flex-col gap-1.5">
          {currencyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setCurrency(option.value);
                setCurrencyOpen(false);
              }}
              className="focus-ring flex min-h-[52px] items-center justify-between rounded-[14px] px-3.5 text-left transition-colors hover:bg-foreground/[0.05]"
            >
              <span className="text-[15px]">{option.label}</span>
              {currency === option.value && (
                <Check className="size-[18px] text-primary" strokeWidth={2.2} />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={iosInstallOpen}
        onClose={() => setIosInstallOpen(false)}
        title="Install AutoVault"
        description="iOS doesn't let apps trigger this — a couple of taps in Safari:"
      >
        <ol className="space-y-3 text-[14px] leading-relaxed">
          <li>1. Tap the Share icon in Safari's toolbar</li>
          <li>2. Scroll down and tap "Add to Home Screen"</li>
          <li>3. Tap "Add" — AutoVault opens full-screen from your home screen</li>
        </ol>
      </BottomSheet>

      <BottomSheet
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        title="Terms of Use"
        description="Last updated 29 Aug 2026"
      >
        <div className="max-h-[62vh] space-y-4 overflow-y-auto pr-1 text-[13.5px] leading-relaxed text-muted-foreground">
          <p>
            By using AutoVault, you agree to the terms below. If you do not agree, please do not use
            the app.
          </p>

          <div>
            <h3 className="mb-1 text-[13px] font-semibold text-foreground">1. The Service</h3>
            <p>
              AutoVault is a local-first application for recording vehicle mileage, service history,
              expenses, and documents. It requires no account and no personal information to use.
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-[13px] font-semibold text-foreground">
              2. Your Data & Your Responsibility
            </h3>
            <p>
              All data you enter is stored locally on your device only. AutoVault does not transmit,
              sync, or retain a copy of your data on any server. You are solely responsible for
              backing it up. Use Data &amp; Privacy to export an encrypted backup before clearing
              browser storage, switching devices, or reinstalling — uninstalling the app or clearing
              site data permanently and irrecoverably deletes everything stored here.
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-[13px] font-semibold text-foreground">
              3. No Professional Advice
            </h3>
            <p>
              Mileage, service due dates, health scores, and cost figures are calculated from the
              records you enter. They are estimates for personal reference only and are not a
              substitute for manufacturer guidance or a qualified mechanic's inspection.
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-[13px] font-semibold text-foreground">
              4. Disclaimer of Warranty
            </h3>
            <p>
              AutoVault is provided "as is" and "as available," without warranties of any kind,
              express or implied, including fitness for a particular purpose or non-infringement. We
              do not warrant that the app will be error-free or uninterrupted.
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-[13px] font-semibold text-foreground">
              5. Limitation of Liability
            </h3>
            <p>
              To the fullest extent permitted by law, AutoVault's creators are not liable for any
              data loss, missed maintenance, or other damages arising from your use of the app,
              including data loss from clearing browser storage, device failure, or failure to keep
              a backup.
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-[13px] font-semibold text-foreground">6. Changes</h3>
            <p>
              These terms may be updated from time to time. Continued use of AutoVault after a
              change constitutes acceptance of the revised terms.
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-[13px] font-semibold text-foreground">7. Contact</h3>
            <p>Questions or feedback are welcome via Report a Bug or Request a Feature, above.</p>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
