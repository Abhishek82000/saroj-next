"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "./StoreProvider";
import { readRecent } from "@/components/product/RecentlyViewed";
import { fetchCards } from "@/lib/product-api";
import { inr } from "@/lib/site";
import { priced } from "@/lib/wholesale";
import type { Product } from "@/lib/types";

/** Cards per loop pass — enough to overfill the panel's height so the loop never shows a gap. */
const MIN_PASS = 6;

/**
 * Recently viewed, docked to the cart drawer's left edge: a column of cards
 * drifting endlessly upward. The pass is rendered twice and the track slides
 * by half its height, so the loop is seamless. Hidden on narrow screens,
 * where the drawer already takes the whole width.
 */
export default function CartRecent({ open, onPick }: { open: boolean; onPick: () => void }) {
  const { mode, href } = useStore();
  const [items, setItems] = useState<Product[]>([]);

  /* Re-read on every open — the visitor may have viewed more pieces since. */
  useEffect(() => {
    if (!open) return;
    const ids = readRecent();
    if (!ids.length) return setItems([]);
    let live = true;
    fetchCards(ids, mode === "wholesale").then((cards) => { if (live) setItems(cards); });
    return () => { live = false; };
  }, [open, mode]);

  if (items.length === 0) return null;

  const pass = Array.from({ length: Math.ceil(MIN_PASS / items.length) }, () => items).flat();

  return (
    <section className="st-crecent" aria-label="Recently viewed">
      <header className="st-crecent__head">
        <span className="st-eyebrow">Recently viewed</span>
      </header>
      <div className="st-crecent__view">
        <div className="st-crecent__track" style={{ animationDuration: `${pass.length * 4.5}s` }}>
          {[0, 1].map((copy) =>
            pass.map((p, i) => {
              /* Only the very first pass is real to screen readers and the keyboard. */
              const echo = copy === 1 || i >= items.length;
              const price = priced(p, mode === "wholesale").price;
              return (
                <Link key={`${copy}-${i}-${p.slug}`} href={href(`/product/${p.slug}`)} className="st-crecent__card"
                  onClick={onPick} aria-hidden={echo || undefined} tabIndex={echo ? -1 : undefined}>
                  <span className="st-crecent__ph">
                    {/* Plain <img>, like the cart thumbs beside it. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0]?.src} alt="" loading="lazy" />
                  </span>
                  <span className="st-crecent__name">{p.name}</span>
                  {price > 0 && <b className="st-crecent__price">{inr(price)}</b>}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
