"use client";
import { useEffect, useRef } from "react";

/**
 * The `.rv` scroll-in used across the page, as a component so every section
 * doesn't re-implement the observer.
 */
export default function Reveal({
  as: Tag = "div", delay, className = "", children, ...rest
}: { as?: React.ElementType; delay?: 1 | 2 | 3 | 4; className?: string; children: React.ReactNode } & Record<string, unknown>) {
  const el = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = el.current;
    if (!node) return;
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.13, rootMargin: "0px 0px -7% 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return <Tag ref={el} className={`rv ${className}`.trim()} data-d={delay} {...rest}>{children}</Tag>;
}
