"use client";
import Link from "next/link";
import { memo, useCallback, useRef } from "react";
import Photo from "@/components/ui/Photo";
import Icon from "@/components/ui/Icon";
import { useModeHref, useStore, type Mode } from "@/components/shell/StoreProvider";
import { discount } from "@/lib/price";
import { inr } from "@/lib/site";
import { priced } from "@/lib/wholesale";
import type { Product } from "@/lib/types";

/**
 * The home page's product card — one design for the rails and the shop grid.
 * `clone` marks the rail loop's second pass: decoration, hidden from screen
 * readers and tabbing.
 */
export default function ProdCard(props: { p: Product; clone?: boolean; priority?: boolean; sizes?: string }) {
  const { addProduct, mode, wishlist, toggleFav } = useStore();
  /* The store's value changes on every cart, login, toast or badge update, and a
     home page carries a few hundred cards. Hand the card only what it shows,
     with click handlers that never change, so it re-renders when its own heart
     or the mode does — not on each of those updates. */
  const latest = useRef({ addProduct, toggleFav, mode });
  latest.current = { addProduct, toggleFav, mode };
  const onAdd = useCallback((p: Product) => latest.current.addProduct(p), []);
  const onFav = useCallback((p: Product) => latest.current.toggleFav(p, latest.current.mode), []);
  return <Card {...props} mode={mode} saved={!!wishlist[mode][props.p.slug]} onAdd={onAdd} onFav={onFav} />;
}

const Card = memo(function Card({
  p, clone, priority, sizes = "262px", mode, saved, onAdd, onFav,
}: {
  p: Product; clone?: boolean; priority?: boolean; sizes?: string;
  mode: Mode; saved: boolean; onAdd: (p: Product) => void; onFav: (p: Product) => void;
}) {
  const href = useModeHref();
  const view = priced(p, mode === "wholesale");
  /* A piece the API sent without a price shows no price — never a made-up ₹0. */
  const known = view.price > 0;
  const off = known ? discount(view.wholesale ? { ...p, price: view.price, mrp: view.mrp } : p) : 0;
  const out = p.stock === "out";

  return (
    <div className="st-prod" aria-hidden={clone || undefined} inert={clone}>
      <Link href={href(`/product/${p.slug}`)} className="st-prod__ph ph" aria-label={p.name}>
        <Photo src={p.images[0].src} alt={p.name} note={p.images[0].note} priority={priority} sizes={sizes} />
        <span className="st-prod__peek" aria-hidden>View Fabric <Icon name="right" size={12} strokeWidth={2} /></span>
      </Link>
      {p.label && <span className="st-prod__label">{p.label}</span>}
      {off > 0 && <span className="st-prod__off">{off}% off</span>}
      {/* Login-gated, saved to this mode's wishlist. */}
      <button type="button" className={`st-card__fav${saved ? " on" : ""}`}
        aria-pressed={saved} aria-label={`Save ${p.name}`} onClick={() => onFav(p)}>
        <Icon name="heart" size={14} fill={saved ? "currentColor" : "none"} strokeWidth={1.6} />
      </button>
      <div className="st-prod__body">
        <Link href={href(`/product/${p.slug}`)} className="st-prod__name">{p.name}</Link>
        {known && (
          <div className="st-prod__price">
            <b>{inr(view.price)}</b>
            {/* Fabric is priced by the meter; handicraft by the piece. */}
            <small>/ {p.unit === "meter" ? "meter" : "piece"}</small>
            {view.mrp > view.price && <s>{inr(view.mrp)}</s>}
          </div>
        )}
        {((known && view.mrp > view.price) || p.shippingFree) && (
          <div className="st-prod__flags">
            {known && view.mrp > view.price && <span className="st-prod__save">You save {inr(view.mrp - view.price)}</span>}
            {p.shippingFree && <span className="st-prod__ship"><Icon name="truck" size={11} strokeWidth={1.8} />Free shipping</span>}
          </div>
        )}
      </div>
      {known && mode !== "wholesale" && (
        <button type="button" className="st-prod__add" aria-label={`Add ${p.name} to cart`} disabled={out}
          onClick={() => onAdd(p)}>
          <Icon name="cart" size={14} strokeWidth={1.8} /><span>{out ? "Sold out" : "Add to cart"}</span>
        </button>
      )}
    </div>
  );
});
