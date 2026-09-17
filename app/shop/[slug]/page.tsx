import type { Metadata } from "next";
import ShopListing from "@/components/shop/ShopListing";
import JsonLd from "@/components/seo/JsonLd";
import { getCategoryProducts } from "@/lib/home";
import { breadcrumbLd, graph, itemListLd, pageMeta } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

/** "ajrakh-collection" -> "Ajrakh Collection", used until the live name loads. */
function titleFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { name } = await getCategoryProducts(slug);
  const title = name || titleFromSlug(slug);

  return pageMeta({
    title,
    description: `${title} at the Saroj Textile counter in Jaipur — hand block printed cotton and handicraft from six Jaipur lanes.`,
    path: `/shop/${slug}`,
  });
}

/**
 * A single storefront category, e.g. /shop/ajrakh-collection — the page
 * a category tile on the home page (the Shelf, the nav menu) links to.
 * Products come live from GET /api/products?category=<slug>. Reuses the
 * /shop listing (filters, sort, density, paging) with the craft/material
 * facets hidden — a single category has no crafts to narrow by.
 */
export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { name, products } = await getCategoryProducts(slug);
  const title = name || titleFromSlug(slug);

  return (
    <main id="main">
      <ShopListing
        items={products}
        title={title}
        lede={`Every piece in the ${title} collection, cut to any length from one metre.`}
        showCraftFacets={false}
      />

      <JsonLd data={graph([
        breadcrumbLd([{ name: "Home", path: "/" }, { name: title, path: `/shop/${slug}` }]),
        itemListLd(products, `/shop/${slug}`),
      ])} />
    </main>
  );
}
