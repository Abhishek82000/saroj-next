import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import JsonLd from "@/components/seo/JsonLd";
import { getFaqs } from "@/lib/faqs";
import { site } from "@/lib/site";
import { breadcrumbLd, faqLd, graph, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "FAQs",
  description: `Shipping, orders, returns and payments at ${site.name} — answered.`,
  path: "/faq",
});

/**
 * /faq — the footer's "FAQs" link. Questions come live from GET /api/faqs;
 * each answer is the storefront's own rich-text HTML, rendered in an
 * accordion. The FAQPage JSON-LD is built from the same live list, so
 * search engines see exactly what's on the page.
 */
export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <main id="main">
      <div className="st-plp__head">
        <div className="st-wrap">
          <nav className="st-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><span>FAQs</span>
          </nav>
          <span className="st-eyebrow" style={{ marginTop: ".9rem" }}>Good to know</span>
          <h1>Frequently asked questions</h1>
          <p>Shipping, orders, returns and payments — answered. Still stuck? The counter's a WhatsApp away.</p>
        </div>
      </div>

      <div className="st-wrap">
        <div className="st-static__grid">
          {faqs.length === 0 ? (
            <div className="st-empty">
              <h2 style={{ fontFamily: "var(--d)", fontWeight: 400, fontSize: "clamp(1.4rem,5vw,1.9rem)", margin: "0 0 .55rem" }}>
                Nothing here yet
              </h2>
              <p>Check back soon, or ask us directly.</p>
            </div>
          ) : (
            <div className="st-static__card">
              <div className="st-faq">
                {faqs.map((f) => (
                  <details key={f.id}>
                    <summary>{f.question}</summary>
                    <div className="st-faq__body" dangerouslySetInnerHTML={{ __html: f.html }} />
                  </details>
                ))}
              </div>
            </div>
          )}

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
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "FAQs", path: "/faq" }]),
        faqLd(faqs.map((f) => [f.question, f.text] as [string, string])),
      ])} />
    </main>
  );
}
