import Link from "@/components/ui/SiteLink";
import { site } from "@/lib/site";

const columns = [
  {
    title: "Fabrics",
    links: [
      ["/shop?craft=fabric", "All fabric"],
      ["/product/maroon-base-with-cream-paisley-printed-jaipuri-cotton-fabric", "Jaipuri Cotton"],
      ["/shop/ajrakh-collection", "Ajrakh Collection"],
      ["/shop/kalamkari", "Kalamkari"],
      ["/shop/paisley", "Paisley Prints"],
    ],
  },
  {
    title: "Help",
    links: [
      ["/return-policy", "Returns & exchanges"],
      ["/refund-policy", "Refund policy"],
      ["/privacy-policy", "Privacy policy"],
      ["/terms-conditions", "Terms & conditions"],
    ],
  },
  {
    title: "The house",
    links: [
      ["https://www.sarojtextile.com/about", "Our story"],
      ["/faq", "FAQs"],
      ["/blog", "Blog"],
      ["/wholesale-fabric", "Wholesale @ ₹80"],
      ["/contact", "Contact"],
    ],
  },
];

/* A swatch book along the top edge — real cloth from each collection, pinked like a sample cut. */
const CAT = "https://saroj-textile-store.b-cdn.net/category/";
const swatches = [
  ["Ajrakh", "ajrakh-collection", "17855740415801.webp"],
  ["Jaipur Cotton", "jaipur-cotton", "17808346283546.webp"],
  ["Kalamkari", "kalamkari", "17855703751571.webp"],
  ["Indigo", "indigo", "17704503359781.webp"],
  ["Paisley", "paisley-prints", "17855703206077.webp"],
  ["Patola", "patola-prints", "17855704741310.webp"],
  ["Flower Garden", "flower-garden-collection", "17753697832243.webp"],
  ["Hakoba", "hakoba-and-dobby", "17808342608853.webp"],
];

const icon = {
  wa: "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.6-.1 1.1Z",
  call: "M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z",
  mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm8 7.2L4.6 7.4v1.9L12 14l7.4-4.7V7.4L12 12.2Z",
  fb: "M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z",
};
const Svg = ({ d }: { d: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
);

export default function Footer() {
  const [fb, ig] = site.social;
  return (
    <footer className="st-foot">
      <nav className="st-foot__swatches" aria-label="Shop by fabric">
        {swatches.map(([name, slug, file]) => (
          <Link key={slug} className="st-foot__sw" href={`/shop/${slug}`}>
            <img src={CAT + file} alt="" loading="lazy" width={160} height={110} />
            <span>{name}</span>
          </Link>
        ))}
      </nav>

      <div className="st-wrap st-foot__body">
        <div className="st-foot__lead">
          <Link className="st-foot__logo" href="/" aria-label="Saroj Textile home">
            <img width={46} height={46} src="https://www.sarojtextile.com/public/img/uploads/settings/1758459499.png" alt="Saroj Textile" />
          </Link>
          <p className="st-foot__say">Printed by hand,<br /><em>cut to the metre.</em></p>
          <address>{site.address.street}, {site.address.city} {site.address.postalCode}</address>
        </div>

        {columns.map((c) => (
          <nav key={c.title} className="st-foot__col" aria-label={c.title}>
            <h2 className="st-foot__h">{c.title}</h2>
            <ul>
              {c.links.map(([href, label]) => (
                <li key={href}>
                  {href.startsWith("http") ? <a href={href}>{label}</a> : <Link href={href}>{label}</Link>}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* A kraft swing tag, the kind tied to every bolt that leaves the shop. */}
        <div className="st-foot__tag">
          <h2 className="st-foot__h">Talk to the shop</h2>
          <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer"><Svg d={icon.wa} /><b>WhatsApp</b><i>Chat now</i></a>
          <a href={`tel:${site.phoneRaw}`}><Svg d={icon.call} /><b>Call</b><i>{site.phone}</i></a>
          <a href={`mailto:${site.email}`}><Svg d={icon.mail} /><b>Email</b><i>{site.email}</i></a>
          <div className="st-foot__soc">
            <a href={ig} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" fill="currentColor" /></svg>
            </a>
            <a href={fb} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Svg d={icon.fb} /></a>
          </div>
        </div>
      </div>

      {/* The bottom bar is a tailor's tape. */}
      <div className="st-foot__tape">
        <div className="st-wrap">
          <span>© {new Date().getFullYear()} {site.name} · {site.address.city}</span>
          <span className="st-foot__made">Measured, cut &amp; posted from Jhotwara</span>
          <a className="st-foot__up" href="#">Back to top <span aria-hidden="true">↑</span></a>
        </div>
      </div>
    </footer>
  );
}
