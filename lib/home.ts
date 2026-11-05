import { categoryHref, getFeaturedCategories } from "./nav";
import { site } from "./site";
import type {
  BannerSlide, CommonCategoryRef, CommonFeaturedCategory, HomeApiProduct, HomeApiSlide, HomeApiResponse, HomeCategorySection, HomeHandiCategory, HomeTagSection, HomeVideoProduct,
  Product, ProductDetailApiResponse, ProductsApiResponse, ProductsApiSaleProduct, ProductsApiTag,
  Reel, SaleProduct,
} from "./types";
import { fixImages } from "./img";
import { ApiUnavailableError } from "./product-api";
import { cache } from "react";

export interface HomeData {
  /** `categories` — the fabric categories, drawn by Hero. */
  categories: CommonFeaturedCategory[];
  /** `top_slider` — the banners across the top of the page. */
  slides: BannerSlide[];
  /** `middle_slider` — the small banners between the category rails. */
  midSlides: BannerSlide[];
  tagSections: HomeTagSection[];
  categorySections: HomeCategorySection[];
  /** `handicraft_show_home_page` — paper (type 1) and quilted (type 2) handicraft categories, drawn by HandicraftRail. */
  handicraftCats: HandiCat[];
  /** `handcategories` — the handicraft categories, drawn by CraftHouse. */
  handCategories: CommonFeaturedCategory[];
  videoProducts: HomeVideoProduct[];
  /** `testimonials` — the Voices review wall, as plain text. */
  voices: { name: string; content: string | null; rating: number }[];
}

const EMPTY_HOME_DATA: HomeData = { categories: [], slides: [], midSlides: [], tagSections: [], categorySections: [], handicraftCats: [], handCategories: [], videoProducts: [], voices: [] };

/** A handicraft category for HandicraftRail: 1 = paper handicraft, 2 = quilted handicraft. */
export interface HandiCat { id: number; name: string; slug: string; type: 1 | 2; image: string }

/** `handicraft_show_home_page` carries no image, so each category borrows its picture by id from
    another category list; /api/handicraft-data's `handicraft_type_show_home_page` sends its own
    (empty when it has neither). Types other than 1 and 2 aren't shown. */
export const toHandiCats = (list: HomeHandiCategory[] | undefined, images: { id?: number; image?: string | null }[] | undefined): HandiCat[] => {
  const imageById = new Map((images ?? []).map((c) => [c.id, c.image ?? ""]));
  return (list ?? [])
    .filter((c) => (c.cat_handi_type === 1 || c.cat_handi_type === 2) && c.cat_slug)
    .map((c) => ({ id: c.cat_id, name: c.cat_name, slug: c.cat_slug, type: c.cat_handi_type as 1 | 2, image: c.image || imageById.get(c.cat_id) || "" }));
};

/** The API's `categories`, ready to draw: one without a picture or a link is dropped. */
const toCategories = (list: CommonFeaturedCategory[] | undefined): CommonFeaturedCategory[] =>
  (list ?? []).filter((c) => c.image && c.slug).map((c) => ({ ...c, name: c.name.replace(/\s+/g, " ").trim() }));

/** API banners (`top_slider`, `middle_slider`) into BannerSlide; one without an image is dropped.
    `catHref` lets the wholesale page point category banners at its own listings. */
export const toSlides = (list: HomeApiSlide[] | undefined, catHref: (slug: string) => string = categoryHref): BannerSlide[] =>
  (list ?? []).filter((s) => s.image_web).map((s) => ({
    id: s.id,
    alt: s.category?.name ?? s.tag?.name ?? s.name,
    image: s.image_web,
    mobileImage: s.image_mobile || s.image_web,
    href: s.url || (s.category ? catHref(s.category.slug) : s.tag ? `/shop/${s.tag.slug}` : null),
  }));

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The last good answer this server got, handed out while the API is down. */
let lastHomeData: HomeData | null = null;

/** GET /api/home, tried again after a short, growing pause when it fails (the API
    rate-limits bursts, and every visitor shares the server's IP). The signal also
    opts out of React's per-render fetch memo, which would hand a retry the same
    failed response. */
async function fetchHomeJson(): Promise<HomeApiResponse> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${site.api}/api/home`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new ApiUnavailableError(`${res.status}: /api/home`);
      return await res.json();
    } catch (e) {
      if (attempt >= 2) throw e;
      await wait(1000 * (attempt + 1));
    }
  }
}

/**
 * Everything the homepage pulls live from the storefront: the tag rails
 * ("New Arrivals", "Best Seller", ...), the category rails ("Ajrakh
 * Collection", "Jaipur Cotton", ...) and the shoppable-reel clips. Cached for
 * a few minutes. Throws when the API can't answer (after retries, and with no
 * earlier answer to fall back on), so the home page keeps its last good copy
 * rather than being cached with every live section missing (see app/error.tsx).
 */
export const loadHomeData = cache(async (): Promise<HomeData> => {
  try {
    const json = fixImages(await fetchHomeJson());
    const data = toHomeData(json);
    /* The shop always has product rails, so an answer without any is a broken one. */
    if (data.tagSections.length === 0 && data.categorySections.length === 0) throw new ApiUnavailableError("no rails: /api/home");
    lastHomeData = data;
    return data;
  } catch (e) {
    if (lastHomeData) return lastHomeData;
    throw e;
  }
});

/** loadHomeData for pages that only borrow from the home feed (shop sidebars,
    product prices): empty lists instead of an error when it can't be had. */
export async function getHomeData(): Promise<HomeData> {
  try {
    return await loadHomeData();
  } catch {
    return EMPTY_HOME_DATA;
  }
}

function toHomeData(json: HomeApiResponse): HomeData {
  return {
    categories: toCategories(json.data?.categories),
    slides: toSlides(json.data?.top_slider),
    midSlides: toSlides(json.data?.middle_slider),
    tagSections: json.data?.tag_show_home_page ?? [],
    // Some categories aren't stocked yet, so the API lists them with no products.
    categorySections: (json.data?.category_show_home_page ?? []).filter((c) => c.products.length > 0),
    handicraftCats: toHandiCats(json.data?.handicraft_show_home_page, json.data?.handcategories),
    handCategories: (json.data?.handcategories ?? []).filter((c) => c.image && c.slug),
    videoProducts: json.data?.video_products ?? [],
    voices: (json.data?.testimonials ?? []).map((t) => ({ name: t.name, content: t.content ? plain(t.content) : null, rating: t.rating })),
  };
}

export interface CategoryProducts {
  name: string;
  products: Product[];
  /** Every storefront category, for the "Product categories" sidebar list. */
  categories: CommonCategoryRef[];
  tags: ProductsApiTag[];
  priceRange: { min: number; max: number } | null;
  /** A handful of reduced-price picks for the sidebar's "Recommended" rail. */
  saleProducts: SaleProduct[];
  /** `categories` — the fabric categories, for the fabric house under the list. */
  fabricCategories: CommonFeaturedCategory[];
  /** The category's `cat_short_desc` as plain text; empty for tags or when unset. */
  shortDesc?: string;
  /** Child categories (e.g. Tote Bags → 18x18, 16*16 …). When there are any,
      the category page shows these instead of a product list. */
  subcategories?: CommonFeaturedCategory[];
}

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&rsquo;": "’", "&lsquo;": "‘", "&ldquo;": "“", "&rdquo;": "”", "&ndash;": "–", "&mdash;": "—" };

/** Editor HTML → one line of plain text. */
export function plain(html: string, max?: number): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? " ")
    .replace(/\*\*|__/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return max && text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

const EMPTY_CATEGORY: CategoryProducts = {
  name: "", products: [], categories: [], tags: [], priceRange: null, saleProducts: [], fabricCategories: [],
};

/** The four sort orders the storefront API understands for GET /api/products. */
export type ProductsApiSort = "best_selling" | "new_arrival" | "high_low" | "low_high";

/** GET /api/products takes either ?category=<slug> or ?tag=<slug> — never both —
    or neither, for every product on the counter. */
type Listing = { category: string } | { tag: string } | { all: true };

/** One listing page. The API rate-limits bursts (429) and has no page-size
    option (always 24), so a 429 is retried after a short, growing pause. */
const fetchListingPage = async (by: Listing, page: number, sort: ProductsApiSort, seed?: number) => {
  const filter = "category" in by ? `category=${encodeURIComponent(by.category)}&`
    : "tag" in by ? `tag=${encodeURIComponent(by.tag)}&` : "";
  const url = `${site.api}/api/products?${filter}page=${page}&sort=${sort}${seed ? `&seed=${seed}` : ""}`;
  /* Always cached: uncached listings cost the API several ORDER BY RAND()
     calls per visit. The per-refresh shuffle happens in the browser instead
     (ShopListing). */
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (res.status !== 429 || attempt >= 3) return res;
    await wait(1500 * (attempt + 1));
  }
};

/** Runs `fn` over `items` a few at a time — the API rate-limits (429) a burst
    of dozens of parallel requests, which "every product" (40+ pages) would be. */
async function pooled<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}
/** The API's shuffle seed, fixed for each 5-minute window: every page of a
    listing shares it (so pages don't repeat or drop products) and the URL stays
    the same for the whole window, so the cache above actually gets hits. */
export const newShuffleSeed = () => Math.floor(Date.now() / 300_000);

/** Fisher–Yates on a copy; `on: false` returns the list as it came. The shop
    views run it on the server for each request, over the cached API data, so
    every refresh arrives in a new order with no extra API calls and no
    client-side reshuffle flashing in after hydration. */
export function shuffled<T>(list: T[], on = true): T[] {
  if (!on) return list;
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Kept for the fallback fetch below, which only ever anchors on a category. */
const fetchCategoryPage = (slug: string, page: number, sort: ProductsApiSort) =>
  fetchListingPage({ category: slug }, page, sort);

type SidebarFacets = Pick<CategoryProducts, "categories" | "tags" | "priceRange" | "saleProducts" | "fabricCategories">;
const EMPTY_FACETS: SidebarFacets = { categories: [], tags: [], priceRange: null, saleProducts: [], fabricCategories: [] };

/**
 * A handful of storefront categories are listed in the nav/menu but 404 when
 * actually queried (broken on the storefront's own backend) — that request
 * then has no sidebar data at all. categoryList and tagsList are the same
 * across every category (checked: identical 33-entry list, identical two
 * tags on both Ajrakh and Jaipur Cotton) and saleProducts is a general
 * "recommended" pool rather than a strict per-category one, so borrowing all
 * four facets from any known-working category — the first featured one —
 * keeps the whole sidebar intact instead of only "Product categories".
 */
async function fallbackFacets(sort: ProductsApiSort): Promise<SidebarFacets> {
  try {
    const featured = await getFeaturedCategories();
    const anchor = featured[0]?.slug;
    if (!anchor) return EMPTY_FACETS;
    const res = await fetchCategoryPage(anchor, 1, sort);
    if (!res.ok) return EMPTY_FACETS;
    const json: ProductsApiResponse = fixImages(await res.json());
    const pr = json.data?.price_range;
    return {
      categories: json.data?.categoryList ?? [],
      tags: json.data?.tagsList ?? [],
      priceRange: pr ? { min: Number(pr.min), max: Number(pr.max) } : null,
      saleProducts: (json.data?.saleProducts ?? []).map(apiSaleProductToSaleProduct),
      fabricCategories: toCategories(json.data?.categories),
    };
  } catch {
    return EMPTY_FACETS;
  }
}

/**
 * One storefront listing's full product list — either a category (the Shelf,
 * the nav menu) or a tag (the sidebar's "Tags" links) — page a category
 * tile links to. The API paginates at 24 a page, so this fetches page 1 to
 * learn the true total, then pulls every remaining page in parallel —
 * otherwise a 151-piece collection like Ajrakh would silently show only its
 * first 24. Returns an empty list on any failure so the page can show its
 * "nothing here yet" state instead of breaking.
 */
async function getListingProducts(by: Listing, sort: ProductsApiSort, name: (j: ProductsApiResponse) => string): Promise<CategoryProducts> {
  try {
    const seed = newShuffleSeed();
    const first = await fetchListingPage(by, 1, sort, seed);
    if (!first.ok) return { ...EMPTY_CATEGORY, ...(await fallbackFacets(sort)) };
    const firstJson: ProductsApiResponse = fixImages(await first.json());
    /* Kept even without an image (the tile falls back to a plain swatch). */
    const subcategories = (firstJson.data?.subcategories ?? [])
      .filter((c) => c.slug)
      .map((c) => ({ ...c, name: c.name.replace(/\s+/g, " ").trim() }));
    const products = [...(firstJson.data?.products ?? [])];
    /* A parent category shows its subcategories, not products: skip the other pages. */
    const lastPage = subcategories.length > 0 ? 1 : firstJson.data?.pagination?.last_page ?? 1;

    if (lastPage > 1) {
      const rest = await pooled(Array.from({ length: lastPage - 1 }, (_, i) => i + 2), 2, async (page) => {
        try {
          const res = await fetchListingPage(by, page, sort, seed);
          if (!res.ok) return [];
          const json: ProductsApiResponse = fixImages(await res.json());
          return json.data?.products ?? [];
        } catch { return []; }
      });
      for (const list of rest) products.push(...list);
    }

    const pr = firstJson.data?.price_range;
    const categories = firstJson.data?.categoryList ?? [];
    const tags = firstJson.data?.tagsList ?? [];
    const saleProducts = (firstJson.data?.saleProducts ?? []).map(apiSaleProductToSaleProduct);
    // A listing that 200s but ships none of its own sidebar data (seen on a
    // few live slugs) gets the same borrowed facets as an outright 404.
    const needsFallback = categories.length === 0 && tags.length === 0 && saleProducts.length === 0;
    const fallback = needsFallback ? await fallbackFacets(sort) : null;

    return {
      name: name(firstJson),
      shortDesc: plain(firstJson.data?.category?.cat_short_desc ?? ""),
      subcategories,
      products: products.map(apiProductToProduct),
      categories: fallback?.categories ?? categories,
      tags: fallback?.tags ?? tags,
      priceRange: fallback?.priceRange ?? (pr ? { min: Number(pr.min), max: Number(pr.max) } : null),
      saleProducts: fallback?.saleProducts ?? saleProducts,
      fabricCategories: fallback?.fabricCategories ?? toCategories(firstJson.data?.categories),
    };
  } catch {
    return { ...EMPTY_CATEGORY, ...(await fallbackFacets(sort)) };
  }
}

export function getCategoryProducts(slug: string, sort: ProductsApiSort = "new_arrival"): Promise<CategoryProducts> {
  return getListingProducts({ category: slug }, sort, (j) => j.data?.category?.name ?? "");
}

/** Every product on the counter, all 40-odd pages — the sitemap only (slow; cached hourly). */
export function getAllProducts(sort: ProductsApiSort = "new_arrival"): Promise<CategoryProducts> {
  return getListingProducts({ all: true }, sort, () => "Shop everything");
}

/** One page of every product plus the sidebar facets — /shop's first screen;
    the listing loads the following pages as the visitor scrolls. */
export async function getProductsPage(sort: ProductsApiSort = "new_arrival", page = 1):
  Promise<CategoryProducts & { page: number; lastPage: number; total: number; seed: number }> {
  const seed = newShuffleSeed();
  try {
    const res = await fetchListingPage({ all: true }, page, sort, seed);
    if (!res.ok) return { ...EMPTY_CATEGORY, ...(await fallbackFacets(sort)), page, lastPage: page, total: 0, seed };
    const json: ProductsApiResponse = fixImages(await res.json());
    const pr = json.data?.price_range;
    return {
      name: "Shop everything",
      products: (json.data?.products ?? []).map(apiProductToProduct),
      categories: json.data?.categoryList ?? [],
      tags: json.data?.tagsList ?? [],
      priceRange: pr ? { min: Number(pr.min), max: Number(pr.max) } : null,
      saleProducts: (json.data?.saleProducts ?? []).map(apiSaleProductToSaleProduct),
      fabricCategories: toCategories(json.data?.categories),
      page,
      lastPage: json.data?.pagination?.last_page ?? page,
      total: json.data?.pagination?.total ?? 0,
      seed,
    };
  } catch {
    return { ...EMPTY_CATEGORY, ...(await fallbackFacets(sort)), page, lastPage: page, total: 0, seed };
  }
}

/** A tag's own listing, for the sidebar's "Tags" links (e.g. Best Seller, New Arrivals). */
export function getTagProducts(slug: string, sort: ProductsApiSort = "new_arrival"): Promise<CategoryProducts> {
  return getListingProducts({ tag: slug }, sort, (j) => j.data?.tag?.name ?? "");
}

/** Turns an /api/products "saleProducts" entry into a sidebar-ready pick. */
function apiSaleProductToSaleProduct(p: ProductsApiSaleProduct): SaleProduct {
  const price = Number(p.product_selling_price);
  const mrp = Number(p.product_price);
  return {
    name: p.product_name,
    slug: p.product_slug,
    image: p.product_image_cdn || p.product_image,
    price,
    mrp: mrp > price ? mrp : 0,
  };
}

/** `shipping` (product_shipping_free) is 1 / true when the piece ships free. */
export const shipsFree = (v: HomeApiProduct["shipping"]) => Number(v) === 1;

/** Turns an /api/home product into the shape Rail and the product cards expect.
    style_type 1 is fabric by the meter; anything else is handicraft, sold by the unit. */
export function apiProductToProduct(p: HomeApiProduct): Product {
  const price = Number(p.selling_price);
  const mrp = Number(p.price);
  const fabric = p.style_type === 1;
  return {
    slug: p.slug,
    name: p.name,
    short: p.name,
    kind: fabric ? "fabric" : "craft",
    craft: "",
    material: "",
    price,
    mrp: mrp > price ? mrp : 0,
    unit: fabric ? "meter" : "unit",
    ...(shipsFree(p.shipping) ? { shippingFree: true } : {}),
    stock: p.stock <= 0 ? "out" : p.stock < 10 ? "low" : "in",
    images: [{ src: p.image, note: p.image_alt ?? "" }],
    fresh: p.id,
    productId: p.id,
    sold: 0,
    label: p.label || undefined,
  };
}

export interface ApiProductDetail {
  product: Product;
  related: Product[];
}

/**
 * A single product's own page, backed by GET /api/products/{slug}. That
 * endpoint has no price/stock for the product itself, so we backfill both by
 * checking the home rails and category listings for the same product id —
 * if it isn't found there either, price/stock stay unknown and the page
 * shows no buy box rather than a fake ₹0. Returns null on any failure (or if
 * the slug genuinely doesn't exist) so the page can 404 instead of breaking.
 */
export async function getProductDetail(slug: string): Promise<ApiProductDetail | null> {
  try {
    const res = await fetch(`${site.api}/api/products/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json: ProductDetailApiResponse = fixImages(await res.json());
    const d = json.data?.product;
    if (!d) return null;

    const home = await getHomeData();
    const byId = new Map<number, HomeApiProduct>();
    for (const tag of home.tagSections) for (const p of tag.products) byId.set(p.id, p);
    for (const cat of home.categorySections) for (const p of cat.products) byId.set(p.id, p);
    const priced = byId.get(d.id);

    const images = [d.image, ...(d.gallery ?? [])].filter(Boolean).map((src) => ({ src, note: d.name }));

    const product: Product = {
      slug: d.slug,
      name: d.name,
      short: d.name,
      kind: "fabric",
      craft: "",
      material: "",
      unit: "meter",
      price: priced ? Number(priced.selling_price) : 0,
      mrp: priced && Number(priced.price) > Number(priced.selling_price) ? Number(priced.price) : 0,
      // Unpriced means "we don't actually know" — treated as out of stock so
      // the buy box can't check someone out at a fabricated ₹0.
      stock: !priced ? "out" : priced.stock <= 0 ? "out" : priced.stock < 10 ? "low" : "in",
      images: images.length > 0 ? images : [{ src: d.image, note: d.name }],
      fresh: d.id,
      productId: d.id,
      sold: 0,
      label: priced?.label || undefined,
    };

    return { product, related: (json.data?.related_products ?? []).map(apiProductToProduct) };
  } catch {
    return null;
  }
}

/**
 * video_products has no thumbnail of its own, so we borrow one from the tag
 * and category rails by product id where the clip's product also shows up there.
 */
export function buildReels({ tagSections, categorySections, videoProducts }: Pick<HomeData, "tagSections" | "categorySections" | "videoProducts">): Reel[] {
  const imageById = new Map<number, string>();
  for (const tag of tagSections) for (const p of tag.products) imageById.set(p.id, p.image);
  for (const cat of categorySections) for (const p of cat.products) imageById.set(p.id, p.image);

  return videoProducts.map((v) => {
    const price = Number(v.product_selling_price);
    const mrp = Number(v.product_price);
    return {
      id: `reel-${v.product_id}`,
      video: v.product_video_cdn,
      kind: "Fabric",
      name: v.product_name,
      price,
      mrp: mrp > price ? mrp : 0,
      unit: "meter",
      image: imageById.get(v.product_id) ?? "",
      slug: v.product_slug,
      productId: v.product_id,
    };
  });
}
