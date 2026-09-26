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
   Wholesale is a section of the site rather than a setting, laid out the way
   the live storefront has it:

     /wholesale-fabric                 front door
     /wholesale-fabric/shop            the whole counter (and its search)
     /wholesale-fabric/cart, /checkout the wholesale cart and its checkout
     /wholesale/<category or tag>      a listing
     /wholesale/product/<slug>         a piece

   Only the prices differ from retail. The mode is whatever the URL says, so it
   can be linked to, bookmarked and refreshed. */

export const WHOLESALE_HOME = "/wholesale-fabric";
/** Prefix for wholesale listings and pieces. */
export const WHOLESALE_SECTION = "/wholesale";

const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

export const isWholesalePath = (pathname: string) =>
  !!pathname && (under(pathname, WHOLESALE_HOME) || under(pathname, WHOLESALE_SECTION));

export const wholesaleCategoryHref = (slug: string) => `${WHOLESALE_SECTION}/${slug}`;
export const wholesaleProductHref = (slug: string) => `${WHOLESALE_SECTION}/product/${slug}`;

/** Splits "/a/b?x#y" into its path and whatever follows it. */
const split = (href: string) => {
  const i = href.search(/[?#]/);
  return i < 0 ? [href, ""] : [href.slice(0, i), href.slice(i)];
};

/** A retail link's wholesale twin: / → /wholesale-fabric, /shop (and /cart,
    /checkout) → /wholesale-fabric/shop (/cart, /checkout),
    /shop/<slug> (and the old /shop/tag/<slug>) → /wholesale/<slug>,
    /product/<slug> → /wholesale/product/<slug>. Anything else has no twin. */
export function wholesaleHref(href: string | null | undefined): string {
  if (!href) return href ?? WHOLESALE_HOME;
  const [path, rest] = split(href);
  if (isWholesalePath(path)) return href;
  if (path === "/") return WHOLESALE_HOME + rest;
  if (path === "/shop" || path === "/cart" || path === "/checkout") return WHOLESALE_HOME + path + rest;
  const m = path.match(/^\/shop\/(?:tag\/)?([^/]+)$/);
  if (m) return wholesaleCategoryHref(m[1]) + rest;
  if (path.startsWith("/product/")) return WHOLESALE_SECTION + path + rest;
  return href;
}

/** The inverse of `wholesaleHref`. */
export function retailHref(href: string | null | undefined): string {
  if (!href) return href ?? "/";
  const [path, rest] = split(href);
  if (!isWholesalePath(path)) return href;
  if (under(path, WHOLESALE_HOME)) return (path.slice(WHOLESALE_HOME.length) || "/") + rest;
  const tail = path.slice(WHOLESALE_SECTION.length);
  if (!tail || tail === "/") return "/" + rest;
  if (tail.startsWith("/product/")) return tail + rest;
  return `/shop${tail}${rest}`;
}

/** Where the Retail | Wholesale switch takes you from the page you're on —
    the same category or piece in the other mode, or wholesale's front door. */
export function swapMode(pathname: string, to: "retail" | "wholesale"): string {
  if (to === "retail") return retailHref(pathname);
  const twin = wholesaleHref(pathname);
  return twin === pathname ? WHOLESALE_HOME : twin;
}
