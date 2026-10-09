"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Photo from "@/components/ui/Photo";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { discount } from "@/lib/price";
import { inr } from "@/lib/site";
import { forMode, priced } from "@/lib/wholesale";
import { categoryHref } from "@/lib/nav";
import type { Product } from "@/lib/types";

export interface CraftSection { id: number | string; name: string; slug: string; items: Product[] }

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The handicraft showcase — every handicraft category in one screen. A big
 * arched window holds the piece in the spotlight; beside it, the category
 * tabs, the piece's name, price and add button, and a strip of the other
 * pieces in that category. It moves on by itself every few seconds (not on
 * hover, focus, or for reduced motion), and works as well with one piece as
 * with twenty. Wholesale mode shows no add button, as elsewhere.
 */
export default function HandicraftRail({ sections, id = "handicraft" }: { sections: CraftSection[]; id?: string }) {
  const { addProduct, mode, href, wishlist, toggleFav } = useStore();
  /* At wholesale, only pieces with a wholesale price; a category left empty drops out. */
  const live = sections
    .map((s) => ({ ...s, items: forMode(s.items, mode === "wholesale") }))
    .filter((s) => s.items.length > 0);
  const [tab, setTab] = useState(0);
  const [pick, setPick] = useState(0);
  const [added, setAdded] = useState(false);
  const held = useRef(false);
  const strip = useRef<HTMLDivElement>(null);

  const sec = live[Math.min(tab, live.length - 1)];
  const items = sec?.items ?? [];
  const n = items.length;
  const i = n ? pick % n : 0;

  /* Step through the pieces of this category, then on to the next category. */
  const step = (dir: 1 | -1) => {
    if (dir === 1 && i === n - 1 && live.length > 1) { setTab((t) => (t + 1) % live.length); setPick(0); return; }
    if (dir === -1 && i === 0 && live.length > 1) {
      const prev = (tab - 1 + live.length) % live.length;
      setTab(prev); setPick(live[prev].items.length - 1); return;
    }
    setPick((i + dir + n) % n);
  };

  useEffect(() => {
    if (n + live.length <= 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!held.current && !document.hidden) step(1); }, 5200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, i, n, live.length]);

  /* Keep the active thumbnail in view inside its strip (never scroll the page). */
  useEffect(() => {
    const el = strip.current?.children[i] as HTMLElement | undefined;
    const box = strip.current;
    if (el && box) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [i, tab]);

  if (!sec) return null;
  const p = items[i];
  const view = priced(p, mode === "wholesale");
  const known = view.price > 0;
  const off = known ? discount(view.wholesale ? { ...p, price: view.price, mrp: view.mrp } : p) : 0;
  const saved = !!wishlist[mode][p.slug];
  const canBuy = known && mode !== "wholesale" && p.stock !== "out";
  const pieceHref = href(`/product/${p.slug}`);
  const hold = (on: boolean) => () => { held.current = on; };

  return (
    <section className="hcs" id={id} aria-label="Handicraft"
      onMouseEnter={hold(true)} onMouseLeave={hold(false)} onFocus={hold(true)} onBlur={hold(false)}>
      <span className="hcs__mark" aria-hidden="true">हाथ</span>
      <div className="hcs__in">
        {/* ---------- the stage ---------- */}
        <div className="hcs__stage">
          <div className="hcs__arch">
            {/* Every piece is in the window; only the active one shows, so switching cross-fades. */}
            {items.map((q, k) => (
              <Link key={`${sec.id}-${q.slug}`} href={href(`/product/${q.slug}`)} className={`hcs__img ph${k === i ? " on" : ""}`}
                aria-hidden={k !== i} tabIndex={k === i ? 0 : -1} aria-label={q.name}>
                <Photo src={q.images[0].src} alt={k === i ? q.name : ""} note={q.images[0].note}
                  sizes="(max-width:900px) 90vw, 520px" priority={false} />
              </Link>
            ))}
            {off > 0 && <span className="hcs__off"><b>{off}%</b><small>off</small></span>}
            <button type="button" className={`hcs__fav${saved ? " on" : ""}`} aria-pressed={saved}
              aria-label={`Save ${p.name}`} onClick={() => toggleFav(p, mode)}>
              <Icon name="heart" size={18} fill={saved ? "currentColor" : "none"} strokeWidth={1.6} />
            </button>
          </div>
          <div className="hcs__count" aria-live="polite">
            <b>{pad(i + 1)}</b><span>/ {pad(n)}</span>
            <span className="hcs__bar" aria-hidden="true"><i style={{ width: `${((i + 1) / n) * 100}%` }} /></span>
          </div>
        </div>

        {/* ---------- the counter ---------- */}
        <div className="hcs__info">
          <span className="hcs__eyebrow">Shaped by hand · Jaipur</span>
          <h2 className="hcs__title">From the <em>craft house.</em></h2>

          {live.length > 1 && (
            <div className="hcs__tabs" role="tablist" aria-label="Handicraft categories">
              {live.map((s, k) => (
                <button key={s.id} type="button" role="tab" aria-selected={k === tab}
                  className={`hcs__tab${k === tab ? " on" : ""}`} onClick={() => { setTab(k); setPick(0); }}>
                  {s.name}<small>{s.items.length}</small>
                </button>
              ))}
            </div>
          )}

          <div className="hcs__piece" key={`${sec.id}-${p.slug}`}>
            <span className="hcs__kicker">{p.label || sec.name}</span>
            <Link href={pieceHref} className="hcs__name">{p.name}</Link>
            {known && (
              <div className="hcs__price">
                <b>{inr(view.price)}</b>
                {view.mrp > view.price && <s>{inr(view.mrp)}</s>}
                {view.mrp > view.price && <span className="hcs__save">You save {inr(view.mrp - view.price)}</span>}
              </div>
            )}
            {p.stock === "low" && <span className="hcs__low">Only a few left</span>}
            <div className="hcs__acts">
              {canBuy && (
                <button type="button" className="hcs__add" onClick={() => {
                  addProduct(p); setAdded(true); setTimeout(() => setAdded(false), 1600);
                }}>
                  <Icon name={added ? "check" : "cart"} size={16} strokeWidth={1.9} />
                  {added ? "In your cart" : "Add to cart"}
                </button>
              )}
              <Link href={pieceHref} className="hcs__view">View piece <Icon name="right" size={14} strokeWidth={1.9} /></Link>
            </div>
          </div>

          <div className="hcs__more">
            <div className="hcs__strip" ref={strip}>
              {items.map((q, k) => (
                <button key={q.slug} type="button" className={`hcs__thumb ph${k === i ? " on" : ""}`}
                  onClick={() => setPick(k)} aria-label={`Show ${q.name}`} aria-current={k === i}>
                  <Photo src={q.images[0].src} alt="" sizes="84px" />
                </button>
              ))}
            </div>
            {n + live.length > 2 && (
              <div className="hcs__nav">
                <button type="button" onClick={() => step(-1)} aria-label="Previous piece"><Icon name="left" size={16} strokeWidth={1.8} /></button>
                <button type="button" onClick={() => step(1)} aria-label="Next piece"><Icon name="right" size={16} strokeWidth={1.8} /></button>
              </div>
            )}
          </div>

          <Link href={href(categoryHref(sec.slug))} className="hcs__all">
            All of {sec.name} <Icon name="right" size={14} strokeWidth={1.9} />
          </Link>
        </div>
      </div>
    </section>
  );
}
