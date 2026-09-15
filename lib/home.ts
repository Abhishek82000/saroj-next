import { site } from "./site";
import type {
  HomeApiProduct, HomeApiResponse, HomeCategorySection, HomeTagSection, HomeVideoProduct, Product, Reel,
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
  };
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
