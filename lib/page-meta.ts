import type { Metadata } from "next";
import { pageMeta } from "./seo";
import { site } from "./site";

/** Meta fields typed in the admin. Empty strings when unset. */
export interface AdminMeta {
  title: string;
  description: string;
  keywords: string;
  image?: string;
}

type PageMetaOpts = Parameters<typeof pageMeta>[0];

/** Editor text → one clean line for a meta tag. */
const clean = (s: string | null | undefined) =>
  (s ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();

export const adminMeta = (title?: string | null, description?: string | null, keywords?: string | null, image?: string | null): AdminMeta => ({
  title: clean(title),
  description: clean(description),
  keywords: clean(keywords),
  image: image || undefined,
});

/**
 * The page's own defaults, overridden field by field by whatever the admin
 * filled in. An admin title is used exactly as typed (no brand suffix added).
 */
export function withAdminMeta(defaults: PageMetaOpts, admin: AdminMeta | null): Metadata {
  if (!admin) return pageMeta(defaults);
  return pageMeta({
    ...defaults,
    title: admin.title || defaults.title,
    absoluteTitle: !!admin.title || defaults.absoluteTitle,
    description: admin.description || defaults.description,
    keywords: admin.keywords || defaults.keywords,
    image: admin.image || defaults.image,
  });
}

/**
 * A fixed page's meta from GET /api/meta-data/<page_url> (the ar_pages row:
 * page_meta_title, page_meta_desc, page_meta_keyword, page_header_image).
 * Null when the admin has no row for it — the API then answers with a generic
 * default, which is ignored here so the page keeps its own text.
 */
export async function getAdminPageMeta(slug: string): Promise<AdminMeta | null> {
  try {
    const res = await fetch(`${site.api}/api/meta-data/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json() as {
      metaData?: { page_url?: string | null; page_meta_title?: string | null; page_meta_desc?: string | null;
        page_meta_keyword?: string | null; page_header_image?: string | null };
      page_image_path?: string | null;
    };
    const m = json.metaData;
    if (!m?.page_url) return null;
    return adminMeta(m.page_meta_title, m.page_meta_desc, m.page_meta_keyword, headerImage(m.page_header_image, json.page_image_path));
  } catch {
    return null;
  }
}

/** The home page's meta: GET /api/home → data.meta (the ar_pages row with no page_url). */
export async function getHomeMeta(): Promise<AdminMeta | null> {
  try {
    const res = await fetch(`${site.api}/api/home`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const json = await res.json() as { data?: { meta?: { meta_title?: string; meta_keyword?: string; meta_description?: string } } };
    const m = json.data?.meta;
    return m ? adminMeta(m.meta_title, m.meta_description, m.meta_keyword) : null;
  } catch {
    return null;
  }
}

/** page_header_image may be a full URL or a file name under page_image_path. */
function headerImage(file?: string | null, base?: string | null): string | undefined {
  const f = (file ?? "").trim();
  if (!f) return undefined;
  if (/^https?:\/\//.test(f)) return f;
  return base ? `${base.replace(/\/$/, "")}/${f.replace(/^\//, "")}` : undefined;
}
