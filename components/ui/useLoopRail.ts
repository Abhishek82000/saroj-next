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
  /** The flex row inside `rail` that holds the cards — the one element the drift moves. */
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const busyUntil = useRef(0);
  /** Folds the running drift into scrollLeft; set by the drift effect. */
  const foldRef = useRef(() => {});
  const [loop, setLoop] = useState(false);

  /** Width of one copy of the cards: where the second copy starts. */
  const period = () => {
    const row = track.current;
    if (!row || !loop || row.children.length < count * 2) return 0;
    const a = row.children[0] as HTMLElement;
    const b = row.children[count] as HTMLElement;
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
      /* Only after the visitor scrolled (paused or arrow-busy) — not the drift's own wrap-around. */
      if (!paused.current && performance.now() > busyUntil.current) return;
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

  /* The drift itself. scrollLeft only takes whole pixels, so at ~0.5px a frame
     driving it directly moves in uneven 1px hops — a visible shake. Instead the
     drift is a sub-pixel transform on the one track element (its own GPU layer), and
     the scroll position is left to swipes and the arrows. Whenever the visitor
     takes over, the drift is folded back into scrollLeft so the two never fight. */
  /* The frame loop never reads layout: with a dozen rails on a page, one rail's
     write followed by the next rail's offsetLeft/scrollLeft read forces a
     full-page layout per rail per frame, and the dropped frames show as shake.
     So the copy width and scroll position are cached (measured on resize and
     on scroll), and rails off screen don't tick at all. */
  useEffect(() => {
    const el = rail.current;
    if (!el || !loop) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, last = 0, drift = 0;
    let per = period(), sl = el.scrollLeft, shown = true;
    const row = track.current;
    const paint = () => { if (row) row.style.transform = drift ? `translate3d(${-drift}px,0,0)` : ""; };
    const fold = () => {
      if (!drift) return;
      sl = Math.round(sl + drift);
      el.scrollLeft = sl;
      drift = 0;
      paint();
    };
    foldRef.current = fold;

    const onScroll = () => { sl = el.scrollLeft; };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => { per = period(); sl = el.scrollLeft; });
    ro?.observe(el);
    if (row) ro?.observe(row);
    const io = typeof IntersectionObserver === "undefined" ? null
      : new IntersectionObserver(([e]) => { shown = e.isIntersecting; last = 0; }, { rootMargin: "100px 0px" });
    io?.observe(el);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!shown || document.hidden) { last = 0; return; }
      const dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (paused.current || now <= busyUntil.current) { fold(); return; }
      drift += (speed * dt) / 1000;
      /* Past one copy's width: jump back a copy. Both copies look the same, so it's seamless. */
      if (per && sl + drift >= per) {
        drift = sl + drift - per;
        sl = 0;
        el.scrollLeft = 0;
      }
      paint();
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      ro?.disconnect();
      io?.disconnect();
      fold();
      foldRef.current = () => {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop, count, speed]);

  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    foldRef.current();
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
    onMouseEnter: () => { paused.current = true; foldRef.current(); },
    onMouseLeave: () => { paused.current = false; },
    onTouchStart: () => { paused.current = true; foldRef.current(); },
    onTouchEnd: () => { setTimeout(() => { paused.current = false; }, 3000); },
    onFocus: () => { paused.current = true; foldRef.current(); },
    onBlur: () => { paused.current = false; },
  };

  /** The cards to render: twice over while looping, the second pass marked as a clone. */
  const slots = <T,>(items: T[]) =>
    (loop ? [...items, ...items] : items).map((item, i) => ({ item, clone: i >= items.length }));

  return { rail, track, nudge, hold, loop, slots };
}
