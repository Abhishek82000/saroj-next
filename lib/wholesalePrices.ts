import { site } from "./site";
import { WHOLESALE_MIN_METRES } from "./wholesale";
import type { Product, WholesaleRate } from "./types";

/**
 * STOPGAP: no API sends wholesale prices (/api/wholesale-page-data,
 * /api/products and /api/products/<slug> all leave them out), yet the live
 * storefront's own wholesale pages print them. Until the API carries them we
 * read them off those pages: /wholesale-fabric for the home rails,
 * /wholesale/<category> for a listing and /wholesale/product/<slug> for a
 * piece. Everything here is best-effort — a page that fails or changes shape
 * yields no prices, and a piece with none is simply shown unpriced.
 * Delete this file once `price`/`selling_price` arrive in the API.
 */

const num = (s: string | undefined) => Number((s ?? "").replace(/[^\d.]/g, "")) || 0;
const rate = (price: number, mrp: number): WholesaleRate => ({ price, mrp: mrp > price ? mrp : 0, minQty: WHOLESALE_MIN_METRES });

async function html(path: string): Promise<string> {
  try {
    const res = await fetch(`${site.url}${path}`, { next: { revalidate: 300 } });
    return res.ok ? await res.text() : "";
  } catch {
    return "";
  }
}

/** slug → rate for every product card on one wholesale page. */
function cards(page: string): Map<string, WholesaleRate> {
  const out = new Map<string, WholesaleRate>();
  const re = /\/product\/([a-z0-9-]+)"[^>]*class="title link">[^<]*<\/a>\s*<span class="price[^"]*">\s*<span class="new-price">([^<]+)<\/span>\s*(?:<span class="old-price">([^<]+)<\/span>)?/g;
  for (const m of page.matchAll(re)) {
    const price = num(m[2]);
    if (price > 0 && !out.has(m[1])) out.set(m[1], rate(price, num(m[3])));
  }
  return out;
}

/** The home page's rails (`/wholesale-fabric`). */
export const homePrices = async () => cards(await html("/wholesale-fabric"));

/** A category's products, walking its pages until one adds nothing new. */
export async function categoryPrices(slug: string): Promise<Map<string, WholesaleRate>> {
  const all = new Map<string, WholesaleRate>();
  for (let page = 1; page <= 6; page++) {
    const got = cards(await html(`/wholesale/${slug}${page > 1 ? `?page=${page}` : ""}`));
    const before = all.size;
    got.forEach((v, k) => { if (!all.has(k)) all.set(k, v); });
    if (all.size === before) break;
  }
  return all;
}

/** One piece's rate, from its own page. */
export async function productPrice(slug: string): Promise<WholesaleRate | null> {
  const page = await html(`/wholesale/product/${slug}`);
  const price = num(page.match(/class="price-on-sale">\s*([^<]+)</)?.[1]);
  return price > 0 ? rate(price, num(page.match(/class="compare-at-price">\s*([^<]+)</)?.[1])) : null;
}

/** The products with a wholesale rate attached wherever we have one. */
export const withRates = (items: Product[], rates: Map<string, WholesaleRate>): Product[] =>
  items.map((p) => (rates.has(p.slug) ? { ...p, wholesale: rates.get(p.slug) } : p));
