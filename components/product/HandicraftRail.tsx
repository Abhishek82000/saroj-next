"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
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
/** A lane needs at least this many tags in one pass, so the loop is wider than the screen with no gap. */
const MIN_SLOTS = 10;
/** Seconds each tag takes to drift its own width; sets the speed no matter how many pieces a lane has. */
const SECS_PER_SLOT = 4.2;

/** One pass of a lane: every piece, repeated until the pass is wide enough.
    Only the first round is real to assistive tech; the repeats are visual filler. */
const passOf = (items: Product[]) => {
  const out: { p: Product; copy: boolean }[] = [];
  for (let round = 0; out.length < MIN_SLOTS; round++) for (const p of items) out.push({ p, copy: round > 0 });
  return out;
};

/**
 * The handicraft bazaar, one screen tall: each handicraft category is a
 * titled lane, and under the title its pieces hang from a cord like
 * hand-tied shop tags, drifting along in an endless loop. Neighbouring lanes
 * run in opposite directions. A lane stops while it is hovered or focused,
 * stops when it is off screen, and doesn't move at all for reduced motion
 * (it becomes a plain scroller instead). Cards shrink with the number of
 * lanes so the whole section fits the screen. Wholesale mode shows no add
 * button, as elsewhere.
 */
export default function HandicraftRail({ sections, id = "handicraft" }: { sections: CraftSection[]; id?: string }) {
  const { mode } = useStore();
  /* At wholesale, only pieces with a wholesale price; a category left empty drops out. */
  const live = sections
    .map((s) => ({ ...s, items: forMode(s.items, mode === "wholesale") }))
    .filter((s) => s.items.length > 0);
  if (!live.length) return null;

  return (
    <section className="hcs" id={id} aria-label="Handicraft" style={{ "--hcs-lanes": live.length } as CSSProperties}>
      <span className="hcs__mark" aria-hidden="true">हस्तकला</span>
      <header className="hcs__head">
        <span className="hcs__eyebrow">Shaped by hand · Jaipur</span>
        <h2 className="hcs__title">The craft <em>bazaar.</em></h2>
      </header>
      <div className="hcs__lanes">
        {live.map((s, k) => <Lane key={s.id} sec={s} index={k} />)}
      </div>
    </section>
  );
}

function Lane({ sec, index }: { sec: CraftSection; index: number }) {
  const { href } = useStore();
  const rope = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  /* Only drift while the lane is on screen. */
  useEffect(() => {
    const el = rope.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { rootMargin: "80px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pass = passOf(sec.items);
  const n = sec.items.length;
  const style = { "--hcs-dur": `${pass.length * SECS_PER_SLOT}s` } as CSSProperties;
  const titleId = `hcs-cat-${sec.id}`;

  return (
    <div className={`hcs__lane${index % 2 ? " rev" : ""}`} role="group" aria-labelledby={titleId}>
      {/* the category's own title, above its pieces */}
      <div className="hcs__lanehead">
        <div className="hcs__lanetitle">
          <span className="hcs__no">{pad(index + 1)}</span>
          <h3 className="hcs__cat" id={titleId}>{sec.name}</h3>
          <span className="hcs__qty">{n} {n === 1 ? "piece" : "pieces"}</span>
        </div>
        <Link href={href(categoryHref(sec.slug))} className="hcs__all">View all <Icon name="right" size={14} strokeWidth={1.9} /></Link>
      </div>
      <div className="hcs__rope" ref={rope} data-run={seen || undefined}>
        <ul className="hcs__track" style={style}>
          {/* The pass twice over: the track slides by exactly one pass, then starts again, with no seam. */}
          {[0, 1].map((half) => pass.map(({ p, copy }, k) => (
            <Tag key={`${half}-${k}`} p={p} copy={half === 1 || copy}
              style={{ "--hcs-d": `${-((k * 0.73) % 3.2).toFixed(2)}s` } as CSSProperties} />
          )))}
        </ul>
      </div>
    </div>
  );
}

function Tag({ p, copy, style }: { p: Product; copy: boolean; style: CSSProperties }) {
  const { addProduct, mode, href, wishlist, toggleFav } = useStore();
  const [added, setAdded] = useState(false);
  const view = priced(p, mode === "wholesale");
  const known = view.price > 0;
  const off = known ? discount(view.wholesale ? { ...p, price: view.price, mrp: view.mrp } : p) : 0;
  const saved = !!wishlist[mode][p.slug];
  const canBuy = known && mode !== "wholesale" && p.stock !== "out";
  /* Repeats stay clickable with the mouse, but are skipped by keyboard and screen readers. */
  const tab = copy ? -1 : undefined;
  const badge = p.stock === "low" ? "Only a few left" : p.stock === "out" ? "Sold out" : p.label;

  return (
    <li className="hcs__slot" style={style} aria-hidden={copy || undefined}>
      <article className="hcs__tag">
        <span className="hcs__ring" aria-hidden="true" />
        <div className="hcs__img ph">
          <Photo src={p.images[0].src} alt="" note={p.images[0].note} sizes="(max-width:700px) 160px, 230px" />
          {badge && <span className="hcs__badge">{badge}</span>}
        </div>
        <button type="button" className={`hcs__fav${saved ? " on" : ""}`} aria-pressed={saved} tabIndex={tab}
          aria-label={`Save ${p.name}`} onClick={() => toggleFav(p, mode)}>
          <Icon name="heart" size={15} fill={saved ? "currentColor" : "none"} strokeWidth={1.7} />
        </button>
        {canBuy && (
          <button type="button" className={`hcs__add${added ? " on" : ""}`} tabIndex={tab}
            aria-label={added ? `${p.name} is in your cart` : `Add ${p.name} to cart`}
            onClick={() => { addProduct(p); setAdded(true); setTimeout(() => setAdded(false), 1600); }}>
            <Icon name={added ? "check" : "cart"} size={16} strokeWidth={1.9} />
          </button>
        )}
        {/* the name's link stretches over the whole card, so anywhere on it opens the piece */}
        <Link href={href(`/product/${p.slug}`)} className="hcs__name" tabIndex={tab}>{p.name}</Link>
        {known && (
          <span className="hcs__price">
            <b>{inr(view.price)}</b>
            {view.mrp > view.price && <s>{inr(view.mrp)}</s>}
            {off > 0 && <small>{off}% off</small>}
          </span>
        )}
      </article>
    </li>
  );
}
