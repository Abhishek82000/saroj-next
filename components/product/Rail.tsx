"use client";
import Link from "next/link";
import Photo from "@/components/ui/Photo";
import { useAutoRail } from "@/components/ui/useAutoRail";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { useStore } from "@/components/shell/StoreProvider";
import { discount } from "@/lib/products";
import { inr } from "@/lib/site";
import { priced } from "@/lib/wholesale";
import type { Product } from "@/lib/types";

/** Horizontal product scroller, used under the product detail and on the home page. */
export default function Rail({
  eyebrow, heading, items, id,
}: { eyebrow: string; heading: string; items: Product[]; id?: string }) {
  const { addProduct, mode, href, wishlist, toggleFav } = useStore();
  const { rail, nudge, hold } = useAutoRail(items.length);

  return (
    <section className="st-sec" id={id} style={{ paddingBlock: "clamp(28px,5vw,54px)" }}>
      <div className="st-wrap st-railhead">
        <div>
          <Reveal className="st-eyebrow">{eyebrow}</Reveal>
          <Reveal as="h2" delay={1} className="st-h2">{heading}</Reveal>
        </div>
      </div>

      <div className="st-wrap">
        <div className="st-railwrap">
        <button className="st-arrow st-arrow--side st-arrow--prev" onClick={() => nudge(-1)} aria-label="Scroll left"><Icon name="left" size={16} strokeWidth={1.8} /></button>
        <button className="st-arrow st-arrow--side st-arrow--next" onClick={() => nudge(1)} aria-label="Scroll right"><Icon name="right" size={16} strokeWidth={1.8} /></button>
        <div
          className="st-shoprail"
          ref={rail}
          {...hold}
        >
          {items.map((p) => {
            const view = priced(p, mode === "wholesale");
            /* A piece the API sent without a price shows no price — never a made-up ₹0. */
            const known = view.price > 0;
            const off = known ? discount(view.wholesale ? { ...p, price: view.price, mrp: view.mrp } : p) : 0;
            return (
              <div className="st-prod" key={p.slug}>
                <Link href={href(`/product/${p.slug}`)} className="st-prod__ph ph" aria-label={p.name}>
                  <Photo src={p.images[0].src} alt={p.name} note={p.images[0].note} sizes="232px" />
                </Link>
                {off > 0 && <span className="st-prod__off">{off}% off</span>}
                {/* Same heart as the shop grid's cards — login-gated, saved to this mode's wishlist. */}
                <button type="button" className={`st-card__fav${wishlist[mode][p.slug] ? " on" : ""}`}
                  aria-pressed={!!wishlist[mode][p.slug]} aria-label={`Save ${p.name}`} onClick={() => toggleFav(p, mode)}>
                  <Icon name="heart" size={14} fill={wishlist[mode][p.slug] ? "currentColor" : "none"} strokeWidth={1.6} />
                </button>
                <div className="st-prod__body">
                  <Link href={href(`/product/${p.slug}`)} className="st-prod__name">{p.name}</Link>
                  {known && <span className="st-prod__price"><b>{inr(view.price)}</b>{view.mrp > 0 && <s>{inr(view.mrp)}</s>}</span>}
                </div>
                {known && mode !== "wholesale" && <button type="button" className="st-prod__add" aria-label={`Add ${p.name} to cart`}
                  onClick={() => addProduct(p)}>Add to cart</button>}
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </section>
  );
}
