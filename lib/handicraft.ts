import { categoryHref } from "./nav";
import { site } from "./site";
import type { CommonFeaturedCategory, HomeApiProduct, HomeCategorySection, HomeTagSection, HomeVideoProduct } from "./types";

export interface HandicraftApiTestimonial {
  id: number;
  name: string;
  content: string | null;
  image: string | null;
  rating: number;
}

export interface HandicraftApiResponse {
  success: boolean;
  data: {
    categories: CommonFeaturedCategory[];
    tag_show_home_page: HomeTagSection[];
    category_show_home_page: HomeCategorySection[];
    video_products: HomeVideoProduct[];
    testimonials: HandicraftApiTestimonial[];
  };
}

export interface HcPlate { href: string; src: string; cap: string; alt: string }
export interface HcSwatch { href: string; src: string; title: string }
export interface HcFace { name: string; href?: string; img: string; alt: string; hi?: string; meta: string; count?: string; swap?: string }
export interface HcBolt { name: string; desc: string; price: string; img: string; alt: string }
export interface HcVideo { src: string; name: string; href: string }

/** Everything /handicraft can take from the storefront. Empty lists mean "use the page's own copy". */
export interface HandicraftData {
  columnImages: string[];
  plates: HcPlate[];
  swatches: HcSwatch[];
  faces: HcFace[];
  bolts: HcBolt[];
  video: HcVideo | null;
  voices: { name: string; content: string | null; rating: number }[];
  collections: number;
}

const EMPTY: HandicraftData = {
  columnImages: [], plates: [], swatches: [], faces: [], bolts: [], video: null, voices: [], collections: 0,
};

const productHref = (slug: string) => `/product/${slug}`;
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

/** A category's bolt in the fabric fan: its first print, and the cheapest price it starts from. */
function toBolt(c: HomeCategorySection): HcBolt {
  const first = c.products[0];
  const from = Math.min(...c.products.map((p) => Number(p.selling_price)).filter((n) => n > 0));
  // style_type 2 is a top-and-bottom suit set, sold whole rather than by the metre.
  const unit = first.style_type === 2 ? "set" : "m";
  return {
    name: c.cat_name,
    desc: `${c.products.length} ${c.products.length === 1 ? "print" : "prints"} on the shelf today, starting with ${first.name.toLowerCase()}.`,
    price: Number.isFinite(from) ? `from ${inr(from)} / ${unit}` : "",
    img: first.image,
    alt: first.image_alt || first.name,
  };
}

/**
 * GET /api/handicraft-data — the storefront's picks for the handicraft
 * landing page. Same product shape as /api/home. Cached for a few minutes;
 * returns empty lists on any failure so each section falls back to the
 * page's built-in content instead of breaking.
 */
export async function getHandicraftData(): Promise<HandicraftData> {
  try {
    const res = await fetch(`${site.url}/api/handicraft-data`, { next: { revalidate: 300 } });
    if (!res.ok) return EMPTY;
    const json: HandicraftApiResponse = await res.json();
    const d = json.data;
    if (!d) return EMPTY;

    // Some categories aren't stocked yet, so the API lists them with no products.
    const stocked = (d.category_show_home_page ?? []).filter((c) => c.products.length > 0);
    const categories = (d.categories ?? []).filter((c) => c.image);

    const everyProduct: HomeApiProduct[] = [
      ...(d.tag_show_home_page ?? []).flatMap((t) => t.products),
      ...stocked.flatMap((c) => c.products),
    ];
    const columnImages = [...new Set(everyProduct.map((p) => p.image).filter(Boolean))];

    const plates = stocked.slice(0, 3).map((c) => {
      const p = c.products[0];
      return { href: productHref(p.slug), src: p.image, cap: c.cat_name, alt: p.image_alt || p.name };
    });

    const faces = categories.slice(0, 6).map((c) => ({
      name: c.name, href: categoryHref(c.slug), img: c.image, alt: c.name, meta: "Shop the collection",
    }));
    const swatches = categories.slice(6, 12).map((c) => ({ href: categoryHref(c.slug), src: c.image, title: c.name }));

    const v = d.video_products?.[0];

    return {
      columnImages,
      plates,
      swatches,
      faces,
      bolts: stocked.slice(0, 5).map(toBolt),
      video: v ? { src: v.product_video_cdn, name: v.product_name, href: productHref(v.product_slug) } : null,
      voices: (d.testimonials ?? []).map((t) => ({ name: t.name, content: t.content, rating: t.rating })),
      collections: d.categories?.length ?? 0,
    };
  } catch {
    return EMPTY;
  }
}
