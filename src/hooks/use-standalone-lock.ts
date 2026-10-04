import { useEffect } from "react";
import { isStandalone } from "@/hooks/use-pwa-install";

const LOCKED_VIEWPORT =
  "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

/**
 * When installed as an app, behave like one: no pinch or double-tap zoom, and no
 * rubber-banding or sideways panning, so the UI always matches the device screen.
 * Browser tabs keep normal zoom, which matters for accessibility.
 */
export function useStandaloneLock() {
  useEffect(() => {
    if (!isStandalone()) return;

    document.documentElement.classList.add("standalone");
    document.querySelector('meta[name="viewport"]')?.setAttribute("content", LOCKED_VIEWPORT);

    // iOS ignores user-scalable=no, but still fires gesture events for pinch zoom.
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", block);
    document.addEventListener("gesturechange", block);
    return () => {
      document.removeEventListener("gesturestart", block);
      document.removeEventListener("gesturechange", block);
    };
  }, []);
}
