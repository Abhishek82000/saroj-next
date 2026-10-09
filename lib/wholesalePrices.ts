import { site } from "./site";
import { WHOLESALE_MIN_METRES } from "./wholesale";
import type { Product, WholesaleRate } from "./types";

/**
 * Wholesale rates for listing cards. The listing APIs (/api/products and its
 * category/tag forms) price everything at retail, so wholesale pages ask
 * GET /api/products/cards?ids=…&wholesale=1 instead: ProductApiDetailController
 * prices those cards from product_wh_selling_price / product_wh_mrp_price.
 * Products it leaves out aren't sold wholesale (or are out of stock) and stay
 * unpriced, never shown at a made-up price. Works on the server and in the browser.
 */

/** The endpoint answers this many ids per call; longer lists go in parallel batches. */
const BATCH = 12;

interface RawCard { id: number; selling: number; mrp: number; wh_min_qty?: number }

export async function wholesaleRates(ids: number[]): Promise<Map<number, WholesaleRate>> {
  const out = new Map<number, WholesaleRate>();
  const unique = [...new Set(ids.filter((n) => n > 0))];
  const batches: number[][] = [];
  for (let i = 0; i < unique.length; i += BATCH) batches.push(unique.slice(i, i + BATCH));

  await Promise.all(batches.map(async (batch) => {
    try {
      const res = await fetch(`${site.url}/api/products/cards?wholesale=1&ids=${batch.join(",")}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
      });
      if (!res.ok) return;
      const json: { data?: RawCard[] } = await res.json();
      for (const c of json.data ?? []) {
        const price = Number(c.selling);
        const mrp = Number(c.mrp);
        if (price > 0) out.set(c.id, { price, mrp: mrp > price ? mrp : 0, minQty: c.wh_min_qty || WHOLESALE_MIN_METRES });
      }
    } catch {
      /* a failed batch leaves its products unpriced */
    }
  }));
  return out;
}

/** The products with their wholesale rate attached. One that already carries a rate keeps it. */
export const withRates = (items: Product[], rates: Map<number, WholesaleRate>): Product[] =>
  items.map((p) => (p.wholesale || !p.productId || !rates.has(p.productId) ? p : { ...p, wholesale: rates.get(p.productId) }));

/** Looks up and attaches wholesale rates for every product that hasn't got one yet. */
export async function attachWholesale(items: Product[]): Promise<Product[]> {
  const missing = items.filter((p) => !p.wholesale && p.productId).map((p) => p.productId as number);
  if (missing.length === 0) return items;
  return withRates(items, await wholesaleRates(missing));
}
