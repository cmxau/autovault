import { useState } from "react";
import {
  BatteryCharging,
  Check,
  CircleDashed,
  Disc3,
  Funnel,
  Link as LinkIcon,
  MoveHorizontal,
  Plus,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { appIcons } from "@/lib/icons";
import { FormField, FormGroup, TextInput } from "@/components/autovault/form";
import { cleanWorkName, workGroups, workLabels } from "@/lib/service-work";
import { cn } from "@/lib/utils";

const workIcons: Record<string, LucideIcon> = {
  "Engine oil": appIcons.engineOil,
  "Oil filter": Funnel,
  "Air filter": appIcons.emissions,
  "Brake pads": Disc3,
  Tyres: CircleDashed,
  "Tyre puncture repair": appIcons.repair,
  "Tyre air pressure top-up": appIcons.tyrePressure,
  "Wheel alignment": MoveHorizontal,
  Battery: BatteryCharging,
  "Chain maintenance": LinkIcon,
};

function Tick({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
        on
          ? "border-primary bg-primary text-primary-foreground"
          : "border-hairline text-transparent",
      )}
    >
      <Check className="size-3.5" strokeWidth={2.5} />
    </span>
  );
}

function IconTile({ icon: Icon, on }: { icon: LucideIcon; on: boolean }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-[11px] transition-colors",
        on ? "bg-primary/12 text-primary" : "bg-foreground/[0.06] text-muted-foreground",
      )}
    >
      <Icon className="size-[18px]" strokeWidth={1.75} />
    </span>
  );
}

/** Pick the work done in a service: grouped rows, plus any number of custom items. */
export function WorkPicker({
  selected,
  onSelectedChange,
  custom,
  onCustomChange,
  draft,
  onDraftChange,
  tracked,
}: {
  selected: string[];
  onSelectedChange: (next: string[]) => void;
  custom: string[];
  onCustomChange: (next: string[]) => void;
  draft: string;
  onDraftChange: (next: string) => void;
  /** Labels that will also update an item on the vehicle's checklist. */
  tracked: Set<string>;
}) {
  const [adding, setAdding] = useState(false);
  const count = selected.length + custom.length;

  const toggle = (label: string) =>
    onSelectedChange(
      selected.includes(label) ? selected.filter((l) => l !== label) : [...selected, label],
    );

  const addCustom = () => {
    const name = cleanWorkName(draft);
    if (name && !workLabels.includes(name) && !custom.includes(name)) {
      onCustomChange([...custom, name]);
    }
    onDraftChange("");
  };

  return (
    <div>
      <div className="mb-2.5 flex items-end justify-between gap-4 px-0.5">
        <h2 className="text-[13px] font-medium tracking-[0.01em] text-muted-foreground">
          Maintenance performed
        </h2>
        <span className="tnum text-[12.5px] text-muted-foreground">
          {count === 0 ? "None selected" : `${count} selected`}
        </span>
      </div>

      <div className="space-y-5">
        {workGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-1 text-[12px] text-muted-foreground">{group.title}</p>
            <FormGroup>
              {group.items.map((label) => {
                const on = selected.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(label)}
                    className={cn(
                      "focus-ring flex min-h-[56px] w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                      on && "bg-primary/[0.06]",
                    )}
                  >
                    <IconTile icon={workIcons[label] ?? Sparkles} on={on} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium tracking-[-0.005em]">
                        {label}
                      </span>
                      {tracked.has(label) && (
                        <span className="block text-[12px] text-muted-foreground">
                          Updates your checklist
                        </span>
                      )}
                    </span>
                    <Tick on={on} />
                  </button>
                );
              })}
            </FormGroup>
          </div>
        ))}

        <div>
          <p className="mb-1.5 px-1 text-[12px] text-muted-foreground">Your own</p>
          <FormGroup>
            {custom.map((name) => (
              <div
                key={name}
                className="flex min-h-[56px] items-center gap-3 bg-primary/[0.06] px-4"
              >
                <IconTile icon={Sparkles} on />
                <span className="min-w-0 flex-1 text-[15px] font-medium tracking-[-0.005em]">
                  {name}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => onCustomChange(custom.filter((c) => c !== name))}
                  className="focus-ring grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-urgent"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>
            ))}
            {adding ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addCustom();
                }}
              >
                <FormField label="New item">
                  <TextInput
                    value={draft}
                    onChange={onDraftChange}
                    placeholder="e.g. Clutch cable replacement"
                  />
                </FormField>
                <div className="flex justify-end gap-1 px-3 pb-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDraftChange("");
                      setAdding(false);
                    }}
                    className="focus-ring min-h-11 rounded-[12px] px-4 text-[14px] text-muted-foreground hover:text-foreground"
                  >
                    Done
                  </button>
                  <button
                    type="submit"
                    className="focus-ring min-h-11 rounded-[12px] bg-primary px-4 text-[14px] font-medium text-primary-foreground"
                  >
                    Add
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="focus-ring flex min-h-[56px] w-full items-center gap-3 px-4 text-left text-primary transition-colors hover:bg-primary/[0.06]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] border border-dashed border-primary/40">
                  <Plus className="size-[18px]" strokeWidth={2.2} />
                </span>
                <span className="text-[15px] font-medium">Add your own</span>
              </button>
            )}
          </FormGroup>
        </div>
      </div>
    </div>
  );
}
