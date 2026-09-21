import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView from "@/components/product/ProductView";
import { getProductDetail } from "@/lib/product-api";
import { alsoBought, getProduct, products, sameCraft } from "@/lib/products";
import { productMeta } from "@/lib/product-page";

type Params = Promise<{ slug: string }>;

/**
 * The static catalogue is prerendered; everything else on the live storefront
 * renders on demand from the Laravel API and is cached for five minutes.
 */
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return productMeta(slug, false);
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;

  const detail = await getProductDetail(slug);
  if (detail) return <ProductView p={detail.product} detail={detail} />;

  // Fall back to the static catalogue when the API has nothing — the
  // marketing pages link to pieces that never existed as CMS rows.
  const local = getProduct(slug);
  if (!local) notFound();

  const related = sameCraft(local, 8);
  const also = alsoBought(local, 10).filter((x) => !related.some((r) => r.slug === x.slug)).slice(0, 8);
  return <ProductView p={local} related={[...related, ...also].slice(0, 10)} />;
}
