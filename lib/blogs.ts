import { site } from "./site";
import type {
  BlogApiCategory, BlogApiPost, BlogApiRelatedProduct, BlogDetailApiResponse, BlogsListApiResponse, Product,
} from "./types";

const BLOG_IMG = (file: string | null) => (file ? `${site.url}/img/uploads/blogs/${file}` : "");

/** Strips HTML tags for a plain-text teaser under a card's title. */
function excerptOf(html: string, max = 140): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export interface BlogSummary {
  id: number;
  name: string;
  slug: string;
  excerpt: string;
  image: string;
  date: string;
  category?: string;
  featured: boolean;
}

function toSummary(p: BlogApiPost): BlogSummary {
  return {
    id: p.blog_id,
    name: p.blog_name,
    slug: p.blog_slug,
    excerpt: p.blog_meta_desc || excerptOf(p.blog_desc),
    image: BLOG_IMG(p.blog_image),
    date: p.blog_date,
    category: p.categories?.category_name,
    featured: p.blog_featured === 1,
  };
}

export interface BlogList {
  posts: BlogSummary[];
  categories: BlogApiCategory[];
  /** The active category's own name, when one was requested. */
  activeCategory: string | null;
  page: number;
  lastPage: number;
}

const EMPTY_LIST: BlogList = { posts: [], categories: [], activeCategory: null, page: 1, lastPage: 1 };

/** The journal's listing, for /blog and the homepage teaser. `category` is
    a category_slug from the "categories" facet, e.g. "cotton" — narrows
    the list to just that category's posts. Returns an empty list on any
    failure so the page can show its own empty state. */
export async function getBlogList(page = 1, category?: string): Promise<BlogList> {
  try {
    const q = category ? `&category=${encodeURIComponent(category)}` : "";
    const res = await fetch(`${site.url}/api/blogs?page=${page}${q}`, { next: { revalidate: 300 } });
    if (!res.ok) return EMPTY_LIST;
    const json: BlogsListApiResponse = await res.json();
    return {
      posts: (json.data?.blogs ?? []).map(toSummary),
      categories: json.data?.categories ?? [],
      activeCategory: json.data?.category?.name ?? null,
      page: json.data?.pagination?.current_page ?? 1,
      lastPage: json.data?.pagination?.last_page ?? 1,
    };
  } catch {
    return EMPTY_LIST;
  }
}

export interface BlogPost extends BlogSummary {
  html: string;
  related: Product[];
}

/** The related-products list has its own field names, distinct from the
    home/category endpoints' HomeApiProduct shape. */
function relatedToProduct(p: BlogApiRelatedProduct): Product {
  const price = Number(p.product_selling_price);
  const mrp = Number(p.product_price);
  return {
    slug: p.product_slug,
    name: p.product_name,
    short: p.product_name,
    kind: "fabric",
    craft: "",
    material: "",
    price,
    mrp: mrp > price ? mrp : 0,
    unit: "metre",
    stock: p.product_stock <= 0 ? "out" : p.product_stock < 10 ? "low" : "in",
    images: [{ src: p.product_image_cdn, note: p.product_name }],
    fresh: p.product_id,
    sold: 0,
  };
}

/** A single post's full page, backed by GET /api/blogs/<slug>. Returns null
    on any failure or unknown slug so the route can 404 instead of breaking. */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${site.url}/api/blogs/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json: BlogDetailApiResponse = await res.json();
    const b = json.data?.blog;
    if (!b) return null;
    return {
      ...toSummary(b),
      html: b.blog_desc,
      related: (json.data?.related_products ?? []).map(relatedToProduct),
    };
  } catch {
    return null;
  }
}
