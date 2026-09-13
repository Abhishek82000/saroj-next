"use client";
import { useEffect } from "react";

/** Stops the page behind an open overlay from scrolling. */
export function useLockedBody(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [locked]);
}
