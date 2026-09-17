import type { Metadata } from "next";
import ShopListing from "@/components/shop/ShopListing";
import JsonLd from "@/components/seo/JsonLd";
import { getTagProducts, type ProductsApiSort } from "@/lib/home";
import { breadcrumbLd, graph, itemListLd, pageMeta } from "@/lib/seo";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ sort?: string }>;

const SORTS: ProductsApiSort[] = ["best_selling", "new_arrival", "high_low", "low_high"];
const toSort = (v?: string): ProductsApiSort => (SORTS as string[]).includes(v ?? "") ? (v as ProductsApiSort) : "new_arrival";

/** "best-seller" -> "Best Seller", used until the live name loads. */
function titleFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { name } = await getTagProducts(slug);
  const title = name || titleFromSlug(slug);

  return pageMeta({
    title,
    description: `${title} at the Saroj Textile counter in Jaipur — hand block printed cotton and handicraft from six Jaipur lanes.`,
    path: `/shop/tag/${slug}`,
  });
}

/**
 * A single storefront tag, e.g. /shop/tag/best-seller — the page the
 * sidebar's "Tags" links point to. Products come live from
 * GET /api/products?tag=<slug>. Reuses the /shop listing the same way the
 * category page does, craft/material facets hidden.
 */
export default async function TagPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const sort = toSort((await searchParams).sort);
  const { name, products, categories, tags, priceRange, saleProducts } = await getTagProducts(slug, sort);
  const title = name || titleFromSlug(slug);

  return (
    <main id="main">
      <ShopListing
        items={products}
        title={title}
        lede={`Every piece tagged ${title}, cut to any length from one metre.`}
        showCraftFacets={false}
        categories={categories}
        sort={sort}
        tags={tags}
        currentTag={slug}
        priceRange={priceRange}
        saleProducts={saleProducts}
      />

      <JsonLd data={graph([
        breadcrumbLd([{ name: "Home", path: "/" }, { name: title, path: `/shop/tag/${slug}` }]),
        itemListLd(products, `/shop/tag/${slug}`),
      ])} />
    </main>
  );
}
