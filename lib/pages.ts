import { site } from "./site";
import type { PageDataApiResponse } from "./types";
import { fixImages } from "./img";
import { adminMeta, type AdminMeta } from "./page-meta";

export interface StaticPage {
  name: string;
  /** Raw HTML from the storefront's own editor — rendered as-is in the middle of the page. */
  html: string;
  /** page_meta_title / page_meta_desc / page_meta_keyword / page_header_image from the admin. */
  meta: AdminMeta;
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
    const res = await fetch(`${site.api}/api/page-data/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json: PageDataApiResponse = fixImages(await res.json());
    // A page can 200 with a name but no body (e.g. Contact, which this app
    // renders with its own dedicated route instead) — nothing to show here.
    if (json.status !== "success" || !json.data || !json.data.page_content) return null;
    const d = json.data;
    const img = d.page_header_image?.trim();
    const image = !img ? null
      : /^https?:\/\//.test(img) ? img
      : json.imgUrl ? `${json.imgUrl.replace(/\/$/, "")}/${img.replace(/^\//, "")}` : null;
    return {
      name: d.page_name,
      html: d.page_content!,
      meta: adminMeta(d.page_meta_title, d.page_meta_desc, d.page_meta_keyword, image),
    };
  } catch {
    return null;
  }
}
