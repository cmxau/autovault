import type { Status } from "@/types/autovault";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const text: Record<Status, string> = {
  ok: "text-ok",
  warn: "text-warn",
  urgent: "text-urgent",
  unknown: "text-muted-foreground",
};

export function statusTone(status: Status) {
  return text[status];
}
