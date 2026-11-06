"use client";
import { useEffect, useRef, useState } from "react";

/**
 * The timeline's thread: a line that draws itself down the page as the
 * visitor scrolls through the chapters. Sets `--p` (0–1) on the wrapper;
 * the CSS scales the line and lights each knot once the thread reaches it.
 */
export function Thread({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.style.setProperty("--p", "1");
      node.querySelectorAll<HTMLElement>("[data-knot]").forEach((k) => k.classList.add("is-lit"));
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = node.getBoundingClientRect();
      /* The thread's tip sits at 60% of the screen height. */
      const tip = window.innerHeight * 0.6;
      const p = Math.min(1, Math.max(0, (tip - r.top) / r.height));
      node.style.setProperty("--p", p.toFixed(4));
      node.querySelectorAll<HTMLElement>("[data-knot]").forEach((k) => {
        k.classList.toggle("is-lit", k.getBoundingClientRect().top < tip);
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return <div ref={el} className={className}>{children}</div>;
}

/** A number that counts up from zero the first time it scrolls into view. */
export function CountUp({ to, suffix = "", group = true }: { to: number; suffix?: string; group?: boolean }) {
  const el = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(to);

  useEffect(() => {
    const node = el.current;
    if (!node || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    /* The server renders the final figure (for search and no-JS); start from zero only once JS is here. */
    setN(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const dur = 1800;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        setN(Math.round(to * (1 - Math.pow(1 - t, 4))));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(node);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);

  return <span ref={el}>{group ? n.toLocaleString("en-IN") : n}{suffix}</span>;
}
