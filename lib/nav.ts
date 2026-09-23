import { site } from "./site";
import type { CommonApiResponse, CommonFeaturedCategory, CommonMenuItem } from "./types";

export interface NavLink {
  id: number;
  label: string;
  href: string;
  children: NavLink[];
}

/** A few top-level names map onto filters the local catalogue already supports. */
const KNOWN_HREFS: Record<string, string> = {
  Home: "/",
  Fabrics: "/#",
  "Wholesale @80": "/wholesale-fabric",
};

/** A storefront category's own listing page, backed by GET /api/products?category=<slug>. */
export function categoryHref(slug: string): string {
  return `/shop/${slug}`;
}

/**
 * Some menu entries aren't a real category (no slug to hand the products
 * API), so they fall back to a text search for their name — the same trick
 * the footer already uses for "Ajrakh Collection" etc. Stripping the generic
 * suffix gives the search a better chance of matching real product names.
 */
function searchHref(name: string | undefined): string {
  const q = (name ?? "").replace(/\s+(collection|prints?)$/i, "").trim();
  return `/shop?q=${encodeURIComponent(q)}`;
}

function buildLink(item: CommonMenuItem): NavLink {
  const children = (item.children ?? []).map(buildLink);
  const cat = Array.isArray(item.categories) ? undefined : item.categories;

  const href = KNOWN_HREFS[item.name]
    ?? (cat ? categoryHref(cat.cat_slug) : children.length > 0 ? "/shop" : searchHref(item.name));

  return { id: item.id, label: item.name, href, children };
}

/**
 * The site-wide nav tree (Fabrics, Dupattas, Suits, ...), fetched fresh every
 * few minutes. Returns [] on any failure so the header can fall back to its
 * static links instead of breaking. "Home" is dropped — the brand mark
 * already links there.
 */
export async function getFlatMenuTree(): Promise<NavLink[]> {
  try {
    const res = await fetch(`${site.url}/api/common`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json: CommonApiResponse = await res.json();
    return (json.data?.menu ?? [])
      .map(buildLink)
      .filter((l) => !(l.href === "/" && l.children.length === 0));
  } catch {
    return [];
  }
}

/**
 * The same nav tree, but un-flattened — every item's `mega` flag, `image`,
 * `categories` and `pages` are kept intact so <Nav> can decide per item
 * whether to render a plain link, a single-block dropdown, or a full-width
 * mega panel. Prefer this over `getMenuTree()` wherever the header itself is
 * rendered; `getMenuTree()`'s flattened NavLink[] is still around for any
 * other spot (footer, mobile drawer, etc.) that only needs id/label/href.
 */
export async function getMenuTree(): Promise<CommonMenuItem[]> {
  try {
    const res = await fetch(`${site.url}/api/common`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json: CommonApiResponse = await res.json();
    const menu = json.data?.menu ?? [];
    // Match getMenuTree()'s behavior: drop the bare "Home" entry, the brand
    // mark already links there.
    return menu.filter((item) => !(item.name === "Home" && (item.children?.length ?? 0) === 0));
  } catch {
    return [];
  }
}

/**
 * The admin-set marquee text that scrolls above the header, fetched fresh
 * every few minutes. Returns null on any failure so the ticker can fall back
 * to its static messages instead of breaking.
 */
export async function getMarquee(): Promise<string | null> {
  try {
    const res = await fetch(`${site.url}/api/common`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json: CommonApiResponse = await res.json();
    return json.data?.settings?.site_website_marque?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * The homepage's featured-category tiles ("Ajrakh Collection", "Kalamkari",
 * ...), fetched fresh every few minutes. Returns [] on any failure so the
 * shelf can fall back to its static picks instead of breaking.
 */
export async function getFeaturedCategories(): Promise<CommonFeaturedCategory[]> {
  try {
    const res = await fetch(`${site.url}/api/common`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json: CommonApiResponse = await res.json();
    return json.data?.featured_categories ?? [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Mega-menu support: works straight off the raw CommonMenuItem shape  */
/* (mega / categories / pages / link / image / children) so <Nav> can  */
/* pick plain link vs. dropdown vs. full-width mega per item.          */
/* ------------------------------------------------------------------ */

export type { CommonMenuItem };

/** The API sends "no object" as `[]`. Normalize that to `null`. */
function asObject<T>(value: T | []): T | null {
  return Array.isArray(value) ? null : value;
}

/**
 * Resolves the URL for a single menu item or mega-menu child.
 * Priority: categories -> pages -> link -> (children ? "/shop" : search fallback).
 *
 * `pages` isn't part of the typed CommonMenuItem shape yet, so it's read
 * defensively here — add `pages?: { page_url: string | null } | []` to
 * CommonMenuItem in `./types` to get this type-checked properly.
 */
export function resolveHref(item: CommonMenuItem): string {
  if (!item) return "/shop";
  if (KNOWN_HREFS[item.name]) return KNOWN_HREFS[item.name];

  const category = asObject(item.categories);
  if (category?.cat_slug) return categoryHref(category.cat_slug);

  const rawPages = (item as unknown as { pages?: { page_url?: string | null } | [] }).pages;
  const page = asObject(rawPages ?? []);
  if (page?.page_url) return `/${page.page_url}`;

  const rawLink = (item as unknown as { link?: string | null }).link;
  if (rawLink) return rawLink;

  return (item.children?.length ?? 0) > 0 ? "/shop" : searchHref(item.name);
}

/** True when this item should render as a full-width mega panel. */
export function isMega(item: CommonMenuItem): boolean {
  const mega = (item as unknown as { mega?: 0 | 1 }).mega;
  return mega === 1 && (item.children?.length ?? 0) > 0;
}

/** True when this item should render the plain single-block dropdown. */
export function isDropdown(item: CommonMenuItem): boolean {
  const mega = (item as unknown as { mega?: 0 | 1 }).mega;
  return mega !== 1 && (item.children?.length ?? 0) > 0;
}

/** Max number of image tiles a mega menu is allowed to show. */
export const MEGA_IMAGE_LIMIT = 2;

/**
 * Splits a mega menu's children into the plain text links and the (at most
 * two) children that carry an image, so the caller can lay out columns.
 */
export function splitMegaChildren(children: CommonMenuItem[]) {
  const withImage = (c: CommonMenuItem) => !!(c as unknown as { image?: string | null }).image;
  const imageChildren = children.filter(withImage).slice(0, MEGA_IMAGE_LIMIT);
  const imageIds = new Set(imageChildren.map((c) => c.id));
  const textChildren = children.filter((c) => !imageIds.has(c.id));
  return { textChildren, imageChildren };
}
