"use client";
import Link from "next/link";
import { useState } from "react";
import Photo from "@/components/ui/Photo";
import Icon from "@/components/ui/Icon";
import { useStore, type Mode } from "@/components/shell/StoreProvider";
import { discount } from "@/lib/products";
import { inr, unitLabel } from "@/lib/site";
import { priced, wholesaleHref } from "@/lib/wholesale";
import { craftBy } from "@/lib/crafts";
import type { Product } from "@/lib/types";

/** `mode` pins the card to one mode's prices and wishlist regardless of the
    URL — the account page shows the wholesale wishlist from a retail path. */
export default function ProductCard({ p, priority, mode: pinned }: { p: Product; priority?: boolean; mode?: Mode }) {
  const store = useStore();
  const { addProduct, wishlist, toggleFav } = store;
  const mode = pinned ?? store.mode;
  const href = (h: string) => (mode === "wholesale" ? wholesaleHref(h) : h);
  const [added, setAdded] = useState(false);
  const view = priced(p, mode === "wholesale");
  const off = discount(view.wholesale ? { ...p, price: view.price, mrp: view.mrp } : p);
  const out = p.stock === "out";
  const saved = !!wishlist[mode][p.slug];

  return (
    <article className="st-card in" data-id={p.slug}>
      <Link className="st-card__ph ph" href={href(`/product/${p.slug}`)} aria-label={p.name}>
        <Photo src={p.images[0].src} alt={p.name} note={p.images[0].note} priority={priority}
          sizes="(max-width:640px) 50vw, (max-width:1000px) 33vw, 260px" />
      </Link>

      <span className={`st-card__kind${p.kind === "craft" ? " craft" : ""}`}>
        {p.label || (p.kind === "craft" ? "Handicraft" : "Fabric")}
      </span>
      {off > 0 && <span className="st-card__off">{off}% off</span>}

      <button type="button" className={`st-card__fav${saved ? " on" : ""}`} aria-pressed={saved}
        aria-label={`Save ${p.name}`} onClick={() => toggleFav(p, mode)}>
        <Icon name="heart" size={14} fill={saved ? "currentColor" : "none"} strokeWidth={1.6} />
      </button>

      <div className="st-card__body">
        <span className="st-card__craft">{craftBy[p.craft]?.name}</span>
        <h3 className="st-card__n"><Link href={href(`/product/${p.slug}`)}>{p.name}</Link></h3>
        {view.price > 0 && (
          <span className="st-card__p">
            <b>{inr(view.price)}</b>
            {view.mrp > 0 && <s>{inr(view.mrp)}</s>}
            <em>{unitLabel(p.unit)}{view.wholesale ? " · +GST" : ""}</em>
          </span>
        )}
      </div>
      {view.wholesale ? null : (
        <button type="button" className="st-card__add" disabled={out}
          onClick={() => {
            addProduct(p);
            setAdded(true);
            setTimeout(() => setAdded(false), 1600);
          }}>
          {out ? "Sold out" : added ? "In your cart" : "Add to cart"}
        </button>
      )}
    </article>
  );
}
