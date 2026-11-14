"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Lets a page tell the site footer (mounted once in the Shell, outside the
 * page) to show its handicraft version. A page renders <HandicraftFooter />;
 * the footer reads useHandicraftFooter().
 */
let pages = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export const useHandicraftFooter = () =>
  useSyncExternalStore(subscribe, () => pages > 0, () => false);

/** Switches the footer to handicraft while this is mounted. */
export function HandicraftFooter() {
  useEffect(() => {
    pages++; emit();
    return () => { pages--; emit(); };
  }, []);
  return null;
}
