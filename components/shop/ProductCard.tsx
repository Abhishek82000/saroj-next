"use client";
import Link from "next/link";
import { useState } from "react";
import Photo from "@/components/ui/Photo";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { discount } from "@/lib/products";
import { inr, unitLabel } from "@/lib/site";
import { craftBy } from "@/lib/crafts";
import type { Product } from "@/lib/types";

const stockLine: Record<string, string> = {
  in: "Ready to ship",
  low: "Only a few left",
  out: "Back at the next firing",
};

export default function ProductCard({ p, priority }: { p: Product; priority?: boolean }) {
  const { add, favs, toggleFav } = useStore();
  const [added, setAdded] = useState(false);
  const off = discount(p);
  const out = p.stock === "out";
  const saved = !!favs[p.slug];

  /** Fabric goes in at a sensible starting cut; a piece goes in as one. */
  const startingQty = p.cut ? 2.5 : 1;

  return (
    <article className="st-card in" data-id={p.slug}>
      <Link className="st-card__ph ph" href={`/product/${p.slug}`} aria-label={p.name}>
        <Photo src={p.images[0].src} alt={p.name} note={p.images[0].note} priority={priority}
          sizes="(max-width:640px) 50vw, (max-width:1000px) 33vw, 260px" />
      </Link>

      <span className={`st-card__kind${p.kind === "craft" ? " craft" : ""}`}>
        {p.kind === "craft" ? "Handicraft" : "Fabric"}
      </span>
      {off > 0 && <span className="st-card__off">{off}% off</span>}

      <button type="button" className={`st-card__fav${saved ? " on" : ""}`} aria-pressed={saved}
        aria-label={`Save ${p.name}`} onClick={() => toggleFav(p.slug)}>
        <Icon name="heart" size={14} fill={saved ? "currentColor" : "none"} strokeWidth={1.6} />
      </button>

      <button type="button" className="st-card__add" disabled={out}
        onClick={() => {
          add({ id: p.slug, name: p.name, price: p.price, unit: p.unit, image: p.images[0].src,
                step: p.cut?.step ?? 1, qty: startingQty, href: `/product/${p.slug}` });
          setAdded(true);
          setTimeout(() => setAdded(false), 1600);
        }}>
        {out ? "Sold out" : added ? "In your cart" : "Add to cart"}
      </button>

      <div className="st-card__body">
        <span className="st-card__craft">{craftBy[p.craft]?.name}</span>
        <h3 className="st-card__n">{p.name}</h3>
        <span className="st-card__p">
          <b>{inr(p.price)}</b>
          {p.mrp > 0 && <s>{inr(p.mrp)}</s>}
          <em>{unitLabel(p.unit)}</em>
        </span>
        <span className={`st-card__stock ${p.stock}`}>{stockLine[p.stock]}</span>
      </div>
    </article>
  );
}
