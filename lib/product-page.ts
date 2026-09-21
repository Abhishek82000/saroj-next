import type { Metadata } from "next";
import { getProductDetail, productHref } from "./product-api";
import { getProduct, discount } from "./products";
import { craftBy } from "./crafts";
import { pageMeta } from "./seo";
import { inr, unitLabel } from "./site";
import type { Product, ProductDetail } from "./types";

/** API first, static catalogue second — used by both product routes. */
export async function resolveProduct(
  slug: string,
  wholesale = false,
): Promise<{ product: Product; detail?: ProductDetail }> {
  const detail = await getProductDetail(slug, { wholesale });
  if (detail) return { product: detail.product, detail };
  const local = getProduct(slug);
  return local ? { product: local } : { product: null as unknown as Product };
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
    ? `${p.name}. ${inr(price)} a metre${off ? `, down from ${inr(live?.price.mrp ?? p.mrp)}` : ""} — cut to any length from ${p.cut.min} m. Posted from Jhotwara, Jaipur.`
    : `${p.name}. ${inr(price)} ${unitLabel(p.unit)}${off ? `, down from ${inr(live?.price.mrp ?? p.mrp)}` : ""}. ${craft.name} made in ${craft.lane}, Jaipur.`;

  return pageMeta({
    title: wholesale ? `${p.name} — wholesale` : (live?.meta.title || p.name),
    description: live?.meta.description || composed,
    path: productHref(p.slug, wholesale),
    image: p.images[0].src,
    imageAlt: p.name,
    type: "article",
    // Trade pricing shouldn't compete with the retail page in search results.
    noIndex: wholesale,
  });
}
