import { site } from "./site";
import type { PageDataApiResponse } from "./types";

export interface StaticPage {
  name: string;
  /** Raw HTML from the storefront's own editor — rendered as-is in the middle of the page. */
  html: string;
}

/**
 * A static content page — Privacy Policy, Terms, Return Policy, and the
 * like — backed by GET /api/page-data/<slug>. This app supplies the header,
 * footer and breadcrumb; the storefront supplies everything in between as
 * one HTML blob. Returns null on any failure or unknown slug so the route
 * can 404 instead of breaking.
 */
export async function getStaticPage(slug: string): Promise<StaticPage | null> {
  try {
    const res = await fetch(`${site.url}/api/page-data/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json: PageDataApiResponse = await res.json();
    if (json.status !== "success" || !json.data) return null;
    return { name: json.data.page_name, html: json.data.page_content };
  } catch {
    return null;
  }
}
