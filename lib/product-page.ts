import type { Metadata } from "next";
import { getProductDetail, productHref } from "./product-api";
import { discount } from "./price";
import { craftBy } from "./crafts";
import { pageMeta } from "./seo";
import { inr, unitLabel } from "./site";
import type { Product, ProductDetail } from "./types";

/** The product from the API — used by both product routes. */
export async function resolveProduct(
  slug: string,
  wholesale = false,
): Promise<{ product: Product; detail?: ProductDetail }> {
  const detail = await getProductDetail(slug, { wholesale, strict: true });
  return detail ? { product: detail.product, detail } : { product: null as unknown as Product };
}

/**
 * One metadata builder for both routes. CMS meta wins when the merchandiser
 * has written it; otherwise we compose something specific from the price and
 * the cut, which reads better in a SERP than a generic category line.
 */
export async function productMeta(slug: string, wholesale: boolean): Promise<Metadata> {
  const { product: p, detail } = await resolveProduct(slug, wholesale);
  if (!p) return { title: "Not found", robots: { index: false, follow: false } };

  const live = detail?.live;
  const craft = craftBy[p.craft] ?? craftBy.fabric;
  const off = live?.price.discount ?? discount(p);
  const price = live?.price.selling ?? p.price;

  const composed = p.cut
    ? `${p.name}. ${inr(price)} a meter${off ? `, down from ${inr(live?.price.mrp ?? p.mrp)}` : ""} — cut to any length from ${p.cut.min} m. Posted from Jaipur.`
    : `${p.name}. ${inr(price)} ${unitLabel(p.unit)}${off ? `, down from ${inr(live?.price.mrp ?? p.mrp)}` : ""}. ${craft.name} made in ${craft.lane}, Jaipur.`;

  /* product_meta_title / product_meta_desc / product_meta_keyword. The API falls
     back to the product name for an empty meta title, so only a title that
     differs from the name counts as typed in the admin (shown as-is). */
  const adminTitle = live?.meta.title?.trim() && live.meta.title.trim() !== p.name.trim() ? live.meta.title.trim() : "";
  const baseTitle = adminTitle || p.name;

  return pageMeta({
    /* The wholesale page keeps a suffix so it never shares the retail page's title. */
    title: wholesale ? `${baseTitle} — wholesale` : baseTitle,
    absoluteTitle: !!adminTitle,
    description: live?.meta.description?.trim() || composed,
    keywords: live?.meta.keywords?.trim() || undefined,
    path: productHref(p.slug, wholesale),
    image: p.images[0].src,
    imageAlt: p.name,
    type: "article",
    // Wholesale pages are indexed too (they're listed in /sitemap.xml); each
    // page's canonical points at itself, retail or wholesale.
  });
}
