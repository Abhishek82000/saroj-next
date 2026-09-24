import Link from "next/link";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import Rail from "@/components/product/Rail";
import BannerSlider from "@/components/home/BannerSlider";
import BoltFan from "@/components/wholesale/BoltFan";
import Voices from "@/components/home/Voices";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbLd, graph } from "@/lib/seo";
import { site } from "@/lib/site";
import { WHOLESALE_HOME, WHOLESALE_MIN_METRES } from "@/lib/wholesale";
import type { WholesaleCollection, WholesalePage } from "@/lib/wholesalePage";

const shop = (slug: string) => `${WHOLESALE_HOME}/shop/${slug}`;

const TERMS: [string, string][] = [
  [`${WHOLESALE_MIN_METRES} m`, "Minimum order, any print"],
  ["Cut to length", "Mixed prints allowed"],
  ["GST invoice", "Trade rates, GST extra"],
  ["Jaipur", "Dispatched from the source"],
];

function Feature({ c, i }: { c: WholesaleCollection; i: number }) {
  return (
    <Reveal as="div" delay={((i % 3) + 1) as 1 | 2 | 3} className="st-whf">
      <Link href={shop(c.slug)} className="st-whf__link">
        <div className="st-whf__ph ph"><Photo src={c.banner} alt={c.heading} sizes="(min-width:900px) 50vw, 100vw" /></div>
        <div className="st-whf__body">
          <h3>{c.heading}</h3>
          {c.blurb && <p>{c.blurb}</p>}
          <span className="st-whf__more">Shop wholesale &rarr;</span>
        </div>
      </Link>
    </Reveal>
  );
}

/**
 * The wholesale front page. Its own layout — trade terms, featured collections,
 * every category, a rail per category, buyers' words and an enquiry line —
 * built entirely from GET /api/wholesale-page-data (see getWholesalePage).
 */
export default function WholesaleHome({ page }: { page: WholesalePage }) {
  return (
    <main id="main" className="st-whome">
      {page.slides.length > 0 && <BannerSlider slides={page.slides} label="Wholesale offers" />}

      {page.collections.length > 0 && (
        <section className="st-sec" style={{ paddingBlock: "clamp(28px,5vw,54px)" }}>
          <div className="st-wrap st-openbolt__head">
            <div>
              <Reveal className="st-eyebrow">The collections</Reveal>
              <Reveal as="h2" delay={1} className="st-h2">Open a <em>bolt.</em></Reveal>
            </div>
            <Reveal as="p" delay={2} className="st-lede">
              {page.collections.length} collections, each from its own region. Hover to unfold one.
            </Reveal>
          </div>
          <div className="st-wrap">
            <BoltFan collections={page.collections} />
          </div>
        </section>
      )}

      {page.categories.length > 0 && (
        <section className="st-sec" style={{ paddingBlock: "clamp(28px,5vw,54px)" }}>
          <div className="st-wrap">
            <Reveal className="st-eyebrow">Every category</Reveal>
            <Reveal as="h2" delay={1} className="st-h2">Shop by fabric.</Reveal>
            <div className="st-whcats">
              {page.categories.map((c) => (
                <Link key={c.id} href={shop(c.slug)} className="st-whcat">
                  <span className="st-whcat__ph ph"><Photo src={c.image} alt={c.name} sizes="160px" /></span>
                  <span className="st-whcat__name">{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {page.rails.map((r) => (
        <Rail key={r.id} id={r.slug} eyebrow="Wholesale" heading={r.name} items={r.items} />
      ))}

      {page.more.length > 0 && (
        <section className="st-sec" style={{ paddingBlock: "clamp(28px,5vw,54px)" }}>
          <div className="st-wrap">
            <Reveal className="st-eyebrow">Also in the book</Reveal>
            <Reveal as="h2" delay={1} className="st-h2">More to explore.</Reveal>
            <div className="st-whf__grid">{page.more.map((c, i) => <Feature key={c.id} c={c} i={i} />)}</div>
          </div>
        </section>
      )}

      <Voices />

      <section className="st-sec st-whcta">
        <div className="st-wrap st-whcta__box">
          <div>
            <h2 className="st-h2">Planning a larger order?</h2>
            <p>Tell us the prints and metres and we&rsquo;ll send trade rates the same day.</p>
          </div>
          <div className="st-whcta__btns">
            <a href={`https://wa.me/${site.whatsapp}`} className="st-btn st-btn--light">WhatsApp the counter</a>
            <Link href="/contact" className="st-btn st-btn--light">Contact us</Link>
          </div>
        </div>
      </section>

      <JsonLd data={graph([breadcrumbLd([{ name: "Home", path: "/" }, { name: "Wholesale", path: WHOLESALE_HOME }])])} />
    </main>
  );
}
