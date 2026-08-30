import { useSyncExternalStore } from "react";

const KEY = "autovault-profile-name";

function readName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

let state = readName();
const listeners = new Set<() => void>();

function setState(next: string) {
  state = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, state);
  for (const listener of listeners) listener();
}

export const profileStore = {
  getState: () => state,
  getServerState: () => "",
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** Reads the profile name reactively; updates immediately across every mounted consumer. */
export function useProfileName() {
  return useSyncExternalStore(
    profileStore.subscribe,
    profileStore.getState,
    profileStore.getServerState,
  );
}

export function setProfileName(name: string) {
  setState(name);
}
