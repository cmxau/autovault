import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { softSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.button
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-foreground/25 backdrop-blur-[3px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%", opacity: 0.6, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0.4 }}
            transition={softSpring}
            className={cn(
              "glass-strong relative w-full max-w-[520px] rounded-t-[25px] px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 sm:rounded-[25px] sm:pb-5",
              className,
            )}
          >
            <div className="mx-auto mb-3 h-[5px] w-9 rounded-full bg-foreground/15 sm:hidden" />
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-[19px] font-semibold tracking-[-0.015em]">{title}</h2>
                {description && (
                  <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="focus-ring -mr-1 grid size-9 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-[17px]" strokeWidth={2} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
