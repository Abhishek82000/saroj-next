"use client";
import { useEffect } from "react";

/**
 * Touch drag for the CSS marquees. Any element marked `data-marquee` that runs an
 * endless linear keyframe slide can be dragged with a finger: the drag scrubs the
 * animation's own clock (`currentTime`), so the loop stays seamless and the CSS
 * keeps owning the motion. A flick carries on with a little momentum, then the
 * marquee picks up again from wherever it was let go.
 * Mounted once in the shell; works through event delegation, so server-rendered
 * marquees only need the attribute.
 */
export default function MarqueeDrag() {
  useEffect(() => {
    let track: HTMLElement | null = null;
    let anim: Animation | null = null;
    let id = -1, x0 = 0, y0 = 0, t0 = 0, dur = 0, rate = 0;
    let dragging = false, lastX = 0, lastAt = 0, vel = 0, glide = 0, draggedAt = 0;

    const pos = (el: HTMLElement) => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return { x: m.m41, y: m.m42 };
    };
    const wrap = (t: number) => ((t % dur) + dur) % dur;

    /* Pixels the track moves per ms of animation time, sampled at two points of one pass. */
    const measure = (a: Animation, el: HTMLElement) => {
      const timing = a.effect?.getComputedTiming();
      const d = typeof timing?.duration === "number" ? timing.duration : 0;
      if (!d) return false;
      const keep = a.currentTime;
      a.currentTime = 0;
      const p0 = pos(el);
      a.currentTime = d / 2;
      const p1 = pos(el);
      a.currentTime = keep;
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      /* Horizontal marquees only: a vertical one would fight the page scroll. */
      if (Math.abs(dx) < Math.abs(dy)) return false;
      rate = dx / (d / 2);
      dur = d;
      return Math.abs(rate) > 1e-6;
    };

    const release = () => {
      if (track) track.style.animationPlayState = "";
      track = null; anim = null; dragging = false; id = -1;
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || id !== -1) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-marquee]");
      if (!el) return;
      const a = el.getAnimations().find((x) => x.effect?.getComputedTiming().iterations === Infinity);
      if (!a) return;
      cancelAnimationFrame(glide);
      release();
      track = el; anim = a; id = e.pointerId;
      x0 = e.clientX; y0 = e.clientY;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== id || !track || !anim) return;
      if (!dragging) {
        /* Only take over once the finger clearly moves along the marquee. */
        if (Math.abs(e.clientX - x0) < 8 || Math.abs(e.clientX - x0) < Math.abs(e.clientY - y0)) return;
        if (!measure(anim, track)) return release();
        dragging = true;
        track.style.animationPlayState = "paused";
        t0 = Number(anim.currentTime) || 0;
        x0 = e.clientX; y0 = e.clientY;
        lastX = e.clientX; lastAt = e.timeStamp; vel = 0;
        return;
      }
      anim.currentTime = wrap(t0 + (e.clientX - x0) / rate);
      const dt = e.timeStamp - lastAt;
      if (dt > 0) vel = vel * 0.6 + ((e.clientX - lastX) / dt) * 0.4;
      lastX = e.clientX; lastAt = e.timeStamp;
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      if (!dragging || !anim || !track) return release();
      draggedAt = performance.now();
      const a = anim, el = track;
      id = -1;
      /* A flick keeps going and eases out before the marquee resumes. */
      let v = e.type === "pointercancel" ? 0 : vel, last = performance.now();
      const step = (now: number) => {
        const dt = Math.min(now - last, 64);
        last = now;
        v *= Math.pow(0.94, dt / 16);
        if (Math.abs(v) < 0.02 || !el.isConnected) {
          if (track === el) release();
          return;
        }
        a.currentTime = wrap((Number(a.currentTime) || 0) + (v * dt) / rate);
        glide = requestAnimationFrame(step);
      };
      glide = requestAnimationFrame(step);
    };

    /* A drag that ends over a link mustn't follow it. */
    const onClick = (e: MouseEvent) => {
      if (performance.now() - draggedAt < 350) { e.preventDefault(); e.stopPropagation(); }
    };

    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointercancel", onUp, { passive: true });
    document.addEventListener("click", onClick, true);
    return () => {
      cancelAnimationFrame(glide);
      release();
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
