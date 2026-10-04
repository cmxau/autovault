import { useEffect, useState } from "react";

/** The build this page is running; "dev" outside a production build. */
export const currentBuild = typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : "dev";

const UPDATED_KEY = "autovault-just-updated";

/** The id of the newest deployed build, or null if it couldn't be reached. */
async function fetchLatestBuild() {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: unknown };
    return typeof data.id === "string" ? data.id : null;
  } catch {
    return null;
  }
}

/**
 * Reloads into the newest build. Only the service worker and its caches are cleared;
 * localStorage, where all garage data lives, is left untouched. iOS has no hard reload
 * for an installed PWA, and navigations here are network-first, so a plain reload after
 * clearing the caches is enough to pick up the new files.
 */
async function reloadIntoLatest(id: string) {
  try {
    sessionStorage.setItem(UPDATED_KEY, id);
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.update();
    for (const key of await caches.keys()) await caches.delete(key);
  } catch {
    // Reloading below still fetches the new HTML even if cleanup failed.
  }
  window.location.reload();
}

export type UpdateState = "idle" | "checking" | "current" | "offline";

export function useAppUpdate() {
  const [state, setState] = useState<UpdateState>("idle");
  const [justUpdatedTo, setJustUpdatedTo] = useState<string | null>(null);

  // After the reload, report which build we landed on (once).
  useEffect(() => {
    const id = sessionStorage.getItem(UPDATED_KEY);
    if (!id) return;
    sessionStorage.removeItem(UPDATED_KEY);
    setJustUpdatedTo(id);
  }, []);

  /** Checks for a newer deploy and installs it if there is one. */
  async function checkForUpdate(): Promise<"updating" | "current" | "offline"> {
    setState("checking");
    const latest = await fetchLatestBuild();
    if (!latest) {
      setState("offline");
      return "offline";
    }
    if (latest === currentBuild) {
      setState("current");
      return "current";
    }
    await reloadIntoLatest(latest);
    return "updating";
  }

  return { state, justUpdatedTo, checkForUpdate };
}
