import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/** Spring/easing presets shared across AutoVault. */
export const spring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.9 };
export const softSpring = { type: "spring" as const, stiffness: 260, damping: 28 };
export const ease = { duration: 0.24, ease: [0.32, 0.72, 0, 1] as const };

export function usePress(scale = 0.975) {
  const reduce = useReducedMotion();
  return reduce ? {} : { whileTap: { scale }, transition: spring };
}

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
