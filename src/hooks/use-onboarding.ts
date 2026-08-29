const KEY = "autovault-onboarded";

export function hasOnboarded() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(KEY) === "true";
}

export function markOnboarded() {
  window.localStorage.setItem(KEY, "true");
}
