import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ContactForm from "@/components/contact/ContactForm";
import JsonLd from "@/components/seo/JsonLd";
import { site } from "@/lib/site";
import { WHOLESALE_HOME } from "@/lib/wholesale";
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
 *
 * A madder-and-indigo hero with the three quickest ways in, then each way
 * to reach us as its own coloured tile beside the form, then the map.
 */
export default function ContactPage() {
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${site.geo.lat},${site.geo.lng}`;
  const mapEmbedSrc = `https://www.google.com/maps?q=${site.geo.lat},${site.geo.lng}&z=15&output=embed`;
  const wa = `https://wa.me/${site.whatsapp}`;
  const address = `${site.address.street}, ${site.address.city} ${site.address.postalCode}`;

  const ways = [
    { tone: "wa", icon: "whatsapp", title: "WhatsApp", line: "Fastest — photos, prices, orders", cta: "Chat now", href: wa, external: true },
    { tone: "call", icon: "phone", title: "Call the counter", line: site.phone, cta: "Call", href: `tel:${site.phoneRaw}` },
    { tone: "mail", icon: "mail", title: "Email", line: site.email, cta: "Write to us", href: `mailto:${site.email}` },
    { tone: "visit", icon: "pin", title: "Visit us", line: address, cta: "Directions", href: mapsHref, external: true },
  ] as const;

  return (
    <main id="main" className="ct">
      {/* ---------- hero ---------- */}
      <section className="ct-hero">
        <span className="ct-hero__mark" aria-hidden="true">संपर्क</span>
        <div className="st-wrap ct-hero__in">
          <nav className="st-crumb ct-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><span>Contact Us</span>
          </nav>
          <span className="ct-hero__live"><i aria-hidden="true" /> Usually answered the same day</span>
          <h1 className="ct-hero__title">Let’s talk <em>cloth.</em></h1>
          <p className="ct-hero__sub">
            Prints, lengths, wholesale rates or a handicraft piece you spotted — someone at the
            Jhotwara counter reads every message.
          </p>
          <div className="ct-hero__quick">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="ct-pill ct-pill--wa">
              <Icon name="whatsapp" size={16} fill="currentColor" strokeWidth={0} /> WhatsApp
            </a>
            <a href={`tel:${site.phoneRaw}`} className="ct-pill"><Icon name="phone" size={15} strokeWidth={1.8} /> {site.phone}</a>
            <a href={`mailto:${site.email}`} className="ct-pill"><Icon name="mail" size={15} strokeWidth={1.8} /> Email us</a>
          </div>
        </div>
        {/* a row of block-print buttis along the bottom edge */}
        <span className="ct-hero__border" aria-hidden="true" />
      </section>

      {/* ---------- ways in + form ---------- */}
      <section className="st-wrap ct-body">
        <div className="ct-ways">
          {ways.map((w) => (
            <a key={w.tone} href={w.href} className={`ct-way ct-way--${w.tone}`}
              {...("external" in w && w.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <span className="ct-way__ic" aria-hidden="true">
                {/* The WhatsApp mark is a filled glyph; the rest are line icons. */}
                {w.icon === "whatsapp"
                  ? <Icon name="whatsapp" size={20} fill="currentColor" strokeWidth={0} />
                  : <Icon name={w.icon} size={20} strokeWidth={1.7} />}
              </span>
              <span className="ct-way__t">
                <b>{w.title}</b>
                <small>{w.line}</small>
              </span>
              <span className="ct-way__go">{w.cta} <Icon name="right" size={13} strokeWidth={2} /></span>
            </a>
          ))}

          <div className="ct-facts">
            <div><Icon name="truck" size={18} strokeWidth={1.6} /><span><b>{site.delivery.domestic}</b><small>Delivery across India</small></span></div>
            <div><Icon name="gift" size={18} strokeWidth={1.6} /><span><b>Free over ₹{site.freeShippingOver.toLocaleString("en-IN")}</b><small>On retail orders</small></span></div>
          </div>

          <Link href={WHOLESALE_HOME} className="ct-trade">
            <span>
              <small>Buying for a shop or a boutique?</small>
              <b>Wholesale from {site.wholesaleFrom} m — see trade rates</b>
            </span>
            <Icon name="right" size={16} strokeWidth={1.8} />
          </Link>
        </div>

        <ContactForm />
      </section>

      {/* ---------- map ---------- */}
      <section className="st-wrap ct-mapwrap">
        <div className="ct-map ph">
          <iframe title="Saroj Textile on the map" src={mapEmbedSrc} loading="lazy"
            referrerPolicy="no-referrer-when-downgrade" />
          <div className="ct-map__card">
            <span className="ct-map__ic" aria-hidden="true"><Icon name="pin" size={18} strokeWidth={1.8} /></span>
            <div>
              <b>{site.name}</b>
              <p>{address}, {site.address.region}</p>
              <a href={mapsHref} target="_blank" rel="noopener noreferrer">Get directions <Icon name="right" size={12} strokeWidth={2} /></a>
            </div>
          </div>
        </div>
      </section>

      <JsonLd data={graph([breadcrumbLd([{ name: "Home", path: "/" }, { name: "Contact Us", path: "/contact" }])])} />
    </main>
  );
}
