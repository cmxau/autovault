import { useSyncExternalStore } from "react";
import { garageStore } from "@/lib/store";

export function useVehicles() {
  return useSyncExternalStore(
    garageStore.subscribe,
    () => garageStore.getState().vehicles,
    () => garageStore.getServerState().vehicles,
  );
}

export function useTimeline() {
  return useSyncExternalStore(
    garageStore.subscribe,
    () => garageStore.getState().timeline,
    () => garageStore.getServerState().timeline,
  );
}

export function useDocs() {
  return useSyncExternalStore(
    garageStore.subscribe,
    () => garageStore.getState().docs,
    () => garageStore.getServerState().docs,
  );
}

export function useNotes() {
  return useSyncExternalStore(
    garageStore.subscribe,
    () => garageStore.getState().notes,
    () => garageStore.getServerState().notes,
  );
}
