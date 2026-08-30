import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { KeyRound, Fuel, Wrench, BriefcaseBusiness, Bell, Smartphone } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/autovault/buttons";
import { TextInput } from "@/components/autovault/form";
import { cn } from "@/lib/utils";
import { markOnboarded } from "@/hooks/use-onboarding";
import { setProfileName } from "@/hooks/use-profile";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to AutoVault" },
      {
        name: "description",
        content:
          "Everything about your vehicle in one private place: mileage, maintenance, documents and reminders, with no account required.",
      },
      { property: "og:title", content: "Welcome to AutoVault" },
      {
        property: "og:description",
        content: "A private digital home for everything related to your vehicles.",
      },
    ],
  }),
  component: WelcomePage,
});

const screens = [
  {
    title: "AutoVault",
    body: "Everything about your vehicle.\nIn one private place.",
  },
  {
    title: "Mileage. Maintenance.\nDocuments. Reminders.",
    body: "Everything your vehicle needs, recorded the way you want it.",
  },
  {
    title: "What should we call you?",
    body: "A personal touch for your greeting, totally optional.",
  },
  {
    title: "Your data stays yours.",
    body: "AutoVault keeps your vehicle records on your device.",
  },
];

const icons = [Fuel, Wrench, BriefcaseBusiness, Bell];

function WelcomePage() {
  const [index, setIndex] = useState(0);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const screen = screens[index]!;
  const last = index === screens.length - 1;

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-hidden px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--primary) 10%, transparent), transparent)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[420px]">
        <span className="glass inline-flex size-12 items-center justify-center rounded-[15px] text-primary">
          <KeyRound className="size-6" strokeWidth={1.8} />
        </span>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
            className="mt-8"
          >
            <h1 className="whitespace-pre-line text-[34px] font-semibold leading-[1.12] tracking-[-0.03em]">
              {screen.title}
            </h1>
            <p className="mt-4 max-w-[36ch] whitespace-pre-line text-[16px] leading-relaxed text-muted-foreground">
              {screen.body}
            </p>

            {index === 1 && (
              <div className="mt-8 flex gap-2.5">
                {icons.map((Icon, i) => (
                  <span
                    key={i}
                    className="glass grid size-11 place-items-center rounded-[13px] text-foreground/70"
                  >
                    <Icon className="size-[18px]" strokeWidth={1.6} />
                  </span>
                ))}
              </div>
            )}

            {index === 2 && (
              <div className="mt-7 glass rounded-[16px] px-4 py-1">
                <TextInput value={name} onChange={setName} placeholder="Your name" />
              </div>
            )}

            {index === 3 && (
              <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-ok/10 px-3 py-2 text-[13px] font-medium text-ok">
                <Smartphone className="size-4" strokeWidth={1.8} />
                Stored on this device
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative mx-auto w-full max-w-[420px]">
        <div className="mb-6 flex justify-center gap-1.5" aria-hidden>
          {screens.map((s, i) => (
            <span
              key={s.title}
              className={cn(
                "h-[6px] rounded-full transition-all duration-300",
                i === index ? "w-[18px] bg-primary" : "w-[6px] bg-foreground/15",
              )}
            />
          ))}
        </div>

        <div className="space-y-3">
          <PrimaryButton
            onClick={() => {
              if (!last) {
                setIndex(index + 1);
                return;
              }
              if (name.trim()) setProfileName(name.trim());
              markOnboarded();
              void navigate({ to: "/vehicle/new" });
            }}
          >
            {last ? "Create My Garage" : "Continue"}
          </PrimaryButton>
          {last ? (
            <Link
              to="/privacy"
              className="block"
              onClick={() => {
                if (name.trim()) setProfileName(name.trim());
                markOnboarded();
              }}
            >
              <SecondaryButton>Learn about privacy</SecondaryButton>
            </Link>
          ) : (
            <button
              onClick={() => setIndex(screens.length - 1)}
              className="focus-ring mx-auto block min-h-11 px-4 text-[14px] text-muted-foreground"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
