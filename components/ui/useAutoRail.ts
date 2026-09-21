"use client";
import { useEffect, useRef } from "react";

/** Auto-sliding horizontal scroller: wraps at the ends, pauses on hover/touch/focus and for reduced-motion users. */
export function useAutoRail(count: number, every = 3500) {
  const rail = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const atStart = el.scrollLeft <= 4;
    if (dir === 1 && atEnd) return el.scrollTo({ left: 0, behavior: "smooth" });
    if (dir === -1 && atStart) return el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!paused.current && !document.hidden) nudge(1); }, every);
    return () => clearInterval(t);
  }, [count, every]);

  const hold = {
    onMouseEnter: () => { paused.current = true; },
    onMouseLeave: () => { paused.current = false; },
    onTouchStart: () => { paused.current = true; },
    onTouchEnd: () => { setTimeout(() => { paused.current = false; }, 4000); },
    onFocus: () => { paused.current = true; },
    onBlur: () => { paused.current = false; },
  };

  return { rail, nudge, hold };
}
