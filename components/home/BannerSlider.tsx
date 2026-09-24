"use client";
import Link from "@/components/ui/SiteLink";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import type { BannerSlide } from "@/lib/types";

/** The home pages' top banners (retail `top_slider`, and the wholesale
    feed's) — one at a time, arrows and dots when there's more than one,
    moving on by itself unless the pointer is on it or the visitor prefers
    reduced motion. */
export default function BannerSlider({ slides, label = "Offers" }: { slides: BannerSlide[]; label?: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const many = slides.length > 1;
  const go = (n: number) => setI((n + slides.length) % slides.length);

  useEffect(() => {
    if (!many || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [many, paused, slides.length]);

  return (
    <section className="st-wh__hero" aria-roledescription="carousel" aria-label={label}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="st-wh__slides" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, k) => {
          const pic = (
            <picture>
              <source media="(max-width:640px)" srcSet={s.mobileImage} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt={s.alt} loading={k === 0 ? "eager" : "lazy"} />
            </picture>
          );
          return (
            <div className="st-wh__slide" key={s.id} aria-hidden={k !== i} role="group" aria-label={`${k + 1} of ${slides.length}`}>
              {s.href ? <Link href={s.href} tabIndex={k === i ? 0 : -1}>{pic}</Link> : pic}
            </div>
          );
        })}
      </div>

      {many && (
        <>
          <button type="button" className="st-wh__nav prev" onClick={() => go(i - 1)} aria-label="Previous banner">
            <Icon name="left" size={16} strokeWidth={1.8} />
          </button>
          <button type="button" className="st-wh__nav next" onClick={() => go(i + 1)} aria-label="Next banner">
            <Icon name="right" size={16} strokeWidth={1.8} />
          </button>
          <div className="st-wh__dots">
            {slides.map((s, k) => (
              <button key={s.id} type="button" className={k === i ? "on" : undefined}
                onClick={() => setI(k)} aria-label={`Banner ${k + 1}`} aria-current={k === i} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
