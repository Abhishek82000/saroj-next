import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/ui/Icon";
import JsonLd from "@/components/seo/JsonLd";
import { getStaticPage } from "@/lib/pages";
import { site } from "@/lib/site";
import { breadcrumbLd, graph, pageMeta } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getStaticPage(slug);
  if (!page) return {};

  return pageMeta({
    title: page.name,
    description: `${page.name} — ${site.name}, ${site.address.city}.`,
    path: `/${slug}`,
  });
}

/**
 * Any static content page the storefront edits itself — Privacy Policy,
 * Terms, Return Policy — e.g. /privacy-policy. This app supplies the shell
 * (nav, breadcrumb, footer); GET /api/page-data/<slug> supplies the title
 * and the page's own rich-text HTML for everything in between. 404s when
 * the slug isn't a real page there, so this never swallows a typo'd route.
 */
export default async function StaticPage({ params }: { params: Params }) {
  const { slug } = await params;
  const page = await getStaticPage(slug);
  if (!page) notFound();

  return (
    <main id="main">
      <div className="st-plp__head">
        <div className="st-wrap">
          <nav className="st-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span>
            <span>{page.name}</span>
          </nav>
          <span className="st-eyebrow" style={{ marginTop: ".9rem" }}>Good to know</span>
          <h1>{page.name}</h1>
        </div>
      </div>

      <div className="st-wrap">
        <div className="st-static__grid">
          {/* The storefront's own editor output — sanitised on their end, not ours. */}
          <article className="st-richtext st-static__card" dangerouslySetInnerHTML={{ __html: page.html }} />

          <aside className="st-static__help">
            <Icon name="help" size={22} strokeWidth={1.6} />
            <h2>Still have a question?</h2>
            <p>Someone at the Jhotwara counter reads every message — usually answered the same day.</p>
            <a className="st-btn st-btn--solid" href={`https://wa.me/${site.whatsapp}`}>
              <Icon name="whatsapp" size={15} fill="currentColor" />WhatsApp us
            </a>
            <a className="st-static__tel" href={`tel:${site.phoneRaw}`}>{site.phone}</a>
          </aside>
        </div>
      </div>

      <JsonLd data={graph([
        breadcrumbLd([{ name: "Home", path: "/" }, { name: page.name, path: `/${slug}` }]),
      ])} />
    </main>
  );
}
