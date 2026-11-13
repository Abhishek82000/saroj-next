import type { Metadata } from "next";
import ShopListing from "@/components/shop/ShopListing";
import ListingSections from "@/components/shop/ListingSections";
import SubcategoryGrid from "@/components/shop/SubcategoryGrid";
import JsonLd from "@/components/seo/JsonLd";
import { attachWholesale } from "@/lib/wholesalePrices";
import { WHOLESALE_SECTION } from "@/lib/wholesale";
import { getCategoryProducts, getHomeData, getTagProducts, shuffled, type ProductsApiSort } from "@/lib/home";
import { breadcrumbLd, graph, itemListLd, pageMeta } from "@/lib/seo";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ sort?: string }>;

const SORTS: ProductsApiSort[] = ["best_selling", "new_arrival", "high_low", "low_high"];
const toSort = (v?: string): ProductsApiSort => (SORTS as string[]).includes(v ?? "") ? (v as ProductsApiSort) : "new_arrival";

/** "ajrakh-collection" -> "Ajrakh Collection", used until the live name loads. */
function titleFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** /shop/<slug> is a category — or, when no category has that slug, a tag
    (/shop/best-seller), so tag pages live at the same short address. */
async function resolveListing(slug: string, sort?: ProductsApiSort) {
  const category = await getCategoryProducts(slug, sort);
  if (category.name) return { ...category, tag: false };
  const tag = await getTagProducts(slug, sort);
  return tag.name ? { ...tag, tag: true } : { ...category, tag: false };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { name, meta } = await resolveListing(slug);
  const title = name || titleFromSlug(slug);

  /* The admin's cat_meta_* fields when set; the composed defaults otherwise. */
  return pageMeta({
    title: meta?.title || title,
    description: meta?.description
      || `${title} at the Saroj Textile counter in Jaipur — hand block printed cotton and handicraft from six Jaipur lanes.`,
    keywords: meta?.keywords || undefined,
    image: meta?.image || undefined,
    imageAlt: title,
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
export async function CategoryView({ params, searchParams, wholesale }: { params: Params; searchParams: SearchParams; wholesale?: boolean }) {
  const { slug } = await params;
  const sort = toSort((await searchParams).sort);
  const listing = await resolveListing(slug, sort);
  const { name, categories, tags, priceRange, saleProducts, fabricCategories } = listing;
  const subcategories = listing.subcategories ?? [];
  /* A parent category (e.g. Tote Bags) opens on its subcategories, not a product list. */
  if (!listing.tag && subcategories.length > 0) {
    const title = name || titleFromSlug(slug);
    const base = wholesale ? WHOLESALE_SECTION : "/shop";
    return (
      <main id="main">
        <SubcategoryGrid title={title} lede={listing.shortDesc} subcategories={subcategories} wholesale={wholesale} />
        <JsonLd data={graph([
          breadcrumbLd([{ name: "Home", path: "/" }, { name: title, path: `${base}/${slug}` }]),
        ])} />
      </main>
    );
  }
  /* Wholesale pages carry each piece's wholesale rate (product_wh_* columns, via the cards API). */
  /* Shuffled here, per request, for the default order: the HTML arrives in its final order. */
  const listed = shuffled(listing.products, sort === "new_arrival");
  const products = wholesale ? await attachWholesale(listed) : listed;
  /* /api/products' `handcategories` has no cat_handi_type, which the rail's lanes need. */
  const { handicraftCats } = await getHomeData();
  const title = name || titleFromSlug(slug);

  return (
    <main id="main">
      <ShopListing
        items={products}
        title={title}
        lede={listing.tag ? undefined : listing.shortDesc}
        categories={categories}
        currentSlug={listing.tag ? undefined : slug}
        currentTag={listing.tag ? slug : undefined}
        sort={sort}
        tags={tags}
        priceRange={priceRange}
        saleProducts={saleProducts}
        after={<ListingSections fabricCategories={fabricCategories} handicraftCats={handicraftCats} />}
      />

      <JsonLd data={graph([
        breadcrumbLd([{ name: "Home", path: "/" }, { name: title, path: `/shop/${slug}` }]),
        itemListLd(products, `/shop/${slug}`),
      ])} />
    </main>
  );
}

export default function CategoryPage(props: { params: Params; searchParams: SearchParams }) {
  return CategoryView(props);
}
