import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView from "@/components/product/ProductView";
import { getProductDetail } from "@/lib/product-api";
import { productMeta } from "@/lib/product-page";

type Params = Promise<{ slug: string }>;

/**
 * /wholesale/product/<slug> — the same page in wholesale mode (the live
 * storefront's address for it).
 *
 * The shared body lives in components/product/ProductView, NOT in the retail
 * page.tsx. A route file can only export `default` plus Next's own config
 * names (generateMetadata, generateStaticParams, dynamic, revalidate…), so it
 * can never be imported from as a module of components.
 *
 * Never prerendered: trade pricing moves more often than retail, and it sits
 * behind a sign-in anyway.
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
