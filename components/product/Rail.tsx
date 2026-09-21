"use client";
import Link from "next/link";
import { useRef } from "react";
import Photo from "@/components/ui/Photo";
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
  const rail = useRef<HTMLDivElement>(null);
  const { addProduct, mode, href } = useStore();

  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section className="st-sec" id={id} style={{ paddingBlock: "clamp(28px,5vw,54px)" }}>
      <div className="st-wrap st-railhead">
        <div>
          <Reveal className="st-eyebrow">{eyebrow}</Reveal>
          <Reveal as="h2" delay={1} className="st-h2">{heading}</Reveal>
        </div>
        <Reveal delay={2} className="row-gap">
          <button className="st-arrow" onClick={() => nudge(-1)} aria-label="Scroll left"><Icon name="left" size={16} strokeWidth={1.8} /></button>
          <button className="st-arrow" onClick={() => nudge(1)} aria-label="Scroll right"><Icon name="right" size={16} strokeWidth={1.8} /></button>
        </Reveal>
      </div>

      <div className="st-wrap">
        <div className="st-shoprail" ref={rail}>
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
                <div className="st-prod__body">
                  <Link href={href(`/product/${p.slug}`)} className="st-prod__name">{p.name}</Link>
                  {known && <span className="st-prod__price"><b>{inr(view.price)}</b>{view.mrp > 0 && <s>{inr(view.mrp)}</s>}{view.wholesale && <em className="st-prod__gst">+GST</em>}</span>}
                </div>
                {known && mode !== "wholesale" && <button type="button" className="st-prod__add" aria-label={`Add ${p.name} to cart`}
                  onClick={() => addProduct(p)}>Add to cart</button>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
