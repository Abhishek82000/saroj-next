"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Photo from "@/components/ui/Photo";
import { useAutoRail } from "@/components/ui/useAutoRail";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { useStore } from "@/components/shell/StoreProvider";
import { discount } from "@/lib/price";
import { inr } from "@/lib/site";
import { priced } from "@/lib/wholesale";
import type { Product } from "@/lib/types";

/**
 * Handicraft rail — same card language as the store's other rails
 * (white cards, full-bleed photo, dark add button, edge arrows),
 * finished with a warm woven-linen ground and a second photo on hover.
 * Logic unchanged: auto-slide, wholesale pricing, wishlist, add to cart.
 */
export default function HandicraftRail({
  eyebrow, heading, items, id,
}: { eyebrow: string; heading: string; items: Product[]; id?: string }) {
  const { addProduct, mode, href, wishlist, toggleFav } = useStore();
  const { rail, nudge, hold } = useAutoRail(items.length);
  const [pos, setPos] = useState({ start: true, end: true, fits: true });

  const measure = () => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setPos({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2, fits: max <= 2 });
  };

  useEffect(() => {
    measure();
    const el = rail.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <section className="hnd" id={id} aria-label={heading}>
      <div className="hnd-inner">
        <header className="hnd-head">
          <div>
            <Reveal className="hnd-eyebrow">{eyebrow}</Reveal>
            <Reveal as="h2" delay={1} className="hnd-title">{heading}</Reveal>
            <Reveal as="p" delay={2} className="hnd-lede">
              Carved, cast and hand-finished by artisan families. Every piece carries the marks of the hands that made it.
            </Reveal>
          </div>
          <Link href={href(`/handicraft`)} className="hnd-all">
            <span>View all</span>
            <Icon name="right" size={14} strokeWidth={1.5} />
          </Link>
        </header>

        <div className="hnd-stage">
          {!pos.fits && (
            <>
              <button type="button" className="hnd-arrow hnd-arrow--prev" data-off={pos.start}
                onClick={() => nudge(-1)} aria-label="Previous pieces">
                <Icon name="left" size={16} strokeWidth={1.4} />
              </button>
              <button type="button" className="hnd-arrow hnd-arrow--next" data-off={pos.end}
                onClick={() => nudge(1)} aria-label="Next pieces">
                <Icon name="right" size={16} strokeWidth={1.4} />
              </button>
            </>
          )}

          <div className="hnd-rail" ref={rail} onScroll={measure} {...hold}>
            {items.map((p) => {
              const view = priced(p, mode === "wholesale");
              /* A piece the API sent without a price shows no price, never a made-up ₹0. */
              const known = view.price > 0;
              const off = known ? discount(view.wholesale ? { ...p, price: view.price, mrp: view.mrp } : p) : 0;
              const saved = !!wishlist[mode][p.slug];
              const canBuy = known && mode !== "wholesale";
              const second = p.images[1];
              return (
                <article className="hnd-card" key={p.slug}>
                  <div className="hnd-media">
                    <Link href={href(`/product/${p.slug}`)} className="hnd-ph ph" aria-label={p.name}>
                      <span className="hnd-img hnd-img--a">
                        <Photo src={p.images[0].src} alt={p.name} note={p.images[0].note} sizes="(max-width:640px) 70vw, 280px" />
                      </span>
                      {second && (
                        <span className="hnd-img hnd-img--b" aria-hidden>
                          <Photo src={second.src} alt="" note={second.note} sizes="(max-width:640px) 70vw, 280px" />
                        </span>
                      )}
                    </Link>

                    <div className="hnd-tags">
                      {off > 0 ? <span className="hnd-off">{off}% off</span> : <span />}
                      <button type="button" className={`hnd-fav${saved ? " is-on" : ""}`}
                        aria-pressed={saved} aria-label={`Save ${p.name}`} onClick={() => toggleFav(p, mode)}>
                        <Icon name="heart" size={16} fill={saved ? "currentColor" : "none"} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>

                  <div className="hnd-body">
                    <Link href={href(`/product/${p.slug}`)} className="hnd-name">{p.name}</Link>
                    {known && (
                      <div className="hnd-price">
                        <b>{inr(view.price)}</b>
                        {view.mrp > 0 && <s>{inr(view.mrp)}</s>}
                      </div>
                    )}
                    {canBuy && (
                      <button type="button" className="hnd-add" aria-label={`Add ${p.name} to cart`} onClick={() => addProduct(p)}>
                        Add to cart
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}