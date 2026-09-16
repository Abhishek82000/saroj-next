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
  Fabrics: "/shop?craft=fabric",
  "Wholesale @80": "https://www.sarojtextile.com/wholesale-fabric",
};

/**
 * There's no category listing page yet, so a leaf category falls back to a
 * text search for its name — the same trick the footer already uses for
 * "Ajrakh Collection" etc. Stripping the generic suffix gives the search a
 * better chance of matching real product names.
 */
export function categoryHref(name: string): string {
  const q = name.replace(/\s+(collection|prints?)$/i, "").trim();
  return `/shop?q=${encodeURIComponent(q)}`;
}

function buildLink(item: CommonMenuItem): NavLink {
  const children = (item.children ?? []).map(buildLink);
  const cat = Array.isArray(item.categories) ? undefined : item.categories;

  const href = KNOWN_HREFS[item.name]
    ?? (cat ? categoryHref(cat.cat_name) : children.length > 0 ? "/shop" : categoryHref(item.name));

  return { id: item.id, label: item.name, href, children };
}

/**
 * The site-wide nav tree (Fabrics, Dupattas, Suits, ...), fetched fresh every
 * few minutes. Returns [] on any failure so the header can fall back to its
 * static links instead of breaking. "Home" is dropped — the brand mark
 * already links there.
 */
export async function getNavMenu(): Promise<NavLink[]> {
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
