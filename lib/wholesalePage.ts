import { apiProductToProduct, getHomeData, toSlides } from "./home";
import { site } from "./site";
import { WHOLESALE_MIN_METRES, forMode, wholesaleCategoryHref } from "./wholesale";
import { attachWholesale } from "./wholesalePrices";
import type { BannerSlide, HomeVideoProduct, Product, Reel, WholesaleApiCategory, WholesaleApiProduct, WholesalePageApiResponse } from "./types";

export type WholesaleSlide = BannerSlide;
export interface WholesaleCollection { id: number; name: string; heading: string; slug: string; blurb: string; image: string; banner: string }
export interface Testimonial { id: number; name: string; rating: number; quote: string }
export interface WholesaleRail { id: number; slug: string; name: string; items: Product[] }

export interface WholesalePage {
  slides: WholesaleSlide[];
  /** The storefront's highlighted collections. */
  collections: WholesaleCollection[];
  /** A second highlighted pair, shown further down. */
  more: WholesaleCollection[];
  /** Every wholesale category. */
  categories: { id: number; name: string; slug: string; image: string }[];
  testimonials: Testimonial[];
  rails: WholesaleRail[];
  /** Tag rails ("New Arrivals", "Best Seller", ...), shown above the category rails. */
  tagRails: WholesaleRail[];
  /** `middle_slider` — small banners after the second category rail. */
  midSlides: BannerSlide[];
  /** `video_products` — shoppable reels, shown after the tag rails. */
  reels: Reel[];
}

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&rsquo;": "’", "&lsquo;": "‘", "&ldquo;": "“", "&rdquo;": "”", "&ndash;": "–", "&mdash;": "—" };

/** Editor HTML → one line of plain text. */
function plain(html: string, max?: number): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? " ")
    .replace(/\*\*|__/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return max && text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

const toCollection = (c: WholesaleApiCategory): WholesaleCollection => ({
  id: c.cat_id, name: c.cat_name, heading: c.cat_heading || c.cat_name, slug: c.cat_slug,
  blurb: plain(c.cat_short_desc ?? "", 150), image: c.cat_cdn_url, banner: c.cat_banner_cdn || c.cat_cdn_url,
});

/** A wholesale-feed product as a card. The feed prices its products from the
    wholesale columns (WholesaleApiController::useWholesalePrices), so its
    price / selling_price are the trade rate; a product without one is left
    for attachWholesale to look up. */
function toProduct(p: WholesaleApiProduct): Product {
  const item = apiProductToProduct({ ...p, price: p.price ?? "0", selling_price: p.selling_price ?? "0", style_type: p.style_type ?? 0 });
  const price = Number(p.selling_price ?? p.price);
  return price > 0 ? { ...item, wholesale: { price, mrp: Number(p.price) > price ? Number(p.price) : 0, minQty: p.moq || WHOLESALE_MIN_METRES } } : item;
}

/** The feed's video products as reels — what buildReels does for the retail home,
    with each clip's poster taken from the same piece on a rail. */
function toReels(videos: HomeVideoProduct[], rails: WholesaleRail[]): Reel[] {
  const imageById = new Map<number, string>();
  for (const r of rails) for (const p of r.items) if (p.productId) imageById.set(p.productId, p.images[0]?.src ?? "");
  /* A clip of a piece with no wholesale price isn't shown. */
  return videos.filter((v) => v.product_video_cdn && Number(v.product_selling_price) > 0).map((v) => {
    const price = Number(v.product_selling_price) || 0;
    const mrp = Number(v.product_price) || 0;
    return {
      id: `reel-${v.product_id}`, video: v.product_video_cdn, kind: "Fabric", name: v.product_name,
      price, mrp: mrp > price ? mrp : 0, unit: "metre",
      image: imageById.get(v.product_id) ?? "", slug: v.product_slug, productId: v.product_id,
    };
  });
}

/** Every rail's products, with any still unpriced given their wholesale rate — then only
    the priced ones kept (no wholesale price, not for sale wholesale), and empty rails dropped. */
async function priceRails(rails: WholesaleRail[]): Promise<WholesaleRail[]> {
  const flat = await attachWholesale(rails.flatMap((r) => r.items));
  const byId = new Map(flat.map((p) => [p.productId ?? p.slug, p]));
  return rails
    .map((r) => ({ ...r, items: forMode(r.items.map((p) => byId.get(p.productId ?? p.slug) ?? p), true) }))
    .filter((r) => r.items.length > 0);
}

/** The feed's tag rails, or — until the feed carries them — the storefront's own
    from GET /api/home (same catalogue; priceRails gives them wholesale rates). */
async function tagRails(d: WholesalePageApiResponse["data"]): Promise<WholesaleRail[]> {
  const own = (d.tag_show_home_page ?? [])
    .map((t) => ({
      id: t.tag_id ?? t.id ?? 0,
      slug: t.tag_slug ?? t.slug ?? "",
      name: t.tag_name ?? t.name ?? "",
      items: (t.products ?? []).map(toProduct),
    }))
    .filter((t) => t.slug && t.name && t.items.length > 0);
  if (own.length) return own;
  const { tagSections } = await getHomeData();
  return tagSections
    .filter((t) => t.products.length > 0)
    .map((t) => ({ id: t.id, slug: t.slug, name: t.name, items: t.products.map(apiProductToProduct) }));
}

/**
 * The wholesale front page, from GET /api/wholesale-page-data: banners, the
 * highlighted collections, every wholesale category, testimonials, a product
 * rail per tag and one per category. Returns null on any failure so
 * /wholesale-fabric can fall back to its plain explainer.
 */
export async function getWholesalePage(): Promise<WholesalePage | null> {
  try {
    const res = await fetch(`${site.url}/api/wholesale-page-data`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const { data: d }: WholesalePageApiResponse = await res.json();
    if (!d) return null;
    const [rails, tags] = await Promise.all([
      priceRails((d.category_show_home_page ?? [])
        .filter((s) => s.products.length > 0)
        .map((s) => ({ id: s.cat_id, slug: s.cat_slug, name: s.cat_name, items: s.products.map(toProduct) }))),
      tagRails(d).then(priceRails),
    ]);

    return {
      slides: (d.top_slider ?? []).map((s) => ({
        id: s.slider_id,
        alt: s.category?.cat_name ?? s.slider_name,
        image: d.slider_image + s.slider_image,
        mobileImage: d.slider_image + (s.slider_image_mobile ?? s.slider_image),
        href: s.slider_url || (s.category ? wholesaleCategoryHref(s.category.cat_slug) : null),
      })),
      collections: (d.category_high ?? []).map(toCollection),
      more: (d.category_rayon ?? []).map(toCollection),
      categories: (d.category_list ?? []).map((c) => ({ id: c.cat_id, name: c.cat_name.replace(/\s+/g, " ").trim(), slug: c.cat_slug, image: c.cat_cdn_url })),
      testimonials: (d.testimonials ?? [])
        .filter((t) => t.testimonial_status === 1)
        .map((t) => ({ id: t.testimonial_id, name: t.testimonial_name, rating: t.testimonial_rating, quote: plain(t.testimonial_desc) })),
      rails,
      tagRails: tags,
      midSlides: toSlides(d.middle_slider, wholesaleCategoryHref),
      /* The feed sends wholesale rates under the usual price names; thumbnails come from the rails. */
      reels: toReels(d.video_products ?? [], [...rails, ...tags]),
    };
  } catch {
    return null;
  }
}
