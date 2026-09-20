import type { Product, WholesaleRate } from "./types";

/**
 * Wholesale mode's trade terms, as the live storefront applies them: a lower
 * per-metre rate with GST charged on top, a 10 m minimum on fabric, and
 * adding to the cart only once you're logged in.
 *
 * STAND-IN: the products API doesn't return wholesale prices yet (the raw
 * product record has product_wh_selling_price / product_wh_mrp_price /
 * product_wh_min_qty, but /api/products and /api/products/<slug> don't expose
 * them). Until they do, fabric falls back to the advertised "from ₹80/m" rate
 * below — a placeholder, not real pricing. Once the API supplies
 * `Product.wholesale`, delete the WHOLESALE_IS_MOCK branch.
 */
export const WHOLESALE_IS_MOCK = true;

export const WHOLESALE_MIN_METRES = 10;
/** The advertised "from" rate, in rupees a metre. */
const PLACEHOLDER_RATE = 80;
/** Above this a piece is a set or a garment rather than cloth by the metre, so the
    per-metre placeholder would be nonsense (₹80 against a ₹849 set). */
const PLACEHOLDER_MAX_RETAIL = 200;

/** The trade rate for a piece, or null when it isn't sold wholesale. */
export function wholesaleRate(p: Product): WholesaleRate | null {
  if (p.wholesale) return p.wholesale;
  /* No retail price means the piece's price is unknown, not free — nothing to base a rate on. */
  if (!WHOLESALE_IS_MOCK || p.unit !== "metre" || p.price <= 0 || p.price > PLACEHOLDER_MAX_RETAIL) return null;
  const price = p.cut?.wholesale ?? Math.min(p.price, PLACEHOLDER_RATE);
  return { price, mrp: p.price > price ? p.price : 0, minQty: WHOLESALE_MIN_METRES };
}

/** What a piece looks like in the given mode — the trade rate in wholesale mode
    when it has one, the ordinary retail figures otherwise. */
export function priced(p: Product, wholesale: boolean) {
  const rate = wholesale ? wholesaleRate(p) : null;
  return rate
    ? { price: rate.price, mrp: rate.mrp, minQty: rate.minQty, wholesale: true as const }
    : { price: p.price, mrp: p.mrp, minQty: 0, wholesale: false as const };
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
