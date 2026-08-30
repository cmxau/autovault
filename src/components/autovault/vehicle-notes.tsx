import { useState } from "react";
import { toast } from "sonner";
import { NotebookPen, Plus, Check, Trash2, RotateCcw } from "lucide-react";
import { SectionHeader } from "@/components/autovault/page-header";
import { EmptyState } from "@/components/autovault/empty-state";
import { BottomSheet } from "@/components/autovault/bottom-sheet";
import { FormField, FormGroup, TextInput } from "@/components/autovault/form";
import { PrimaryButton } from "@/components/autovault/buttons";
import { useNotes } from "@/hooks/use-garage-data";
import { useUnitPrefs } from "@/hooks/use-unit-prefs";
import { formatDistance } from "@/lib/units";
import { garageStore } from "@/lib/store";
import type { Vehicle } from "@/types/autovault";

export function VehicleNotesSection({ vehicle }: { vehicle: Vehicle }) {
  const notes = useNotes();
  const { system } = useUnitPrefs();
  const [addOpen, setAddOpen] = useState(false);
  const [text, setText] = useState("");

  const vehicleNotes = notes
    .filter((n) => n.vehicleId === vehicle.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = vehicleNotes.filter((n) => !n.resolved);
  const resolved = vehicleNotes.filter((n) => n.resolved);

  return (
    <section className="mt-8">
      <SectionHeader
        title="Driving Notes"
        action={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            aria-label="Add note"
            className="focus-ring grid size-8 place-items-center rounded-full bg-foreground/[0.06] text-foreground transition-colors hover:bg-foreground/[0.1]"
          >
            <Plus className="size-4" strokeWidth={2.2} />
          </button>
        }
      />

      {vehicleNotes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Nothing noted."
          description="Jot down anything you notice while driving, a rattle, a pull, a smell, so it doesn't get forgotten before the next service."
          action={<PrimaryButton onClick={() => setAddOpen(true)}>Add Note</PrimaryButton>}
        />
      ) : (
        <div className="space-y-2">
          {open.map((note) => (
            <div
              key={note.id}
              className="surface-tinted flex items-start gap-3 rounded-[16px] px-4 py-3.5"
            >
              <button
                type="button"
                aria-label="Mark resolved"
                onClick={() => {
                  garageStore.updateNote(note.id, {
                    resolved: true,
                    resolvedAt: new Date().toISOString(),
                  });
                  toast.success("Note resolved");
                }}
                className="focus-ring mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-hairline text-transparent transition-colors hover:border-primary hover:text-primary"
              >
                <Check className="size-3.5" strokeWidth={2.5} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] leading-snug">{note.text}</p>
                <p className="tnum mt-1 text-[12px] text-muted-foreground">
                  {new Date(note.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })}
                  {note.odometer !== undefined && ` · ${formatDistance(note.odometer, system)}`}
                </p>
              </div>
              <button
                type="button"
                aria-label="Delete note"
                onClick={() => {
                  garageStore.deleteNote(note.id);
                  toast.success("Note deleted");
                }}
                className="focus-ring mt-0.5 text-muted-foreground/70 transition-colors hover:text-urgent"
              >
                <Trash2 className="size-4" strokeWidth={1.6} />
              </button>
            </div>
          ))}

          {resolved.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="px-1 text-[12px] font-medium text-muted-foreground">
                Resolved ({resolved.length})
              </p>
              {resolved.map((note) => (
                <div
                  key={note.id}
                  className="flex items-start gap-3 rounded-[16px] px-4 py-3 opacity-60"
                >
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ok/12 text-ok">
                    <Check className="size-3.5" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] leading-snug line-through">{note.text}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Reopen note"
                    onClick={() => garageStore.updateNote(note.id, { resolved: false })}
                    className="focus-ring mt-0.5 text-muted-foreground/70 transition-colors hover:text-primary"
                  >
                    <RotateCcw className="size-4" strokeWidth={1.6} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Note"
        description="What did you notice while driving?"
      >
        <div className="space-y-4">
          <FormGroup>
            <FormField label="Note">
              <TextInput
                value={text}
                onChange={setText}
                placeholder="Slight pull to the left when braking"
              />
            </FormField>
          </FormGroup>
          <PrimaryButton
            onClick={() => {
              if (!text.trim()) {
                toast.error("Enter a note");
                return;
              }
              garageStore.addNote({
                id: crypto.randomUUID(),
                vehicleId: vehicle.id,
                text: text.trim(),
                odometer: vehicle.odometer,
                createdAt: new Date().toISOString(),
                resolved: false,
              });
              setText("");
              setAddOpen(false);
              toast.success("Note saved");
            }}
          >
            Save Note
          </PrimaryButton>
        </div>
      </BottomSheet>
    </section>
  );
}
