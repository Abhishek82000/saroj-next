"use client";
import Link from "next/link";
import { useRef } from "react";
import Photo from "@/components/ui/Photo";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { useStore } from "@/components/shell/StoreProvider";
import { discount } from "@/lib/products";
import { inr } from "@/lib/site";
import type { Product } from "@/lib/types";

/** Horizontal product scroller, used under the product detail and on the home page. */
export default function Rail({
  eyebrow, heading, items, id,
}: { eyebrow: string; heading: string; items: Product[]; id?: string }) {
  const rail = useRef<HTMLDivElement>(null);
  const { add } = useStore();

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
            const off = discount(p);
            return (
              <div className="st-prod" key={p.slug}>
                <Link href={`/product/${p.slug}`} className="st-prod__ph ph" aria-label={p.name}>
                  <Photo src={p.images[0].src} alt={p.name} note={p.images[0].note} sizes="232px" />
                </Link>
                {off > 0 && <span className="st-prod__off">{off}% off</span>}
                <div className="st-prod__body">
                  <Link href={`/product/${p.slug}`} className="st-prod__name">{p.name}</Link>
                  <span className="st-prod__price"><b>{inr(p.price)}</b>{p.mrp > 0 && <s>{inr(p.mrp)}</s>}</span>
                </div>
                <button type="button" className="st-quick" aria-label={`Add ${p.name} to cart`}
                  onClick={() => add({
                    id: p.slug, name: p.name, price: p.price, unit: p.unit, image: p.images[0].src,
                    step: p.cut?.step ?? 1, qty: p.cut ? 2.5 : 1, href: `/product/${p.slug}`,
                  })}>
                  <Icon name="plus" size={15} strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
