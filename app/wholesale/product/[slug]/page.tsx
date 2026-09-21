import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView from "@/components/product/ProductView";
import { getProductDetail } from "@/lib/product-api";
import { productMeta } from "@/lib/product-page";

type Params = Promise<{ slug: string }>;

/**
 * Wholesale mirrors the retail page: same components, same layout, different
 * price columns and a minimum order. It is never prerendered — trade pricing
 * moves more often than retail and is gated behind a sign-in anyway.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  return productMeta(slug, true);
}

export default async function WholesaleProductPage({ params }: { params: Params }) {
  const { slug } = await params;

  const detail = await getProductDetail(slug, { wholesale: true });
  if (!detail) notFound();

  return <ProductView p={detail.product} detail={detail} />;
}
