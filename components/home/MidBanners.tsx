"use client";
import Link from "@/components/ui/SiteLink";
import { useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";
import type { BannerSlide } from "@/lib/types";

/**
 * `middle_slider` — small banners between the category rails. Three to a
 * view on desktop, one and a fifth on phones so the next one peeks in. It
 * steps along by itself, one banner at a time, and wraps back to the start;
 * it holds still while hovered, touched or focused, and for reduced motion.
 */
export default function MidBanners({ slides }: { slides: BannerSlide[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const held = useRef(false);

  /** One banner along, wrapping at either end. */
  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    const atStart = el.scrollLeft <= 4;
    if (dir === 1 && atEnd) return el.scrollTo({ left: 0, behavior: "smooth" });
    if (dir === -1 && atStart) return el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  useEffect(() => {
    const el = rail.current;
    if (!el || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (held.current || el.scrollWidth <= el.clientWidth + 2) return;
      nudge(1);
    }, 3500);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const hold = (on: boolean) => () => { held.current = on; };

  return (
    <section className="st-midb" aria-label="Offers">
      <div className="st-wrap st-railwrap">
        {slides.length > 1 && <>
          <button type="button" className="st-arrow st-arrow--side st-arrow--prev" onClick={() => nudge(-1)} aria-label="Previous banner"><Icon name="left" size={16} strokeWidth={1.8} /></button>
          <button type="button" className="st-arrow st-arrow--side st-arrow--next" onClick={() => nudge(1)} aria-label="Next banner"><Icon name="right" size={16} strokeWidth={1.8} /></button>
        </>}
        <div className="st-midb__rail" ref={rail}
          onMouseEnter={hold(true)} onMouseLeave={hold(false)}
          onTouchStart={hold(true)} onTouchEnd={hold(false)}
          onFocus={hold(true)} onBlur={hold(false)}>
          {slides.map((s) => {
            const pic = (
              <picture>
                <source media="(max-width:640px)" srcSet={s.mobileImage} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={s.alt} loading="lazy" />
              </picture>
            );
            return s.href
              ? <Link key={s.id} href={s.href} className="st-midb__card">{pic}</Link>
              : <div key={s.id} className="st-midb__card">{pic}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
