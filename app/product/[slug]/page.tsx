import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/product/Gallery";
import BuyBox from "@/components/product/BuyBox";
import Rail from "@/components/product/Rail";
import JsonLd from "@/components/seo/JsonLd";
import { alsoBought, discount, getProduct, products, sameCraft } from "@/lib/products";
import { craftBy } from "@/lib/crafts";
import { breadcrumbLd, faqLd, graph, pageMeta, productLd } from "@/lib/seo";
import { inr, unitLabel } from "@/lib/site";

type Params = Promise<{ slug: string }>;

/** Every product is a static page at build time; new stock triggers a rebuild. */
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return { title: "Not found", robots: { index: false, follow: false } };

  const off = discount(p);
  const craft = craftBy[p.craft]?.name ?? "";
  const description = p.cut
    ? `${p.name}. ${inr(p.price)} a metre${off ? `, down from ${inr(p.mrp)}` : ""} — 42 inches wide, 100 g per metre, cut to any length from one metre. Posted from Jhotwara, Jaipur.`
    : `${p.name}. ${inr(p.price)} ${unitLabel(p.unit)}${off ? `, down from ${inr(p.mrp)}` : ""}. ${craft} made in ${craftBy[p.craft]?.lane}, Jaipur.`;

  return pageMeta({
    title: p.name,
    description,
    path: `/product/${p.slug}`,
    image: p.images[0].src,
    imageAlt: p.name,
    type: "article",
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();

  const craft = craftBy[p.craft];
  const related = sameCraft(p, 8);
  const also = alsoBought(p, 10).filter((x) => !related.some((r) => r.slug === x.slug)).slice(0, 8);

  return (
    <main id="main">
      <nav className="st-crumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/shop">Shop</Link><span aria-hidden="true">/</span>
        <Link href={`/shop?craft=${p.craft}`}>{craft?.name}</Link><span aria-hidden="true">/</span>
        <b>{p.short}</b>
      </nav>

      <section className="st-wrap">
        <div className="st-pd">
          <Gallery p={p} />
          <div>
            <p className="st-pd__kind">
              <Link href={`/shop?craft=${p.craft}`}>{craft?.name}</Link>
              {p.kind === "fabric" ? " · Hand block printed" : ` · ${craft?.lane}`}
            </p>
            <h1 className="st-pd__name">{p.name}</h1>
            {p.hindi && <p className="st-pd__hi st-dv">{p.hindi}</p>}
            <BuyBox p={p} />
          </div>
        </div>
      </section>

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

      {related.length > 0 && (
        <Rail eyebrow={p.kind === "fabric" ? "The same cotton, another base" : `More from ${craft?.lane}`}
          heading={p.kind === "fabric" ? "More by the metre." : `More ${craft?.name.toLowerCase()}.`}
          items={related} />
      )}
      {also.length > 0 && (
        <Rail eyebrow="Went out in the same parcel" heading="People also bought." items={also} />
      )}

      <JsonLd data={graph([
        productLd(p),
        breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: craft?.name ?? "Craft", path: `/shop?craft=${p.craft}` },
          { name: p.short, path: `/product/${p.slug}` },
        ]),
        faqLd(),
      ])} />
    </main>
  );
}
