import { categoryHref, getFeaturedCategories } from "./nav";
import { site } from "./site";
import type {
  BannerSlide, CommonCategoryRef, HomeApiProduct, HomeApiResponse, HomeCategorySection, HomeTagSection, HomeVideoProduct,
  Product, ProductDetailApiResponse, ProductsApiResponse, ProductsApiSaleProduct, ProductsApiTag,
  Reel, SaleProduct,
} from "./types";

export interface HomeData {
  /** `top_slider` — the banners across the top of the page. */
  slides: BannerSlide[];
  tagSections: HomeTagSection[];
  categorySections: HomeCategorySection[];
  videoProducts: HomeVideoProduct[];
}

const EMPTY_HOME_DATA: HomeData = { slides: [], tagSections: [], categorySections: [], videoProducts: [] };

/**
 * Everything the homepage pulls live from the storefront: the tag rails
 * ("New Arrivals", "Best Seller", ...), the category rails ("Ajrakh
 * Collection", "Jaipur Cotton", ...) and the shoppable-reel clips. Fetched
 * once per render and cached for a few minutes; returns empty lists on any
 * failure so the page can fall back to its static content instead of breaking.
 */
export async function getHomeData(): Promise<HomeData> {
  try {
    const res = await fetch(`${site.url}/api/home`, { next: { revalidate: 300 } });
    if (!res.ok) return EMPTY_HOME_DATA;
    const json: HomeApiResponse = await res.json();
    return {
      slides: (json.data?.top_slider ?? []).filter((s) => s.image_web).map((s) => ({
        id: s.id,
        alt: s.category?.name ?? s.tag?.name ?? s.name,
        image: s.image_web,
        mobileImage: s.image_mobile || s.image_web,
        href: s.url || (s.category ? categoryHref(s.category.slug) : s.tag ? `/shop/${s.tag.slug}` : null),
      })),
      tagSections: json.data?.tag_show_home_page ?? [],
      // Some categories aren't stocked yet, so the API lists them with no products.
      categorySections: (json.data?.category_show_home_page ?? []).filter((c) => c.products.length > 0),
      videoProducts: json.data?.video_products ?? [],
    };
  } catch {
    return EMPTY_HOME_DATA;
  }
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
}

const EMPTY_CATEGORY: CategoryProducts = {
  name: "", products: [], categories: [], tags: [], priceRange: null, saleProducts: [],
};

/** The four sort orders the storefront API understands for GET /api/products. */
export type ProductsApiSort = "best_selling" | "new_arrival" | "high_low" | "low_high";

/** GET /api/products takes either ?category=<slug> or ?tag=<slug> — never both. */
type Listing = { category: string } | { tag: string };

const fetchListingPage = (by: Listing, page: number, sort: ProductsApiSort) => {
  const key = "category" in by ? "category" : "tag";
  const slug = "category" in by ? by.category : by.tag;
  return fetch(`${site.url}/api/products?${key}=${encodeURIComponent(slug)}&page=${page}&sort=${sort}`, { next: { revalidate: 300 } });
};
/** Kept for the fallback fetch below, which only ever anchors on a category. */
const fetchCategoryPage = (slug: string, page: number, sort: ProductsApiSort) =>
  fetchListingPage({ category: slug }, page, sort);

type SidebarFacets = Pick<CategoryProducts, "categories" | "tags" | "priceRange" | "saleProducts">;
const EMPTY_FACETS: SidebarFacets = { categories: [], tags: [], priceRange: null, saleProducts: [] };

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
    const json: ProductsApiResponse = await res.json();
    const pr = json.data?.price_range;
    return {
      categories: json.data?.categoryList ?? [],
      tags: json.data?.tagsList ?? [],
      priceRange: pr ? { min: Number(pr.min), max: Number(pr.max) } : null,
      saleProducts: (json.data?.saleProducts ?? []).map(apiSaleProductToSaleProduct),
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
    const first = await fetchListingPage(by, 1, sort);
    if (!first.ok) return { ...EMPTY_CATEGORY, ...(await fallbackFacets(sort)) };
    const firstJson: ProductsApiResponse = await first.json();
    const products = [...(firstJson.data?.products ?? [])];
    const lastPage = firstJson.data?.pagination?.last_page ?? 1;

    if (lastPage > 1) {
      const rest = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, i) => fetchListingPage(by, i + 2, sort)),
      );
      for (const res of rest) {
        if (!res.ok) continue;
        const json: ProductsApiResponse = await res.json();
        products.push(...(json.data?.products ?? []));
      }
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
      products: products.map(apiProductToProduct),
      categories: fallback?.categories ?? categories,
      tags: fallback?.tags ?? tags,
      priceRange: fallback?.priceRange ?? (pr ? { min: Number(pr.min), max: Number(pr.max) } : null),
      saleProducts: fallback?.saleProducts ?? saleProducts,
    };
  } catch {
    return { ...EMPTY_CATEGORY, ...(await fallbackFacets(sort)) };
  }
}

export function getCategoryProducts(slug: string, sort: ProductsApiSort = "new_arrival"): Promise<CategoryProducts> {
  return getListingProducts({ category: slug }, sort, (j) => j.data?.category?.cat_name ?? "");
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

/** Turns an /api/home product into the shape Rail and the product cards expect. */
export function apiProductToProduct(p: HomeApiProduct): Product {
  const price = Number(p.selling_price);
  const mrp = Number(p.price);
  return {
    slug: p.slug,
    name: p.name,
    short: p.name,
    kind: "fabric",
    craft: "",
    material: "",
    price,
    mrp: mrp > price ? mrp : 0,
    unit: "metre",
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
    const res = await fetch(`${site.url}/api/products/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json: ProductDetailApiResponse = await res.json();
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
      unit: "metre",
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
export function buildReels({ tagSections, categorySections, videoProducts }: Omit<HomeData, "slides">): Reel[] {
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
      unit: "metre",
      image: imageById.get(v.product_id) ?? "",
      slug: v.product_slug,
    };
  });
}
