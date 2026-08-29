import { useNavigate } from "@tanstack/react-router";
import { Fuel, Wrench, Receipt, Gauge, FileText } from "lucide-react";
import { motion } from "motion/react";
import { BottomSheet } from "@/components/autovault/bottom-sheet";
import { usePress } from "@/lib/motion";

const actions = [
  { label: "Add Fuel", detail: "Litres, price and odometer", icon: Fuel, to: "/add/fuel" },
  { label: "Add Service", detail: "Work performed and cost", icon: Wrench, to: "/add/service" },
  { label: "Add Expense", detail: "Tolls, parking, repairs", icon: Receipt, to: "/add/expense" },
  { label: "Update Odometer", detail: "Keep distance accurate", icon: Gauge, to: "/add/odometer" },
  { label: "Add Document", detail: "Store it in the glovebox", icon: FileText, to: "/glovebox/new" },
] as const;

export function AddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const press = usePress(0.98);

  return (
    <BottomSheet open={open} onClose={onClose} title="Add to AutoVault">
      <div className="flex flex-col gap-1.5">
        {actions.map((action) => (
          <motion.button
            key={action.label}
            {...press}
            onClick={() => {
              onClose();
              void navigate({ to: action.to });
            }}
            className="focus-ring flex min-h-[58px] items-center gap-3.5 rounded-[16px] bg-foreground/[0.04] px-3.5 text-left transition-colors hover:bg-foreground/[0.07]"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-primary/12 text-primary">
              <action.icon className="size-[18px]" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-medium tracking-[-0.005em]">
                {action.label}
              </span>
              <span className="block truncate text-[12.5px] text-muted-foreground">
                {action.detail}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </BottomSheet>
  );
}
