"use client";
import Icon from "@/components/ui/Icon";

/** Pixels the track moves per ms of animation time (along its main axis), sampled at two points of one pass. */
function measure(a: Animation, el: HTMLElement) {
  const timing = a.effect?.getComputedTiming();
  const dur = typeof timing?.duration === "number" ? timing.duration : 0;
  if (!dur) return null;
  const pos = () => { const m = new DOMMatrix(getComputedStyle(el).transform); return { x: m.m41, y: m.m42 }; };
  const keep = a.currentTime;
  a.currentTime = 0;
  const p0 = pos();
  a.currentTime = dur / 2;
  const p1 = pos();
  a.currentTime = keep;
  const dx = p1.x - p0.x, dy = p1.y - p0.y;
  const vertical = Math.abs(dy) > Math.abs(dx);
  const rate = (vertical ? dy : dx) / (dur / 2);
  return Math.abs(rate) > 1e-6 ? { rate, dur, vertical } : null;
}

/** One item's width (or height) plus the gap after it. */
function itemSize(el: HTMLElement, vertical: boolean) {
  const first = el.firstElementChild as HTMLElement | null;
  if (!first) return vertical ? el.clientHeight * 0.8 : el.clientWidth * 0.8;
  const cs = getComputedStyle(el);
  const gap = parseFloat((vertical ? cs.rowGap : cs.columnGap) || "0") || 0;
  return (vertical ? first.offsetHeight : first.offsetWidth) + gap;
}

/**
 * Moves every `data-marquee` track inside `root` one item along: `dir` 1 brings
 * the next item in from the right (or below), -1 goes back. It scrubs the CSS
 * animation's own clock, as the touch drag does (MarqueeDrag), so the loop
 * stays seamless. A track with no running loop (reduced motion makes these
 * plain scrollers) is scrolled instead.
 */
export function stepMarquees(root: Element | null, dir: 1 | -1) {
  root?.querySelectorAll<HTMLElement>("[data-marquee]").forEach((el) => {
    const a = el.getAnimations().find((x) => x.effect?.getComputedTiming().iterations === Infinity);
    const m = a && measure(a, el);
    if (!a || !m) {
      const scroller = el.parentElement;
      scroller?.scrollBy({ left: dir * Math.round(scroller.clientWidth * 0.8), behavior: "smooth" });
      return;
    }
    const total = (-dir * itemSize(el, m.vertical)) / m.rate; // ms of animation time to move by
    const wrap = (t: number) => ((t % m.dur) + m.dur) % m.dur;
    const start = performance.now(), length = 450;
    let done = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / length);
      const eased = 1 - Math.pow(1 - p, 3);
      a.currentTime = wrap((Number(a.currentTime) || 0) + (eased - done) * total);
      done = eased;
      if (p < 1 && el.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/**
 * Prev / next buttons for a CSS marquee section. `scope` is a selector for the
 * nearest ancestor that holds the marquee(s) these buttons drive. `side` sets
 * them at the strip's left and right ends (the scope must be positioned), as
 * on the product rails; otherwise they sit together, for a section heading.
 */
export default function MarqueeArrows({ scope, side = false, className = "", label = "items" }: {
  scope: string; side?: boolean; className?: string; label?: string;
}) {
  const go = (dir: 1 | -1) => (e: React.MouseEvent<HTMLButtonElement>) => stepMarquees(e.currentTarget.closest(scope), dir);
  const btn = (where: "prev" | "next") => `st-arrow${side ? ` st-arrow--side st-arrow--${where}` : ""}`;
  return (
    <span className={`st-mqnav${side ? " st-mqnav--side" : ""} ${className}`}>
      <button type="button" className={btn("prev")} onClick={go(-1)} aria-label={`Previous ${label}`}><Icon name="left" size={16} strokeWidth={1.8} /></button>
      <button type="button" className={btn("next")} onClick={go(1)} aria-label={`Next ${label}`}><Icon name="right" size={16} strokeWidth={1.8} /></button>
    </span>
  );
}
