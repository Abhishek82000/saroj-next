/**
 * The storefront's product search, as the header's search sheet uses it:
 *
 *   GET /api/search?searchstring=<q>&wholesale=<0|1>
 *     → { success, data: [{ name, slug, image, type, url }] }   (at most 20)
 *
 * `wholesale=1` searches the wholesale counter. Name, slug and image are used —
 * the link is built from the slug so it stays inside this site and its mode
 * (the API's `url` points at the old storefront). Called from the browser
 * through the /api/search rewrite in next.config.ts.
 */
export interface SearchHit { name: string; slug: string; image?: string }

export async function searchProducts(q: string, wholesale: boolean, signal?: AbortSignal): Promise<SearchHit[]> {
  const qs = new URLSearchParams({ searchstring: q, wholesale: wholesale ? "1" : "0" });
  try {
    const res = await fetch(`/api/search?${qs}`, { headers: { Accept: "application/json" }, signal });
    if (!res.ok) return [];
    const json = (await res.json()) as { success?: boolean; data?: { name?: string; slug?: string; image?: string | null }[] };
    return (json.data ?? [])
      .filter((h) => h.name && h.slug)
      .map((h) => ({ name: h.name!, slug: h.slug!, image: h.image || undefined }));
  } catch {
    return [];
  }
}
