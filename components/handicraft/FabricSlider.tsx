"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HcSlide } from "@/lib/handicraft";

const AUTO_MS = 3800;

/**
 * The fabric shelf: every fabric category as a tall card on a snap rail that
 * slides itself along. Auto-advance pauses while it's off screen, while a
 * pointer is over it, and for a while after anyone drags or taps an arrow.
 */
export default function FabricSlider({ slides }: { slides: HcSlide[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const paused = useRef(false);
  const visible = useRef(false);
  const idleUntil = useRef(0);

  /* One card's width plus the gap — how far a single arrow press moves. */
  const step = useCallback(() => {
    const el = rail.current;
    const card = el?.querySelector<HTMLElement>(".hc-fslide");
    if (!el || !card) return 0;
    return card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
  }, []);

  const go = useCallback((dir: 1 | -1, user = true) => {
    const el = rail.current;
    if (!el) return;
    if (user) idleUntil.current = Date.now() + 8000;
    const end = el.scrollWidth - el.clientWidth;
    /* Past the last card, wrap back to the first rather than stopping. */
    if (dir === 1 && el.scrollLeft >= end - 4) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir === -1 && el.scrollLeft <= 4) el.scrollTo({ left: end, behavior: "smooth" });
    else el.scrollBy({ left: dir * step(), behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;

    const sync = () => {
      const end = el.scrollWidth - el.clientWidth;
      setProgress(end > 0 ? el.scrollLeft / end : 1);
      setAtStart(el.scrollLeft <= 4);
      setAtEnd(el.scrollLeft >= end - 4);
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);

    const hold = () => { idleUntil.current = Date.now() + 8000; };
    el.addEventListener("pointerdown", hold);
    el.addEventListener("wheel", hold, { passive: true });

    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0.3 });
    io.observe(el);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = reduced ? 0 : window.setInterval(() => {
      if (!visible.current || paused.current || Date.now() < idleUntil.current || document.hidden) return;
      go(1, false);
    }, AUTO_MS);

    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      el.removeEventListener("pointerdown", hold);
      el.removeEventListener("wheel", hold);
      io.disconnect();
      clearInterval(timer);
    };
  }, [go]);

  if (slides.length === 0) return null;

  return (
    <section className="hc-sec hc-fshelf" id="fabrics">
      <div className="hc-wrap">
        <div className="hc-fshelf__head">
          <div>
            <div className="hc-eyebrow rv">The fabric shelf</div>
            <h2 className="hc-h2 rv" data-d="1">Every bolt,<br />one slide away.</h2>
            <p className="hc-lede rv" data-d="2">
              {slides.length} collections of hand block printed cotton, cut from one metre. Slide through, or let it turn on its own.
            </p>
          </div>
          <div className="hc-fshelf__nav rv" data-d="2">
            <button type="button" className="hc-arrow" onClick={() => go(-1)} aria-label="Previous collections" disabled={atStart && atEnd}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <button type="button" className="hc-arrow" onClick={() => go(1)} aria-label="Next collections" disabled={atStart && atEnd}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className="hc-fshelf__rail"
        ref={rail}
        role="region"
        aria-label="Fabric collections"
        onPointerEnter={(e) => { if (e.pointerType === "mouse") paused.current = true; }}
        onPointerLeave={() => { paused.current = false; }}
        onFocus={() => { paused.current = true; }}
        onBlur={() => { paused.current = false; }}
      >
        {slides.map((s, i) => {
          const body = (
            <>
              <img src={s.img} alt={s.name} loading="lazy" draggable={false} />
              <span className="hc-fslide__num">{String(i + 1).padStart(2, "0")}</span>
              <span className="hc-fslide__body">
                <span className="hc-fslide__name">{s.name}</span>
                <span className="hc-fslide__meta">
                  {s.count ?? "Hand block printed"}
                  <i aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </i>
                </span>
              </span>
            </>
          );
          return s.href
            ? <Link key={s.href} href={s.href} className="hc-fslide" draggable={false}>{body}</Link>
            : <div key={s.name} className="hc-fslide">{body}</div>;
        })}
      </div>

      <div className="hc-wrap">
        <div className="hc-fshelf__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${Math.max(0.04, progress)})` }} />
        </div>
      </div>
    </section>
  );
}
