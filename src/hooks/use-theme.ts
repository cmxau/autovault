import { useCallback, useEffect, useState } from "react";

export type Theme = "system" | "light" | "dark";

const KEY = "autovault-theme";
const ACCENT_KEY = "autovault-accent";

export const accents = [
  { value: "blue", label: "Blue", swatch: "oklch(0.585 0.201 258)" },
  { value: "teal", label: "Teal", swatch: "oklch(0.58 0.11 195)" },
  { value: "graphite", label: "Graphite", swatch: "oklch(0.38 0.02 258)" },
] as const;

export type Accent = (typeof accents)[number]["value"] | "custom";

export const DEFAULT_CUSTOM = "#e11d48";
const CUSTOM_KEY = "autovault-accent-custom";
const CUSTOM_VARS = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--sidebar-primary",
  "--sidebar-ring",
];

function readCustom(): string {
  const stored = window.localStorage.getItem(CUSTOM_KEY);
  return stored && /^#[0-9a-f]{6}$/i.test(stored) ? stored : DEFAULT_CUSTOM;
}

function readAccent(): Accent {
  const stored = window.localStorage.getItem(ACCENT_KEY);
  return stored === "custom" || accents.some((a) => a.value === stored)
    ? (stored as Accent)
    : "blue";
}

/** White or near-black text, whichever reads better on the picked colour. */
function foregroundFor(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r! + 0.587 * g! + 0.114 * b! > 160 ? "oklch(0.18 0 0)" : "oklch(0.99 0 0)";
}

function applyAccent(accent: Accent, custom: string) {
  const root = document.documentElement;
  for (const name of CUSTOM_VARS) root.style.removeProperty(name);
  if (accent === "blue") delete root.dataset["accent"];
  else root.dataset["accent"] = accent;
  if (accent === "custom") {
    for (const name of CUSTOM_VARS) {
      root.style.setProperty(
        name,
        name === "--primary-foreground" ? foregroundFor(custom) : custom,
      );
    }
  }
}

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function applyStoredTheme() {
  const stored = window.localStorage.getItem(KEY) as Theme | null;
  apply(stored ?? "system");
  applyAccent(readAccent(), readCustom());
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [accent, setAccentState] = useState<Accent>("blue");
  const [customColor, setCustomColorState] = useState(DEFAULT_CUSTOM);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY) as Theme | null;
    const next = stored ?? "system";
    setThemeState(next);
    apply(next);
    setAccentState(readAccent());
    setCustomColorState(readCustom());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(KEY, next);
    apply(next);
  }, []);

  const setAccent = useCallback((next: Accent) => {
    setAccentState(next);
    window.localStorage.setItem(ACCENT_KEY, next);
    applyAccent(next, readCustom());
  }, []);

  const setCustomColor = useCallback((hex: string) => {
    setCustomColorState(hex);
    setAccentState("custom");
    window.localStorage.setItem(CUSTOM_KEY, hex);
    window.localStorage.setItem(ACCENT_KEY, "custom");
    applyAccent("custom", hex);
  }, []);

  return { theme, setTheme, accent, setAccent, customColor, setCustomColor };
}
