"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * Long copy clamped to `height` with a fade, and a "Show more" / "Show less"
 * toggle under it. Every word stays in the markup (it's there for search too);
 * the toggle only appears when the copy really is taller than the clamp.
 */
export default function ShowMore({ children, height = "9.5em", className = "" }: { children: ReactNode; height?: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);

  /* Re-checked on resize: a narrow screen wraps the same words into more lines. */
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const check = () => setLong(el.scrollHeight > el.clientHeight + 4 || open);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const clamped = !open && long;
  return (
    <div className={`st-more${clamped ? " is-clamped" : ""} ${className}`}>
      <div ref={box} id={id} className="st-more__box" style={open ? undefined : { maxHeight: height }}>
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
