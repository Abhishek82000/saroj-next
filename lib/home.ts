import { site } from "./site";
import type { HomeApiProduct, HomeApiResponse, HomeTagSection, Product } from "./types";

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
 * The homepage rails ("New Arrivals", "Best Seller", ...), fetched fresh
 * every few minutes. Returns [] on any failure so the page can fall back to
 * its static catalogue instead of breaking.
 */
export async function getHomeTagSections(): Promise<HomeTagSection[]> {
  try {
    const res = await fetch(`${site.url}/api/home`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json: HomeApiResponse = await res.json();
    return json.data?.tag_show_home_page ?? [];
  } catch {
    return [];
  }
}
