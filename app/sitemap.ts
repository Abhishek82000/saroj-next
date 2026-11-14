import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/home";
import { categoryHref } from "@/lib/nav";
import { site } from "@/lib/site";

/** Rebuilt at most hourly. */
export const revalidate = 3600;

const at = (path: string) => site.url.replace(/\/$/, "") + path;

type Row = { slug: string; lastmod: string | null };
interface SitemapApi {
  success: boolean;
  data?: {
    pages?: Row[];
    categories?: Row[];
    wholesale_categories?: Row[];
    tags?: Row[];
    retail_products?: Row[];
    wholesale_products?: Row[];
    blogs?: Row[];
  };
}

type Freq = "daily" | "weekly" | "monthly";

/**
 * /sitemap.xml — built from GET /api/sitemap (SitemapApiController):
 *   pages → /{slug}, categories + tags → /shop/{slug},
 *   wholesale categories → /wholesale/{slug},
 *   retail products → /product/{slug}, wholesale products → /wholesale/product/{slug},
 *   blogs → /blog/{slug}
 * plus the storefront's own fixed pages. If the API is down, falls back to the
 * categories and products from GET /api/products so the sitemap never empties.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];

  const add = (path: string, priority: number, changeFrequency: Freq, lastmod?: string | null) => {
    const url = at(path);
    if (seen.has(url)) return;
    seen.add(url);
    out.push({ url, lastModified: lastmod ? new Date(lastmod) : now, changeFrequency, priority });
  };
  const each = (rows: Row[] | undefined, path: (slug: string) => string, priority: number, freq: Freq) =>
    (rows ?? []).forEach((r) => r.slug && add(path(encodeURIComponent(r.slug)), priority, freq, r.lastmod));

  /* The storefront's own pages. */
  add("/", 1, "daily");
  add("/shop", 0.9, "daily");
  add("/handicraft", 0.8, "weekly");
  add("/wholesale-fabric", 0.8, "weekly");
  add("/wholesale-fabric/shop", 0.7, "daily");
  add("/blog", 0.6, "weekly");
  add("/about", 0.5, "monthly");
  add("/contact", 0.4, "monthly");
  add("/faq", 0.4, "monthly");

  const api = await getSitemapData();
  if (api) {
    each(api.pages, (s) => `/${s}`, 0.4, "monthly");
    each(api.categories, (s) => `/shop/${s}`, 0.7, "daily");
    each(api.tags, (s) => `/shop/${s}`, 0.6, "daily");
    each(api.wholesale_categories, (s) => `/wholesale/${s}`, 0.6, "daily");
    each(api.retail_products, (s) => `/product/${s}`, 0.8, "weekly");
    each(api.wholesale_products, (s) => `/wholesale/product/${s}`, 0.5, "weekly");
    each(api.blogs, (s) => `/blog/${s}`, 0.6, "monthly");
    return out;
  }

  /* Fallback: the old sitemap source. low_high keeps the page fetches cached. */
  const { products, categories } = await getAllProducts("low_high");
  categories.forEach((c) => add(categoryHref(c.cat_slug), 0.7, "daily"));
  products.forEach((p) => add(`/product/${p.slug}`, 0.8, "weekly"));
  return out;
}

async function getSitemapData(): Promise<SitemapApi["data"] | null> {
  try {
    const res = await fetch(`${site.api}/api/sitemap`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json: SitemapApi = await res.json();
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}
