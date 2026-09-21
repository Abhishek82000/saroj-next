import type { Product, WholesaleRate } from "./types";

/**
 * Wholesale mode: prices come only from the wholesale API (GET
 * /api/wholesale-page-data → `Product.wholesale`), never from the retail
 * figures, and nothing can be added to a cart. A piece the wholesale feed
 * sent without a price shows no price.
 */
export const WHOLESALE_MIN_METRES = 10;

/** The trade rate for a piece, or null when the wholesale feed gave none. */
export const wholesaleRate = (p: Product): WholesaleRate | null => p.wholesale ?? null;

/** What a piece looks like in the given mode. In wholesale mode that is the
    feed's trade rate, or price 0 ("unknown" — leave it unpriced). */
export function priced(p: Product, wholesale: boolean) {
  if (!wholesale) return { price: p.price, mrp: p.mrp, minQty: 0, wholesale: false as const };
  const rate = wholesaleRate(p);
  return { price: rate?.price ?? 0, mrp: rate?.mrp ?? 0, minQty: rate?.minQty ?? WHOLESALE_MIN_METRES, wholesale: true as const };
}

export const wholesaleNote = `Wholesale · from ${WHOLESALE_MIN_METRES} m · GST extra`;

/* ---------- where wholesale lives in the URL ----------
   Wholesale is a section of the site rather than a setting: /wholesale-fabric
   is its front door, and every page after it is the ordinary page's URL with
   that prefix — /wholesale-fabric/shop/ajrakh-collection,
   /wholesale-fabric/product/<slug>. Only the prices differ. The mode is
   whatever the URL says, so it can be linked to, bookmarked and refreshed. */

export const WHOLESALE_HOME = "/wholesale-fabric";

export const isWholesalePath = (pathname: string) =>
  pathname === WHOLESALE_HOME || pathname.startsWith(`${WHOLESALE_HOME}/`);

/** A retail link's wholesale twin. Only the shopping pages have one — a blog
    post or the contact page reads the same in both modes and is left alone. */
export function wholesaleHref(href: string): string {
  if (isWholesalePath(href.split("?")[0])) return href;
  if (href === "/") return WHOLESALE_HOME;
  const path = href.split(/[?#]/)[0];
  return path === "/shop" || path.startsWith("/shop/") || path.startsWith("/product/")
    ? WHOLESALE_HOME + href
    : href;
}

/** A wholesale link's retail twin. */
export function retailHref(href: string): string {
  const path = href.split("?")[0];
  if (!isWholesalePath(path)) return href;
  return href.slice(WHOLESALE_HOME.length) || "/";
}

/** Where the Retail | Wholesale switch takes you from the page you're on —
    the same category or piece in the other mode, or wholesale's front door. */
export function swapMode(pathname: string, to: "retail" | "wholesale"): string {
  if (to === "retail") return retailHref(pathname);
  const twin = wholesaleHref(pathname);
  return twin === pathname ? WHOLESALE_HOME : twin;
}
