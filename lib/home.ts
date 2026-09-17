import { site } from "./site";
import type {
  HomeApiProduct, HomeApiResponse, HomeCategorySection, HomeTagSection, HomeVideoProduct, Product,
  ProductDetailApiResponse, ProductsApiResponse, Reel,
} from "./types";

export interface HomeData {
  tagSections: HomeTagSection[];
  categorySections: HomeCategorySection[];
  videoProducts: HomeVideoProduct[];
}

const EMPTY_HOME_DATA: HomeData = { tagSections: [], categorySections: [], videoProducts: [] };

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
}

const EMPTY_CATEGORY: CategoryProducts = { name: "", products: [] };

const fetchCategoryPage = (slug: string, page: number) =>
  fetch(`${site.url}/api/products?category=${encodeURIComponent(slug)}&page=${page}`, { next: { revalidate: 300 } });

/**
 * One storefront category's full product listing, for the page a category
 * tile (the Shelf, the nav menu) links to. The API paginates at 24 a page,
 * so this fetches page 1 to learn the true total, then pulls every
 * remaining page in parallel — otherwise a 151-piece collection like Ajrakh
 * would silently show only its first 24. Returns an empty list on any
 * failure so the page can show its "nothing here yet" state instead of breaking.
 */
export async function getCategoryProducts(slug: string): Promise<CategoryProducts> {
  try {
    const first = await fetchCategoryPage(slug, 1);
    if (!first.ok) return EMPTY_CATEGORY;
    const firstJson: ProductsApiResponse = await first.json();
    const products = [...(firstJson.data?.products ?? [])];
    const lastPage = firstJson.data?.pagination?.last_page ?? 1;

    if (lastPage > 1) {
      const rest = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, i) => fetchCategoryPage(slug, i + 2)),
      );
      for (const res of rest) {
        if (!res.ok) continue;
        const json: ProductsApiResponse = await res.json();
        products.push(...(json.data?.products ?? []));
      }
    }

    return {
      name: firstJson.data?.category?.cat_name ?? "",
      products: products.map(apiProductToProduct),
    };
  } catch {
    return EMPTY_CATEGORY;
  }
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
export function buildReels({ tagSections, categorySections, videoProducts }: HomeData): Reel[] {
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
