import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
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
    path: `/category/${slug}`,
  });
}

/**
 * A single storefront category, e.g. /category/ajrakh-collection — the page
 * a category tile on the home page (the Shelf, the nav menu) links to.
 * Products come live from GET /api/products?category=<slug>.
 */
export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { name, products } = await getCategoryProducts(slug);
  const title = name || titleFromSlug(slug);

  return (
    <main id="main">
      <div className="st-plp__head">
        <div className="st-wrap">
          <nav className="st-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span>
            <span>{title}</span>
          </nav>
          <h1>{title}</h1>
          <p>
            Handicraft from six Jaipur lanes and the cotton it sits beside.
            Fabric is priced by the metre, handicraft by the piece.
          </p>
        </div>
      </div>

      <div className="st-wrap">
        <div className="st-bar">
          <p className="st-bar__n"><b>{products.length}</b> {products.length === 1 ? "piece" : "pieces"}</p>
        </div>

        {products.length === 0 ? (
          <div className="st-empty">
            <h2 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "clamp(1.4rem,5vw,1.9rem)", margin: "0 0 .55rem" }}>
              Nothing here yet
            </h2>
            <p>This collection isn’t stocked right now. The rest of the counter is a search away.</p>
            <Link href="/shop" className="st-btn st-btn--solid">See everything on the counter</Link>
          </div>
        ) : (
          <div className="st-grid" data-cols="3">
            {products.map((p, i) => <ProductCard key={p.slug} p={p} priority={i < 4} />)}
          </div>
        )}
      </div>

      <JsonLd data={graph([
        breadcrumbLd([{ name: "Home", path: "/" }, { name: title, path: `/category/${slug}` }]),
        itemListLd(products, `/category/${slug}`),
      ])} />
    </main>
  );
}
