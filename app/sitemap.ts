import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/home";
import { categoryHref } from "@/lib/nav";
import { site } from "@/lib/site";

/** Rebuilt at most hourly — it pulls every product page from the API. */
export const revalidate = 3600;

const at = (path: string) => site.url.replace(/\/$/, "") + path;

/**
 * Everything live on the storefront: the fixed pages, every category, and
 * every product from GET /api/products. Wholesale mirrors and account/cart
 * pages stay out (noindex).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const { products, categories } = await getAllProducts();
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly" = "weekly") =>
    ({ url: at(path), lastModified: now, changeFrequency, priority });

  return [
    page("/", 1, "daily"),
    page("/shop", 0.9, "daily"),
    page("/handicraft", 0.8),
    page("/blog", 0.6),
    page("/contact", 0.4, "monthly"),
    page("/faq", 0.4, "monthly"),
    ...categories.map((c) => page(categoryHref(c.cat_slug), 0.7, "daily")),
    ...products.map((p) => page(`/product/${p.slug}`, 0.8)),
  ];
}
