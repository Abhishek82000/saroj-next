import type { Metadata } from "next";
import ShopListing from "@/components/shop/ShopListing";
import JsonLd from "@/components/seo/JsonLd";
import { getProductsPage, type ProductsApiSort } from "@/lib/home";
import { attachWholesale } from "@/lib/wholesalePrices";
import { breadcrumbLd, graph, itemListLd, pageMeta } from "@/lib/seo";

type Search = Promise<{ q?: string; sort?: string }>;

const SORTS: ProductsApiSort[] = ["best_selling", "new_arrival", "high_low", "low_high"];
const toSort = (v?: string): ProductsApiSort => (SORTS as string[]).includes(v ?? "") ? (v as ProductsApiSort) : "new_arrival";

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { q } = await searchParams;
  if (q) {
    return pageMeta({
      title: `Search: ${q}`,
      description: `Pieces matching “${q}” at the Saroj Textile counter in Jaipur.`,
      path: `/shop?q=${encodeURIComponent(q)}`,
      noIndex: true,
    });
  }
  return pageMeta({
    title: "Shop everything",
    description:
      "Every piece on the Saroj Textile counter — hand block printed cotton by the metre and handicraft from Jaipur. Filter by category, price and availability.",
    path: "/shop",
  });
}

/**
 * /shop — every product on the counter, live from GET /api/products, with the
 * same sidebar and sort as a category. The API pages at 24 and rate-limits
 * bursts, so the server sends page one and the listing fetches the rest as
 * the visitor scrolls. `?q=` narrows by name (the nav's non-category entries).
 */
export default function ShopPage({ searchParams }: { searchParams: Search }) {
  return ShopView({ searchParams });
}

/** The shop body, shared with /wholesale-fabric/shop. Wholesale prices its first
    page here, so pieces without a wholesale price are hidden from the start
    rather than flashing up and vanishing. */
export async function ShopView({ searchParams, wholesale }: { searchParams: Search; wholesale?: boolean }) {
  const { q = "", sort: rawSort } = await searchParams;
  const sort = toSort(rawSort);
  const page = await getProductsPage(sort);
  const { categories, tags, priceRange, saleProducts, lastPage, total } = page;
  const products = wholesale ? await attachWholesale(page.products) : page.products;

  return (
    <main id="main">
      <ShopListing
        q={q}
        items={products}
        lede="Hand block printed cotton by the metre and handicraft from Jaipur — everything on the counter."
        categories={categories}
        sort={sort}
        tags={tags}
        priceRange={priceRange}
        saleProducts={saleProducts}
        paging={{ lastPage, total }}
      />
      <JsonLd data={graph([
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }]),
        itemListLd(products, "/shop"),
      ])} />
    </main>
  );
}
