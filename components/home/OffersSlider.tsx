"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { useStore } from "@/components/shell/StoreProvider";
import type { OfferSlide } from "@/lib/offers";

const EVERY = 4200; // ms per step — the progress segment's fill time drives the auto-slide

/**
 * Home: the live offers (GET /api/offers — coupons, cart-milestone steps, free
 * shipping) as a rail of coupon tickets. Three at a time on desktop, one and a
 * half on phones so the next ticket peeks in.
 *
 * Auto-slides one ticket at a time: the active progress segment fills over
 * EVERY ms and moving on happens when its fill ends — so pausing (hover,
 * touch, focus, off-screen, hidden tab) is just pausing that animation.
 * Wraps back to the start at the end. Never auto-slides for reduced motion.
 * Tapping a coupon's code copies it and applies it to the cart.
 */
export default function OffersSlider({ slides }: { slides: OfferSlide[] }) {
  const { setCoupon, say } = useStore();
  const rail = useRef<HTMLDivElement>(null);
  const reduce = useRef(false);
  const [stops, setStops] = useState<number[]>([0]);
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const paused = hold || !inView || hidden;

  /* Where the rail can stop: each ticket's start, capped at the furthest it can scroll. */
  const measure = useCallback(() => {
    const el = rail.current;
    if (!el || !el.children.length) return;
    const cards = Array.from(el.children) as HTMLElement[];
    const first = cards[0].offsetLeft;
    const max = el.scrollWidth - el.clientWidth;
    const next = [...new Set(cards.map((c) => Math.round(Math.min(c.offsetLeft - first, max))))];
    setStops(next);
  }, []);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = rail.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => { ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, [measure]);

  /* Manual swipes move the progress along too. */
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        let best = 0;
        stops.forEach((s, i) => { if (Math.abs(s - el.scrollLeft) < Math.abs(stops[best] - el.scrollLeft)) best = i; });
        setIndex((prev) => (prev === best ? prev : best));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { el.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [stops]);

  const go = (i: number) => {
    const n = stops.length;
    const target = ((i % n) + n) % n;
    rail.current?.scrollTo({ left: stops[target], behavior: "smooth" });
    setIndex(target);
    setCycle((c) => c + 1);
  };

  const copy = async (code: string) => {
    try { await navigator.clipboard.writeText(code); } catch { /* still applied below */ }
    setCoupon(code);
    setCopied(code);
    say(`${code} copied — it's applied to your cart`);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 2200);
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className={`st-sec st-ofrs${paused ? " paused" : ""}`} aria-roledescription="carousel" aria-labelledby="ofrs-h"
      style={{ ["--every" as string]: `${EVERY}ms` }}>
      <div className="st-wrap">
        <div className="st-ofrs__head">
          <div>
            <Reveal className="st-eyebrow">Offers on the counter</Reveal>
            <Reveal as="h2" delay={1} className="st-h2" id="ofrs-h">Savings, <em>cut to size.</em></Reveal>
          </div>
          <div className="st-ofrs__arrows">
            <button type="button" className="st-arrow" onClick={() => go(index - 1)} aria-label="Previous offer">
              <Icon name="left" size={16} strokeWidth={1.8} />
            </button>
            <button type="button" className="st-arrow" onClick={() => go(index + 1)} aria-label="Next offer">
              <Icon name="right" size={16} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <Reveal delay={2} className="st-ofrs__reveal">
        <div className="st-ofrs__rail" ref={rail}
          onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
          onTouchStart={() => setHold(true)} onTouchEnd={() => setTimeout(() => setHold(false), 3500)}
          onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
          {slides.map((s, i) => (
            <div key={s.key} className="st-ofrs__slide" style={{ ["--i" as string]: Math.min(i, 4) }}
              aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
              <article className={`st-ofr st-ofr--${s.tone}`}>
                <div className="st-ofr__top">
                  <svg className="st-ofr__ring" viewBox="0 0 120 120" aria-hidden="true">
                    <circle cx="60" cy="60" r="56" />
                    <circle cx="60" cy="60" r="44" strokeDasharray="2 5" />
                    <circle cx="60" cy="60" r="30" />
                    {Array.from({ length: 12 }, (_, k) => (
                      <ellipse key={k} cx="60" cy="23" rx="5" ry="10" transform={`rotate(${k * 30} 60 60)`} />
                    ))}
                  </svg>
                  <span className="st-ofr__kick">{s.kicker}</span>
                  <p className="st-ofr__big"><b>{s.big}</b><small>{s.bigSub}</small></p>
                  <h3>{s.title}</h3>
                  {s.text && <p className="st-ofr__text">{s.text}</p>}
                  {s.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="st-ofr__gift" src={s.image} alt="" loading="lazy" />
                  )}
                </div>
                <div className="st-ofr__stub">
                  {s.terms.length > 0 && <p className="st-ofr__terms">{s.terms.join(" · ")}</p>}
                  {s.code ? (
                    <button type="button" className={`st-ofr__code${copied === s.code ? " done" : ""}`} onClick={() => copy(s.code!)}
                      aria-label={`Copy code ${s.code} and apply it to your cart`}>
                      <code>{s.code}</code>
                      <span>{copied === s.code ? <><Icon name="check" size={13} strokeWidth={2.4} /> Copied</> : "Tap to copy"}</span>
                    </button>
                  ) : (
                    <Link href={s.cta.href} className="st-ofr__cta">
                      {s.cta.label}<Icon name="right" size={14} strokeWidth={1.8} />
                    </Link>
                  )}
                </div>
              </article>
            </div>
          ))}
        </div>
        </Reveal>

        {stops.length > 1 && (
          <div className="st-ofrs__foot">
            <div className="st-ofrs__prog">
              {stops.map((_, i) => (
                <button type="button" key={i} onClick={() => go(i)} aria-label={`Go to offer ${i + 1}`}
                  aria-current={i === index} className={i < index ? "done" : i === index ? "on" : ""}>
                  {i === index && (
                    <i key={cycle} onAnimationEnd={() => { if (!reduce.current) go(index + 1); }} />
                  )}
                </button>
              ))}
            </div>
            <span className="st-ofrs__count"><b>{pad(index + 1)}</b> / {pad(stops.length)}</span>
          </div>
        )}
      </div>
    </section>
  );
}
