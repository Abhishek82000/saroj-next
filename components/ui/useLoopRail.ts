"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Endless, slow-drifting horizontal scroller. When the cards overflow, the rail
 * renders them twice (`loop`) and drifts forward; on passing the first copy it
 * jumps back by exactly one copy's width, so it never visibly rewinds.
 * Still a native scroller: swipe and the arrows work, and the drift pauses on
 * hover/touch/focus and for reduced-motion users.
 */
export function useLoopRail(count: number, speed = 32 /* px per second */) {
  const rail = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const busyUntil = useRef(0);
  const [loop, setLoop] = useState(false);

  /** Width of one copy of the cards: where the second copy starts. */
  const period = () => {
    const el = rail.current;
    if (!el || !loop || el.children.length < count * 2) return 0;
    const a = el.children[0] as HTMLElement;
    const b = el.children[count] as HTMLElement;
    return b.offsetLeft - a.offsetLeft;
  };

  /* Loop only when one copy is wider than the rail — otherwise there's nothing to scroll. */
  useEffect(() => {
    const el = rail.current;
    if (!el || count < 2) return setLoop(false);
    const check = () => {
      if (loop) {
        const p = period();
        if (p && p <= el.clientWidth) setLoop(false);
      } else if (el.scrollWidth > el.clientWidth + 4) setLoop(true);
    };
    check();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, loop]);

  /* Snap points would tug against the drift, so they're off while looping. */
  useEffect(() => {
    const el = rail.current;
    if (el) el.style.scrollSnapType = loop ? "none" : "";
  }, [loop]);

  /* Keep the scroll position inside the first copy once a swipe or arrow scroll settles. */
  useEffect(() => {
    const el = rail.current;
    if (!el || !loop) return;
    let t = 0;
    const settle = () => {
      const p = period();
      if (!p) return;
      if (el.scrollLeft >= p) el.scrollLeft -= p;
      else if (el.scrollLeft <= 0) el.scrollLeft += p;
    };
    const onScroll = () => { clearTimeout(t); t = window.setTimeout(settle, 160); };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop, count]);

  /* The drift itself. Tracks its own fractional position, re-syncing if the visitor scrolled. */
  useEffect(() => {
    const el = rail.current;
    if (!el || !loop) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, last = 0, pos = el.scrollLeft;
    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (!paused.current && !document.hidden && now > busyUntil.current) {
        if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft;
        pos += (speed * dt) / 1000;
        const p = period();
        if (p && pos >= p) pos -= p;
        el.scrollLeft = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop, count, speed]);

  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * 0.8);
    const p = period();
    busyUntil.current = performance.now() + 900;
    if (p) {
      /* Hop to the matching spot in the other copy first, so there's always room to scroll. */
      if (dir === 1 && el.scrollLeft + step >= p) el.scrollLeft -= p;
      if (dir === -1 && el.scrollLeft - step <= 0) el.scrollLeft += p;
    } else {
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      const atStart = el.scrollLeft <= 4;
      if (dir === 1 && atEnd) return el.scrollTo({ left: 0, behavior: "smooth" });
      if (dir === -1 && atStart) return el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    }
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const hold = {
    onMouseEnter: () => { paused.current = true; },
    onMouseLeave: () => { paused.current = false; },
    onTouchStart: () => { paused.current = true; },
    onTouchEnd: () => { setTimeout(() => { paused.current = false; }, 3000); },
    onFocus: () => { paused.current = true; },
    onBlur: () => { paused.current = false; },
  };

  /** The cards to render: twice over while looping, the second pass marked as a clone. */
  const slots = <T,>(items: T[]) =>
    (loop ? [...items, ...items] : items).map((item, i) => ({ item, clone: i >= items.length }));

  return { rail, nudge, hold, loop, slots };
}
