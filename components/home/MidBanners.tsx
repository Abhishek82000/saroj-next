"use client";
import Link from "@/components/ui/SiteLink";
import { useEffect, useRef } from "react";
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

  useEffect(() => {
    const el = rail.current;
    if (!el || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (held.current || el.scrollWidth <= el.clientWidth + 2) return;
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      const step = card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || "0");
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" });
    }, 3500);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const hold = (on: boolean) => () => { held.current = on; };

  return (
    <section className="st-midb" aria-label="Offers">
      <div className="st-wrap">
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
