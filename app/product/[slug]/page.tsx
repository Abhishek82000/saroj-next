import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView from "@/components/product/ProductView";
import { getProductDetail } from "@/lib/product-api";
import { productMeta } from "@/lib/product-page";

type Params = Promise<{ slug: string }>;

/**
 * Every product comes from the Laravel API — nothing is prerendered at build;
 * each page renders on first visit and is cached for five minutes.
 */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return productMeta(slug, false);
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  // strict: only the API's own 404 means "not found"; a rate-limited / down
  // API errors instead (keeping the last good cached page) rather than
  // rendering a cacheable 404.
  const detail = await getProductDetail(slug, { strict: true });
  if (!detail) notFound();
  return <ProductView p={detail.product} detail={detail} />;
}
