"use client";
import Link from "next/link";
import Photo from "@/components/ui/Photo";
import Icon from "@/components/ui/Icon";
import { useStore } from "@/components/shell/StoreProvider";
import { discount } from "@/lib/price";
import { inr } from "@/lib/site";
import { priced } from "@/lib/wholesale";
import type { Product } from "@/lib/types";

/**
 * The home page's product card — one design for the rails and the shop grid.
 * `clone` marks the rail loop's second pass: decoration, hidden from screen
 * readers and tabbing.
 */
export default function ProdCard({
  p, clone, priority, sizes = "262px",
}: { p: Product; clone?: boolean; priority?: boolean; sizes?: string }) {
  const { addProduct, mode, href, wishlist, toggleFav } = useStore();
  const view = priced(p, mode === "wholesale");
  /* A piece the API sent without a price shows no price — never a made-up ₹0. */
  const known = view.price > 0;
  const off = known ? discount(view.wholesale ? { ...p, price: view.price, mrp: view.mrp } : p) : 0;
  const saved = !!wishlist[mode][p.slug];
  const out = p.stock === "out";

  return (
    <div className="st-prod" aria-hidden={clone || undefined} inert={clone}>
      <Link href={href(`/product/${p.slug}`)} className="st-prod__ph ph" aria-label={p.name}>
        <Photo src={p.images[0].src} alt={p.name} note={p.images[0].note} priority={priority} sizes={sizes} />
        <span className="st-prod__peek" aria-hidden>View piece <Icon name="right" size={12} strokeWidth={2} /></span>
      </Link>
      {p.label && <span className="st-prod__label">{p.label}</span>}
      {off > 0 && <span className="st-prod__off">{off}% off</span>}
      {/* Login-gated, saved to this mode's wishlist. */}
      <button type="button" className={`st-card__fav${saved ? " on" : ""}`}
        aria-pressed={saved} aria-label={`Save ${p.name}`} onClick={() => toggleFav(p, mode)}>
        <Icon name="heart" size={14} fill={saved ? "currentColor" : "none"} strokeWidth={1.6} />
      </button>
      <div className="st-prod__body">
        <Link href={href(`/product/${p.slug}`)} className="st-prod__name">{p.name}</Link>
        {known && (
          <div className="st-prod__price">
            <b>{inr(view.price)}</b>
            {p.kind === "fabric" && p.unit && <small>/ {p.unit}</small>}
            {view.mrp > view.price && <s>{inr(view.mrp)}</s>}
          </div>
        )}
        {known && view.mrp > view.price && <span className="st-prod__save">You save {inr(view.mrp - view.price)}</span>}
      </div>
      {known && mode !== "wholesale" && (
        <button type="button" className="st-prod__add" aria-label={`Add ${p.name} to cart`} disabled={out}
          onClick={() => addProduct(p)}>
          <Icon name="cart" size={14} strokeWidth={1.8} /><span>{out ? "Sold out" : "Add to cart"}</span>
        </button>
      )}
    </div>
  );
}
