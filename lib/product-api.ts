import type {
  CategoryRail, Coupon, Faq, LiveProduct, Product, ProductDetail,
  ReviewSummary, Stock, VariantGroup,
} from "./types";

/**
 * Talks to ProductApiDetailController.
 *
 * Everything the API returns is mapped into the `Product` shape the existing
 * components already take, so Gallery, Rail and the cards work unchanged
 * whether a product came from the static catalogue or from Laravel.
 */

const FALLBACK = "https://www.sarojtextile.com";

/**
 * Server-side we call Laravel directly, so API_URL can be an internal address
 * the public never sees. In the browser we call our own origin and let the
 * rewrite in next.config.ts forward it — no CORS to configure, and the API
 * host never ends up in the client bundle.
 */
const SERVER_API = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? FALLBACK).replace(/\/$/, "");

const base = () => (typeof window === "undefined" ? SERVER_API : "");

/** Product data changes with stock and price, so don't cache it for long. */
const REVALIDATE = 300;

/* ---------- raw payload ---------- */

interface RawPrice { mrp: number; selling: number; discount: number; currency: string; gst_extra: boolean }
interface RawCut { mode: "length" | "quantity" | "enquiry"; min: number; max: number; step: number; unit: string; lgap: number }

interface RawProduct {
  id: number; name: string; slug: string; sku: string | null; label: string | null;
  image: string; image_alt: string;
  gallery: { id: number; src: string; alt: string }[];
  short_description: string | null; description_html: string | null;
  type: number; style_type: number; stock: number; in_carts: number;
  rating: number; review_count: number;
  price: RawPrice; cut: RawCut;
  default_variation_id: number | null;
  tabs: { name: string; html: string }[];
  meta: { title: string; description: string; keywords: string | null };
  wholesale: {
    available: boolean; min_qty: number; selling_price: number;
    is_current: boolean; l_fold_note: boolean;
  };
}

interface RawCard {
  id: number; name: string; slug: string; image: string; image_alt: string;
  mrp: number; selling: number; discount: number; label: string | null;
  rating: number; review_count: number; stock: number; style_type: number; lgap: number;
}

interface RawDetail {
  mode: "retail" | "wholesale";
  product: RawProduct;
  variants: VariantGroup[];
  is_favorite: boolean;
  requires_login: boolean;
  promo: { code: string; description: string; seconds_remaining: number } | null;
  coupons: Coupon[];
  reviews: ReviewSummary;
  faqs: Faq[];
  related: RawCard[];
  recently_viewed: RawCard[];
  recently_viewed_ids: number[];
  category_rails: { id: number; name: string; slug: string; products: RawCard[] }[];
  shipping: { estimate: string; free_shipping_above: number | null; minimum: string | null };
}

/* ---------- mapping ---------- */

const stockLevel = (n: number): Stock => (n <= 0 ? "out" : n < 10 ? "low" : "in");

/** Strip a CMS description down to something safe for a meta tag. */
const plain = (html: string | null) =>
  (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** Fabric sold by the metre reads as fabric; everything else is a piece. */
const kindOf = (styleType: number) => (styleType === 1 ? "fabric" : "craft");

function mapLive(raw: RawProduct): LiveProduct {
  return {
    id: raw.id,
    sku: raw.sku,
    label: raw.label,
    inCarts: raw.in_carts,
    type: raw.type,
    styleType: raw.style_type,
    stock: raw.stock,
    rating: raw.rating,
    reviewCount: raw.review_count,
    price: raw.price,
    cut: raw.cut,
    descriptionHtml: raw.description_html,
    shortDescription: raw.short_description,
    tabs: raw.tabs ?? [],
    defaultVariationId: raw.default_variation_id,
    wholesale: {
      available: raw.wholesale.available,
      minQty: raw.wholesale.min_qty,
      sellingPrice: raw.wholesale.selling_price,
      isCurrent: raw.wholesale.is_current,
      lFoldNote: raw.wholesale.l_fold_note,
    },
    meta: raw.meta,
  };
}

function mapProduct(raw: RawProduct): Product {
  const live = mapLive(raw);
  const images = [
    { src: raw.image, note: raw.image_alt || raw.name },
    ...(raw.gallery ?? []).map((g) => ({ src: g.src, note: g.alt || raw.name })),
  ];

  return {
    productId: raw.id,
    slug: raw.slug,
    name: raw.name,
    short: raw.name.replace(/ Printed.*$/i, "").replace(/ Cotton Fabric$/i, "").trim() || raw.name,
    kind: kindOf(raw.style_type),
    // Live products carry no craft key; the page falls back to the fabric craft.
    craft: kindOf(raw.style_type) === "fabric" ? "fabric" : "bagru",
    material: raw.cut.unit === "metre" ? "Cotton" : "—",
    price: raw.price.selling,
    mrp: raw.price.mrp,
    unit: raw.cut.unit === "metre" ? "metre" : "each",
    stock: stockLevel(raw.stock),
    images,
    fresh: 0,
    sold: raw.review_count,
    // Only a by-the-metre product gets the length picker.
    cut: raw.cut.mode === "length"
      ? { min: raw.cut.min, max: raw.cut.max, step: raw.cut.step, wholesale: raw.wholesale.selling_price }
      : undefined,
    description: plain(raw.description_html) || raw.short_description || undefined,
    live,
  };
}

function mapCard(raw: RawCard): Product {
  return {
    productId: raw.id,
    slug: raw.slug,
    name: raw.name,
    short: raw.name,
    kind: kindOf(raw.style_type),
    craft: kindOf(raw.style_type) === "fabric" ? "fabric" : "bagru",
    material: raw.style_type === 1 ? "Cotton" : "—",
    price: raw.selling,
    mrp: raw.mrp,
    unit: raw.style_type === 1 ? "metre" : "each",
    stock: stockLevel(raw.stock),
    images: [{ src: raw.image, note: raw.image_alt || raw.name }],
    fresh: 0,
    sold: raw.review_count,
    cut: raw.style_type === 1
      ? { min: raw.lgap > 1 ? raw.lgap : 1, max: raw.stock, step: raw.lgap, wholesale: 0 }
      : undefined,
  };
}

/* ---------- calls ---------- */

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(base() + path, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success ? (json.data as T) : null;
  } catch {
    // A storefront that 500s because the API blinked is worse than one that
    // falls back to the static catalogue, so swallow and let the caller decide.
    return null;
  }
}

/**
 * Full product detail. `recent` is the id list the browser is holding, which
 * the API folds into the "recently viewed" rail and hands back updated.
 */
export async function getProductDetail(
  slug: string,
  opts: { wholesale?: boolean; recent?: number[] } = {},
): Promise<ProductDetail | null> {
  const base = opts.wholesale ? "/api/wholesale/products/" : "/api/products/";
  const query = opts.recent?.length ? `?recent=${opts.recent.join(",")}` : "";
  const raw = await get<RawDetail>(base + encodeURIComponent(slug) + query);
  if (!raw) return null;

  const rails: CategoryRail[] = (raw.category_rails ?? []).map((c) => ({
    id: c.id, name: c.name, slug: c.slug, products: c.products.map(mapCard),
  }));

  return {
    mode: raw.mode,
    product: mapProduct(raw.product),
    live: mapLive(raw.product),
    variants: raw.variants ?? [],
    promo: raw.promo,
    coupons: raw.coupons ?? [],
    reviews: raw.reviews,
    faqs: raw.faqs ?? [],
    related: (raw.related ?? []).map(mapCard),
    recentlyViewed: (raw.recently_viewed ?? []).map(mapCard),
    recentlyViewedIds: raw.recently_viewed_ids ?? [],
    categoryRails: rails,
    isFavorite: raw.is_favorite,
    requiresLogin: raw.requires_login,
    shipping: raw.shipping,
  };
}

/** Price, image and stock for a chosen combination of attribute terms. */
export async function fetchVariation(
  productId: number,
  variation: string,
  wholesale: boolean,
): Promise<{ variation_id: number; image: string; stock: number; price: RawPrice } | null> {
  try {
    const res = await fetch(`${base()}/api/products/${productId}/variation`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ variation, wholesale }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * Cards for a list of product ids, used by the client-side "recently viewed"
 * rail. Keeping this on the client is what lets the product page itself stay
 * statically rendered.
 */
export async function fetchCards(ids: number[], wholesale = false): Promise<Product[]> {
  if (!ids.length) return [];
  const raw = await get<RawCard[]>(
    `/api/products/cards?ids=${ids.join(",")}${wholesale ? "&wholesale=1" : ""}`,
  );
  return (raw ?? []).map(mapCard);
}

/**
 * The wholesale section's base path. It matches the Laravel route
 * (/wholesale-fabric), and every internal wholesale link is built from it —
 * change it here and the breadcrumbs, cross-sell links and JSON-LD follow.
 */
/** Wholesale's front door — see lib/wholesale.ts for the URL layout. */
export const WHOLESALE_BASE = "/wholesale-fabric";

/** The canonical pair of URLs for a product, used for the cross-sell link. */
export const productHref = (slug: string, wholesale = false) =>
  wholesale ? `/wholesale/product/${slug}` : `/product/${slug}`;
