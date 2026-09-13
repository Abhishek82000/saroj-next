import type { Metadata } from "next";
import ShopListing from "@/components/shop/ShopListing";
import JsonLd from "@/components/seo/JsonLd";
import { craftBy } from "@/lib/crafts";
import { products } from "@/lib/products";
import { breadcrumbLd, graph, itemListLd, pageMeta } from "@/lib/seo";

type Search = Promise<{ q?: string; craft?: string }>;

/**
 * The listing is filterable in the browser, but the *entry* URL still gets
 * its own title, description and canonical so a /shop?craft=meena link shared
 * anywhere reads correctly. Filtered views are noindex to avoid facet bloat.
 */
export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { q, craft } = await searchParams;
  const c = craft ? craftBy[craft] : undefined;

  if (q) {
    return pageMeta({
      title: `Search: ${q}`,
      description: `Pieces matching “${q}” at the Saroj Textile counter in Jaipur.`,
      path: `/shop?q=${encodeURIComponent(q)}`,
      noIndex: true,
    });
  }
  if (c) {
    return pageMeta({
      title: `${c.name} from ${c.lane}`,
      description: `${c.name} (${c.hindi}) made in ${c.lane}, Jaipur. ${products.filter((p) => p.craft === craft).length} pieces on the counter, posted from Jhotwara.`,
      path: `/shop?craft=${craft}`,
      image: c.image,
    });
  }
  return pageMeta({
    title: "Shop everything",
    description:
      "Every piece on the Saroj Textile counter — hand block printed cotton by the metre and handicraft from six Jaipur lanes. Filter by craft, material, price and availability.",
    path: "/shop",
  });
}

export default async function ShopPage({ searchParams }: { searchParams: Search }) {
  const { q = "", craft = "" } = await searchParams;
  const c = craft ? craftBy[craft] : undefined;
  const listed = craft ? products.filter((p) => p.craft === craft) : products;

  return (
    <main id="main">
      <ShopListing q={q} craft={craft} />
      <JsonLd data={graph([
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: c ? c.name : "Shop", path: craft ? `/shop?craft=${craft}` : "/shop" },
        ]),
        itemListLd(listed, craft ? `/shop?craft=${craft}` : "/shop"),
      ])} />
    </main>
  );
}
