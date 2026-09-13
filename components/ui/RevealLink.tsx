"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * A Next link that scroll-reveals itself. Separate from <Reveal> because a
 * server component can't hand a component type across the client boundary.
 */
export default function RevealLink({
  href, className = "", delay, children, ...rest
}: { href: string; className?: string; delay?: 1 | 2 | 3 | 4; children: React.ReactNode } & Record<string, unknown>) {
  const el = useRef<HTMLAnchorElement>(null);

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

  return <Link ref={el} href={href} className={`rv ${className}`.trim()} data-d={delay} {...rest}>{children}</Link>;
}
