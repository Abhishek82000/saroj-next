import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Photo from "@/components/ui/Photo";
import Rail from "@/components/product/Rail";
import JsonLd from "@/components/seo/JsonLd";
import WholesaleActions from "@/components/wholesale/WholesaleActions";
import WholesaleHero from "@/components/wholesale/WholesaleHero";
import { getFeaturedCategories } from "@/lib/nav";
import { getWholesalePage, type WholesaleCollection } from "@/lib/wholesalePage";
import { WHOLESALE_HOME, WHOLESALE_MIN_METRES } from "@/lib/wholesale";
import { site } from "@/lib/site";
import { breadcrumbLd, graph, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Wholesale fabric",
  description: `Wholesale fabric from ${site.name}, Jaipur — cut to your lengths from ${WHOLESALE_MIN_METRES} m, at trade rates.`,
  path: WHOLESALE_HOME,
});

const rules = [
  { icon: "ruler", title: `${WHOLESALE_MIN_METRES} m minimum`,
    copy: `Wholesale fabric starts at ${WHOLESALE_MIN_METRES} metres, cut to any length in half-metre steps.` },
  { icon: "lock", title: "Log in with an OTP",
    copy: "Trade prices are open to browse. To add to the cart you log in with your mobile number and a one-time code." },
  { icon: "shield", title: "Lowest price, GST extra",
    copy: "Every wholesale price is quoted before GST, which is added to your invoice." },
];

const shopHref = (slug: string) => `${WHOLESALE_HOME}/shop/${slug}`;

function Collections({ items }: { items: WholesaleCollection[] }) {
  return (
    <div className="st-wh__collections">
      {items.map((c) => (
        <Link key={c.id} href={shopHref(c.slug)} className="st-post">
          <div className="st-post__ph ph"><Photo src={c.banner} alt={c.name} sizes="(max-width:640px) 100vw, 320px" /></div>
          <div className="st-post__body">
            <h3>{c.heading}</h3>
            {c.blurb && <p className="st-post__excerpt">{c.blurb}</p>}
            <span className="st-post__more">Shop {c.name} <Icon name="right" size={12} strokeWidth={2} /></span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/**
 * /wholesale-fabric — where "Wholesale @80" in the header and footer lands, and
 * the front door to the wholesale section: every page under it is the ordinary
 * page's URL with this prefix, priced at trade rates. The page is built from
 * GET /api/wholesale-page-data (banners, highlighted collections, categories,
 * product rails, testimonials) around a short explainer of how wholesale works.
 */
export default async function WholesalePage() {
  const page = await getWholesalePage();
  /* If that feed is down, the explainer still stands and the homepage's featured categories stand in. */
  const categories = page?.categories.length
    ? page.categories
    : (await getFeaturedCategories()).map((c) => ({ id: c.id, name: c.name, slug: c.slug, image: c.image }));

  return (
    <main id="main">
      {page && page.slides.length > 0 && <WholesaleHero slides={page.slides} />}

      {/* <div className="st-plp__head">
        <div className="st-wrap">
          <nav className="st-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><span>Wholesale</span>
          </nav>
          <span className="st-eyebrow" style={{ marginTop: ".9rem" }}>For traders and tailors</span>
          <h1>Wholesale fabric</h1>
          <p>Hand block printed cotton cut to your lengths, at trade rates — from {site.ticker[2][1]}, {WHOLESALE_MIN_METRES} metres and up.</p>
        </div>
      </div>

      <div className="st-wrap">
        <div className="st-wh__rules">
          {rules.map((r) => (
            <div className="st-contact__card" key={r.title}>
              <Icon name={r.icon} size={20} strokeWidth={1.6} />
              <div><b>{r.title}</b><p>{r.copy}</p></div>
            </div>
          ))}
        </div>
        <WholesaleActions />
      </div> */}

      {page && page.collections.length > 0 && (
        <section className="st-wh__sec">
          <div className="st-wrap">
            <span className="st-eyebrow">Wholesale collections</span>
            <h2 className="st-wh__h2">Start with the prints people reorder.</h2>
            <Collections items={page.collections} />
          </div>
        </section>
      )}

      {page?.rails.map((r) => (
        <Rail key={r.id} id={r.slug} eyebrow="Wholesale · from 10 m" heading={r.name} items={r.items} />
      ))}

      {page && page.more.length > 0 && (
        <section className="st-wh__sec">
          <div className="st-wrap">
            <span className="st-eyebrow">More from the loom</span>
            <Collections items={page.more} />
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="st-wh__sec">
          <div className="st-wrap">
            <span className="st-eyebrow">Shop wholesale by category</span>
            <div className="st-wh__tiles">
              {categories.map((c) => (
                <Link key={c.id} href={shopHref(c.slug)} className="st-wh__tile">
                  <span className="st-wh__tile-ph ph"><Photo src={c.image} alt={c.name} sizes="(max-width:640px) 45vw, 240px" /></span>
                  <b>{c.name}</b>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {page && page.testimonials.length > 0 && (
        <section className="st-wh__sec">
          <div className="st-wrap">
            <span className="st-eyebrow">Kind words</span>
            <h2 className="st-wh__h2">What buyers say.</h2>
            <div className="st-wh__quotes">
              {page.testimonials.map((t) => (
                <figure key={t.id} className="st-wh__quote">
                  <span className="st-wh__stars" role="img" aria-label={`${t.rating} out of 5`}>
                    {"★".repeat(t.rating)}<i>{"★".repeat(Math.max(0, 5 - t.rating))}</i>
                  </span>
                  <blockquote>{t.quote}</blockquote>
                  <figcaption>{t.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <JsonLd data={graph([breadcrumbLd([{ name: "Home", path: "/" }, { name: "Wholesale", path: WHOLESALE_HOME }])])} />
    </main>
  );
}
