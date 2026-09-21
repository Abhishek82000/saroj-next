"use client";
import { useEffect, useState } from "react";
import Rail from "./Rail";
import { fetchCards } from "@/lib/product-api";
import type { Product } from "@/lib/types";

const KEY = "saroj.recent";

/**
 * Recently viewed is per-person, so it can't live in a statically cached page.
 * The list is kept in the browser and the cards are fetched on mount — which
 * also means the product page itself stays prerendered.
 */
export default function RecentlyViewed({
  slug, productId, wholesale,
}: { slug: string; productId?: number; wholesale?: boolean }) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    let ids: number[] = [];
    try {
      ids = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
      if (!Array.isArray(ids)) ids = [];
    } catch { ids = []; }

    const others = ids.filter((id) => id !== productId);

    // Record this visit for next time before rendering the previous ones.
    if (productId) {
      try {
        window.localStorage.setItem(KEY, JSON.stringify([productId, ...others].slice(0, 6)));
      } catch { /* private mode — the rail just stays empty */ }
    }

    if (!others.length) return;
    let live = true;
    fetchCards(others.slice(0, 5), wholesale).then((cards) => {
      if (live) setItems(cards.filter((c) => c.slug !== slug));
    });
    return () => { live = false; };
  }, [slug, productId, wholesale]);

  if (items.length === 0) return null;

  return <Rail eyebrow="You looked at these" heading="Recently viewed." items={items} />;
}
