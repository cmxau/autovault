import {
  vehicles as seedVehicles,
  timeline as seedTimeline,
  docs as seedDocs,
} from "@/lib/mock-data";
import type { Vehicle, TimelineEntry, Doc, VehicleNote } from "@/types/autovault";

const KEYS = {
  vehicles: "autovault-vehicles",
  timeline: "autovault-timeline",
  docs: "autovault-docs",
  notes: "autovault-notes",
} as const;

export type GarageState = {
  vehicles: Vehicle[];
  timeline: TimelineEntry[];
  docs: Doc[];
  notes: VehicleNote[];
};

const seedNotes: VehicleNote[] = [];

const seedState: GarageState = {
  vehicles: seedVehicles,
  timeline: seedTimeline,
  docs: seedDocs,
  notes: seedNotes,
};

function readKey<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function loadInitialState(): GarageState {
  if (typeof window === "undefined") return seedState;
  return {
    vehicles: readKey(KEYS.vehicles, seedVehicles),
    timeline: readKey(KEYS.timeline, seedTimeline),
    docs: readKey(KEYS.docs, seedDocs),
    notes: readKey(KEYS.notes, seedNotes),
  };
}

let state: GarageState = loadInitialState();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS.vehicles, JSON.stringify(state.vehicles));
  window.localStorage.setItem(KEYS.timeline, JSON.stringify(state.timeline));
  window.localStorage.setItem(KEYS.docs, JSON.stringify(state.docs));
  window.localStorage.setItem(KEYS.notes, JSON.stringify(state.notes));
}

function emit() {
  for (const listener of listeners) listener();
}

function setState(next: GarageState) {
  state = next;
  persist();
  emit();
}

export const garageStore = {
  getState: () => state,
  getServerState: () => seedState,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setVehicles(vehicles: Vehicle[]) {
    setState({ ...state, vehicles });
  },
  setTimeline(timeline: TimelineEntry[]) {
    setState({ ...state, timeline });
  },
  setDocs(docs: Doc[]) {
    setState({ ...state, docs });
  },

  addTimelineEntry(entry: TimelineEntry) {
    setState({ ...state, timeline: [entry, ...state.timeline] });
  },
  updateVehicle(vehicleId: string, patch: Partial<Vehicle>) {
    setState({
      ...state,
      vehicles: state.vehicles.map((v) => (v.id === vehicleId ? { ...v, ...patch } : v)),
    });
  },
  addVehicle(vehicle: Vehicle) {
    setState({ ...state, vehicles: [...state.vehicles, vehicle] });
  },
  deleteVehicle(vehicleId: string) {
    setState({
      vehicles: state.vehicles.filter((v) => v.id !== vehicleId),
      timeline: state.timeline.filter((e) => e.vehicleId !== vehicleId),
      docs: state.docs.filter((d) => d.vehicleId !== vehicleId),
      notes: state.notes.filter((n) => n.vehicleId !== vehicleId),
    });
  },

  addDoc(doc: Doc) {
    setState({ ...state, docs: [doc, ...state.docs] });
  },
  updateDoc(docId: string, patch: Partial<Doc>) {
    setState({
      ...state,
      docs: state.docs.map((d) => (d.id === docId ? { ...d, ...patch } : d)),
    });
  },
  deleteDoc(docId: string) {
    setState({ ...state, docs: state.docs.filter((d) => d.id !== docId) });
  },

  addNote(note: VehicleNote) {
    setState({ ...state, notes: [note, ...state.notes] });
  },
  updateNote(noteId: string, patch: Partial<VehicleNote>) {
    setState({
      ...state,
      notes: state.notes.map((n) => (n.id === noteId ? { ...n, ...patch } : n)),
    });
  },
  deleteNote(noteId: string) {
    setState({ ...state, notes: state.notes.filter((n) => n.id !== noteId) });
  },

  restore(data: {
    vehicles: Vehicle[];
    timeline: TimelineEntry[];
    docs?: Doc[];
    notes?: VehicleNote[];
  }) {
    setState({
      vehicles: data.vehicles,
      timeline: data.timeline,
      docs: data.docs ?? state.docs,
      notes: data.notes ?? state.notes,
    });
  },

  reset() {
    setState(seedState);
  },
};
