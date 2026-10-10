"use client";
import ProdCard from "./ProdCard";
import { useLoopRail } from "@/components/ui/useLoopRail";
import Icon from "@/components/ui/Icon";
import SectionHead from "@/components/ui/SectionHead";
import type { Product } from "@/lib/types";

/** Horizontal product scroller, used under the product detail and on the home page. */
export default function Rail({
  eyebrow, heading, items, id,
}: { eyebrow: string; heading: string; items: Product[]; id?: string }) {
  const { rail, track, nudge, hold, slots } = useLoopRail(items.length);

  return (
    <section className="st-sec" id={id} style={{ paddingBlock: "0 54px" }}>
      <div className="st-wrap st-railhead">
        <SectionHead title={heading} />
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
          <div className="loop-track" ref={track}>
            {slots(items).map(({ item: p, clone }) => (
              <ProdCard key={clone ? `c-${p.slug}` : p.slug} p={p} clone={clone} />
            ))}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
