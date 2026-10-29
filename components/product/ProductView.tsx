import Gallery from "./Gallery";
import BuyBox from "./BuyBox";
import Rail from "./Rail";
import ProductTabs from "./ProductTabs";
import RecentlyViewed from "./RecentlyViewed";
import HandicraftHouse from "./HandicraftHouse";
import JsonLd from "@/components/seo/JsonLd";
import { productHref, WHOLESALE_BASE } from "@/lib/product-api";
import { breadcrumbLd, faqLd, graph, productLd } from "@/lib/seo";
import type { Product, ProductDetail } from "@/lib/types";

/**
 * The product page body, shared by the retail and wholesale routes so the two
 * never drift. Every section the Blade renders has a home here: gallery, buy
 * box, spec strip, related, category rails, recently viewed.
 */
export default function ProductView({
  p, detail, related,
}: { p: Product; detail?: ProductDetail; related?: Product[] }) {
  const wholesale = detail?.mode === "wholesale";
  const rails = detail?.categoryRails ?? [];
  const also = detail?.related ?? related ?? [];

  return (
    <main id="main">
      {/* Full width: .st-pd pads itself to the page edge, like every other section. */}
      <section>
        <div className="st-pd">
          <Gallery p={p} />
          <div>
            <h1 className="st-pd__name">{p.name}</h1>
            {p.hindi && <p className="st-pd__hi st-dv">{p.hindi}</p>}
            {detail && detail.reviews.total > 0 && (
              <a href="#reviews" className="st-pd__rating">
                <b>{detail.reviews.average.toFixed(1)}</b> ★
                <span>{detail.reviews.total} review{detail.reviews.total === 1 ? "" : "s"}</span>
              </a>
            )}
            <BuyBox p={p} detail={detail} />
          </div>
        </div>  
      </section>

      <ProductTabs p={p} reviews={detail?.reviews} />

      {p.specs && (
        <section className="st-spec">
          <div className="st-wrap">
            <div className="st-spec__grid">
              {p.specs.map((s) => (
                <div className="st-spec__i" key={s.label}>
                  <small>{s.label}</small><b>{s.value}</b><span>{s.note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {also.length > 0 && (
        <Rail
          eyebrow={p.kind === "fabric" ? "The same cotton, another base" : "More from Jaipur"}
          heading="People also bought."
          items={also}
        />
      )}
      <RecentlyViewed slug={p.slug} productId={detail?.live.id} wholesale={wholesale} />
      {rails.map((rail) => (
        <Rail key={rail.id} eyebrow="From the counter" heading={`${rail.name}.`} items={rail.products} />
      ))}

      {detail && <HandicraftHouse categories={detail.handicraftCategories} />}

      <JsonLd data={graph([
        productLd(p),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: wholesale ? "Wholesale" : "Shop", path: wholesale ? WHOLESALE_BASE : "/shop" },
          { name: p.short, path: productHref(p.slug, wholesale) },
        ]),
        faqLd(),
      ])} />
    </main>
  );
}
