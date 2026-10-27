"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * Long copy clamped to `height` with a fade, and a "Show more" / "Show less"
 * toggle under it. Every word stays in the markup (it's there for search too);
 * the toggle only appears when the copy really is taller than the clamp.
 * With `fraction`, the clamp is that share of the first paragraph's own height
 * (e.g. 0.75 shows three quarters of it) instead of a fixed `height`.
 */
export default function ShowMore({ children, height = "9.5em", fraction, className = "" }: { children: ReactNode; height?: string; fraction?: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const [firstH, setFirstH] = useState<number | null>(null);

  /* Re-checked on resize: a narrow screen wraps the same words into more lines. */
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const check = () => {
      const first = el.firstElementChild;
      /* Any top margin above the first paragraph counts in full; only its text is cut to the fraction. */
      if (fraction && first) {
        const r = first.getBoundingClientRect();
        setFirstH(r.top - el.getBoundingClientRect().top + r.height * fraction);
      }
      setLong(el.scrollHeight > el.clientHeight + 4 || open);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, fraction]);

  const clamped = !open && long;
  const max = fraction && firstH ? `${Math.round(firstH)}px` : height;
  return (
    <div className={`st-more${clamped ? " is-clamped" : ""} ${className}`}>
      <div ref={box} id={id} className="st-more__box" style={open ? undefined : { maxHeight: max }}>
        {children}
      </div>
      {long && (
        <button type="button" className="st-more__btn" aria-expanded={open} aria-controls={id}
          onClick={() => {
            setOpen(!open);
            /* Collapsing from far down: bring the start of the copy back into view. */
            if (open) box.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }}>
          {open ? "Show less" : "Show more"}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"
            style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform .3s" }}><path d="m6 9 6 6 6-6" /></svg>
        </button>
      )}
    </div>
  );
}
