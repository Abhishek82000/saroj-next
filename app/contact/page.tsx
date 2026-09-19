import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ContactForm from "@/components/contact/ContactForm";
import JsonLd from "@/components/seo/JsonLd";
import { site } from "@/lib/site";
import { breadcrumbLd, graph, pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Contact Us",
  description: `Get in touch with ${site.name} — the Jhotwara counter in Jaipur. Call, WhatsApp, email, or drop by.`,
  path: "/contact",
});

/**
 * /contact — unlike the other footer pages, GET /api/page-data/contact
 * ships no page_content (checked: it's null), so this is a fully custom
 * page built from the same site config the footer and JSON-LD already use,
 * rather than a generic rich-text render.
 */
export default function ContactPage() {
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${site.geo.lat},${site.geo.lng}`;
  const mapEmbedSrc = `https://www.google.com/maps?q=${site.geo.lat},${site.geo.lng}&z=15&output=embed`;

  return (
    <main id="main">
      <div className="st-plp__head">
        <div className="st-wrap">
          <nav className="st-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><span>Contact Us</span>
          </nav>
          <span className="st-eyebrow" style={{ marginTop: ".9rem" }}>Get in touch</span>
          <h1>Contact Us</h1>
          <p>Someone at the Jhotwara counter reads every message — usually answered the same day.</p>
        </div>
      </div>

      <div className="st-wrap">
        <div className="st-contact__grid">
          <div className="st-contact__info">
            <a className="st-contact__card" href={mapsHref} target="_blank" rel="noopener noreferrer">
              <Icon name="pin" size={20} strokeWidth={1.6} />
              <div><b>Visit the counter</b>
                <p>{site.address.street}, {site.address.city} {site.address.postalCode}</p>
              </div>
            </a>
            <a className="st-contact__card" href={`tel:${site.phoneRaw}`}>
              <Icon name="phone" size={20} strokeWidth={1.6} />
              <div><b>Call us</b><p>{site.phone}</p></div>
            </a>
            <a className="st-contact__card" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={20} strokeWidth={1.6} />
              <div><b>WhatsApp</b><p>Fastest way to reach us</p></div>
            </a>
            <a className="st-contact__card" href={`mailto:${site.email}`}>
              <Icon name="mail" size={20} strokeWidth={1.6} />
              <div><b>Email</b><p>{site.email}</p></div>
            </a>
            <div className="st-contact__card">
              <Icon name="clock" size={20} strokeWidth={1.6} />
              <div><b>Delivery</b><p>{site.delivery.domestic} across India</p></div>
            </div>
          </div>

          <ContactForm />
        </div>

        <div className="st-contact__map ph">
          <iframe title="Saroj Textile on the map" src={mapEmbedSrc} loading="lazy"
            referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </div>

      <JsonLd data={graph([breadcrumbLd([{ name: "Home", path: "/" }, { name: "Contact Us", path: "/contact" }])])} />
    </main>
  );
}
