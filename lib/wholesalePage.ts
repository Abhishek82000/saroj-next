import { apiProductToProduct } from "./home";
import { site } from "./site";
import { WHOLESALE_HOME } from "./wholesale";
import { homePrices, withRates } from "./wholesalePrices";
import type { BannerSlide, Product, WholesaleApiCategory, WholesalePageApiResponse } from "./types";

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
}

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&rsquo;": "’", "&lsquo;": "‘", "&ldquo;": "“", "&rdquo;": "”", "&ndash;": "–", "&mdash;": "—" };

/** Editor HTML → one line of plain text. */
function plain(html: string, max?: number): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
  return max && text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

const toCollection = (c: WholesaleApiCategory): WholesaleCollection => ({
  id: c.cat_id, name: c.cat_name, heading: c.cat_heading || c.cat_name, slug: c.cat_slug,
  blurb: plain(c.cat_short_desc ?? "", 150), image: c.cat_cdn_url, banner: c.cat_banner_cdn || c.cat_cdn_url,
});

/**
 * The wholesale front page, from GET /api/wholesale-page-data: banners, the
 * highlighted collections, every wholesale category, testimonials and a product
 * rail per category. Returns null on any failure so /wholesale-fabric can fall
 * back to its plain explainer.
 *
 * The rail products currently come with no price (`price`/`selling_price` are
 * null), so they stay unpriced; once the feed sends one it becomes the piece's
 * wholesale rate.
 */
export async function getWholesalePage(): Promise<WholesalePage | null> {
  try {
    const res = await fetch(`${site.url}/api/wholesale-page-data`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const { data: d }: WholesalePageApiResponse = await res.json();
    if (!d) return null;
    const rates = await homePrices();

    return {
      slides: (d.top_slider ?? []).map((s) => ({
        id: s.slider_id,
        alt: s.category?.cat_name ?? s.slider_name,
        image: d.slider_image + s.slider_image,
        mobileImage: d.slider_image + (s.slider_image_mobile ?? s.slider_image),
        href: s.slider_url || (s.category ? `${WHOLESALE_HOME}/shop/${s.category.cat_slug}` : null),
      })),
      collections: (d.category_high ?? []).map(toCollection),
      more: (d.category_rayon ?? []).map(toCollection),
      categories: (d.category_list ?? []).map((c) => ({ id: c.cat_id, name: c.cat_name.replace(/\s+/g, " ").trim(), slug: c.cat_slug, image: c.cat_cdn_url })),
      testimonials: (d.testimonials ?? [])
        .filter((t) => t.testimonial_status === 1)
        .map((t) => ({ id: t.testimonial_id, name: t.testimonial_name, rating: t.testimonial_rating, quote: plain(t.testimonial_desc) })),
      rails: (d.category_show_home_page ?? [])
        .filter((s) => s.products.length > 0)
        .map((s) => ({
          id: s.cat_id, slug: s.cat_slug, name: s.cat_name,
          items: withRates(s.products.map((p) => {
            const item = apiProductToProduct({ ...p, price: p.price ?? "0", selling_price: p.selling_price ?? "0", style_type: p.style_type ?? 0 });
            const price = Number(p.selling_price ?? p.price);
            /* The feed's own trade price, when it sends one — it currently sends none. */
            return price > 0 ? { ...item, wholesale: { price, mrp: Number(p.price) > price ? Number(p.price) : 0, minQty: p.moq || 10 } } : item;
          }), rates),
        })),
    };
  } catch {
    return null;
  }
}
