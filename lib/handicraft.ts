import { cache } from "react";
import { apiProductToProduct, buildReels, toHandiCats, toSlides, type HandiCat } from "./home";
import { categoryHref } from "./nav";
import { ApiUnavailableError } from "./product-api";
import { site } from "./site";
import type { BannerSlide, HomeApiSlide, Product, Reel, CommonFeaturedCategory, HomeApiProduct, HomeCategorySection, HomeHandiCategory, HomeTagSection, HomeVideoProduct } from "./types";
import { fixImages } from "./img";

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
    /** Handicraft pieces on film, for the shoppable reels (same shape as video_products). */
    video_handicraft_products?: HomeVideoProduct[];
    testimonials: HandicraftApiTestimonial[];
    /** The handicraft categories picked for the Kaarigar Wheel. */
    handicraftFeatCategory?: HandicraftApiFeatCategory[];
    /** The fabric categories for the sliding shelf. */
    fabricCategory?: HandicraftApiFeatCategory[];
    /** Every handicraft category (cat_type 1). */
    handicraftCategory?: HandicraftApiFeatCategory[];
    /** Handicraft categories with their products — the page's product rails. */
    handicraft_show_home_page?: HomeCategorySection[];
    /** Paper (type 1) and quilted (type 2) handicraft categories, for HandicraftRail — no images. */
    handicraft_type_show_home_page?: HomeHandiCategory[];
    /** Small banners between the category rails — the same shape as /api/home's. */
    middle_slider?: HomeApiSlide[];
  };
}

/**
 * One category, for the wheel or the fabric slider. The storefront names these fields differently from
 * endpoint to endpoint (name vs cat_name, image vs cat_cdn_url), so every
 * spelling seen elsewhere in its API is accepted.
 */
export interface HandicraftApiFeatCategory {
  id?: number; cat_id?: number;
  name?: string; cat_name?: string;
  slug?: string; cat_slug?: string;
  name_hi?: string; hindi_name?: string;
  image?: string | null; cat_image?: string | null; cat_cdn_url?: string | null; image_cdn?: string | null;
  products_count?: number; product_count?: number;
}

function toFace(c: HandicraftApiFeatCategory): HcFace | null {
  const name = c.name ?? c.cat_name;
  const img = c.image ?? c.cat_cdn_url ?? c.image_cdn ?? c.cat_image;
  if (!name || !img) return null;
  const slug = c.slug ?? c.cat_slug;
  const count = c.products_count ?? c.product_count;
  return {
    name,
    img,
    alt: name,
    href: slug ? categoryHref(slug) : undefined,
    hi: c.name_hi ?? c.hindi_name,
    meta: "Shop the collection",
    count: count ? `${count} ${count === 1 ? "piece" : "pieces"}` : undefined,
  };
}

export interface HcPlate { href: string; src: string; cap: string; alt: string }
/** A row of product cards under one heading. */
export interface HcRail { id: string; heading: string; items: Product[] }
export interface HcSwatch { href: string; src: string; title: string }
export interface HcFace { name: string; href?: string; img: string; alt: string; hi?: string; meta: string; count?: string; swap?: string }
export interface HcBolt { name: string; desc: string; price: string; img: string; alt: string }
export interface HcSlide { name: string; href?: string; img: string; count?: string }
export interface HcVideo { src: string; name: string; href: string }

/** Everything /handicraft can take from the storefront. Empty lists mean the section is left out. */
export interface HandicraftData {
  columnImages: string[];
  plates: HcPlate[];
  swatches: HcSwatch[];
  faces: HcFace[];
  /** Fabric categories for the sliding shelf; falls back to the storefront's full category list. */
  fabricSlides: HcSlide[];
  bolts: HcBolt[];
  video: HcVideo | null;
  voices: { name: string; content: string | null; rating: number }[];
  collections: number;
  /** Product rails from the tags (New Arrivals, Best Seller, …), as on the home page. */
  tagRails: HcRail[];
  /** Product rails, one per stocked category. */
  categoryRails: HcRail[];
  /** Shoppable reels of handicraft pieces, drawn like the home page's. */
  reels: Reel[];
  /** `middle_slider` — small banners after the second category rail. */
  midSlides: BannerSlide[];
  /** `handicraft_type_show_home_page` — paper and quilted categories, drawn by HandicraftRail. */
  handiCats: HandiCat[];
}

const EMPTY: HandicraftData = {
  columnImages: [], plates: [], swatches: [], faces: [], fabricSlides: [], bolts: [], video: null, voices: [], collections: 0, tagRails: [], categoryRails: [], reels: [], midSlides: [], handiCats: [],
};

const productHref = (slug: string) => `/product/${slug}`;
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

/** A category's bolt in the fabric fan: its first print, and the cheapest price it starts from. */
function toBolt(c: HomeCategorySection): HcBolt {
  const first = c.products[0];
  const from = Math.min(...c.products.map((p) => Number(p.selling_price)).filter((n) => n > 0));
  // style_type 2 is a top-and-bottom suit set, sold whole rather than by the meter.
  const unit = first.style_type === 2 ? "set" : "m";
  return {
    name: c.cat_name,
    desc: `${c.products.length} ${c.products.length === 1 ? "print" : "prints"} on the shelf today, starting with ${first.name.toLowerCase()}.`,
    price: Number.isFinite(from) ? `from ${inr(from)} / ${unit}` : "",
    img: first.image,
    alt: first.image_alt || first.name,
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The API rate-limits bursts (429) and every visitor shares the server's IP, so a
    failed call is tried again after a short, growing pause before giving up. The
    signal also opts out of React's per-render fetch memo, which would otherwise hand
    a retry the same failed response. */
async function fetchHandicraftJson(): Promise<HandicraftApiResponse> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${site.api}/api/handicraft-data`, { next: { revalidate: 30 }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new ApiUnavailableError(`${res.status}: /api/handicraft-data`);
      return await res.json();
    } catch (e) {
      if (attempt >= 2) throw e;
      await wait(1000 * (attempt + 1));
    }
  }
}

/**
 * GET /api/handicraft-data — the storefront's picks for the handicraft
 * landing page. Same product shape as /api/home. Cached for a few minutes.
 * Throws when the API can't answer, so /handicraft keeps its last good copy
 * rather than being cached without its handicraft (see app/error.tsx).
 */
export const loadHandicraftData = cache(async (): Promise<HandicraftData> => {
  const json = fixImages(await fetchHandicraftJson());
  const d = json.data;
  /* The shop always has handicraft categories, so an answer without any is a broken one. */
  if (!d?.handicraftCategory?.length) throw new ApiUnavailableError("no categories: /api/handicraft-data");

  // Some categories aren't stocked yet, so the API lists them with no products.
  const stocked = (d.category_show_home_page ?? []).filter((c) => c.products.length > 0);
  const categories = (d.categories ?? []).filter((c) => c.image);
  /* This endpoint sends its handicraft categories as handicraftCategory (CategoryResource shape). */
  const handCats = (d.handicraftCategory ?? []).map(toFace).filter((f): f is HcFace => f !== null);
  /* The product rails: handicraft categories with products; until the API sends those, the general ones. */
  const handRails = (d.handicraft_show_home_page ?? []).filter((c) => (c.products ?? []).length > 0);

  const everyProduct: HomeApiProduct[] = [
    ...(d.tag_show_home_page ?? []).flatMap((t) => t.products),
    ...stocked.flatMap((c) => c.products),
  ];
  const columnImages = [...new Set(everyProduct.map((p) => p.image).filter(Boolean))];

  /* One piece per stocked category, topped up from the tag rails when fewer than three are stocked. */
  const plates = [
    ...stocked.map((c) => ({ cap: c.cat_name, p: c.products[0] })),
    ...(d.tag_show_home_page ?? []).flatMap((t) => t.products.map((p) => ({ cap: t.name, p }))),
  ].slice(0, 3).map(({ cap, p }) => ({ href: productHref(p.slug), src: p.image, cap, alt: p.image_alt || p.name }));

  /* The wheel shows every handicraft category (handicraftCategory) — the strip below reuses the same list. */
  const faces = handCats;
  const fabricSlides = (d.fabricCategory?.length ? d.fabricCategory : categories)
    .map(toFace).filter((f): f is HcFace => f !== null)
    .map((f) => ({ name: f.name, href: f.href, img: f.img, count: f.count }));
  const swatches = handCats.length
    ? handCats.slice(0, 6).map((c) => ({ href: c.href ?? "/handicraft", src: c.img, title: c.name }))
    : categories.slice(0, 6).map((c) => ({ href: categoryHref(c.slug), src: c.image, title: c.name }));

  /* This endpoint sends its clips as video_handicraft_products. */
  const v = d.video_handicraft_products?.[0] ?? d.video_products?.[0];

  return {
    columnImages,
    plates,
    swatches,
    faces,
    fabricSlides,
    bolts: stocked.slice(0, 5).map(toBolt),
    video: v ? { src: v.product_video_cdn, name: v.product_name, href: productHref(v.product_slug) } : null,
    voices: (d.testimonials ?? []).map((t) => ({ name: t.name, content: t.content, rating: t.rating })),
    collections: handCats.length || (d.categories?.length ?? 0),
    // Thumbnails are borrowed from the rails by product id, same as on the home page.
    reels: buildReels({
      tagSections: d.tag_show_home_page ?? [],
      categorySections: stocked,
      videoProducts: d.video_handicraft_products ?? [],
    }).map((r) => ({ ...r, kind: "Handicraft" as const, unit: "piece" })),
    tagRails: (d.tag_show_home_page ?? []).filter((t) => t.products.length > 0)
      .map((t) => ({ id: t.slug, heading: t.name, items: t.products.map(apiProductToProduct) })),
    /* Handicraft rails are sold by the unit whatever style_type says. */
    categoryRails: handRails.length
      ? handRails.map((c) => ({ id: c.cat_slug, heading: c.cat_name,
          items: c.products.map((p) => ({ ...apiProductToProduct(p), kind: "craft" as const, unit: "unit" })) }))
      : stocked.map((c) => ({ id: c.cat_slug, heading: c.cat_name, items: c.products.map(apiProductToProduct) })),
    midSlides: toSlides(d.middle_slider),
    /* Pictures borrowed by id from handicraftCategory, which carries them. */
    handiCats: toHandiCats(d.handicraft_type_show_home_page,
      (d.handicraftCategory ?? []).map((c) => ({ id: c.id ?? c.cat_id, image: c.image ?? c.cat_cdn_url ?? c.image_cdn ?? c.cat_image }))),
  };
});

/** For the site shell, which every page renders: empty lists on any failure, never an error. */
export const getHandicraftData = () => loadHandicraftData().catch(() => EMPTY);
