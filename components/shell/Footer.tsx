import Link from "next/link";
import { site } from "@/lib/site";

const columns = [
  {
    title: "Fabrics",
    links: [
      ["/shop?craft=fabric", "All fabric"],
      ["/product/maroon-base-with-cream-paisley-printed-jaipuri-cotton-fabric", "Jaipuri Cotton"],
      ["/shop/ajrakh-collection", "Ajrakh Collection"],
      ["/shop?q=kalamkari", "Kalamkari"],
      ["/shop?q=paisley", "Paisley Prints"],
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
      ["https://www.sarojtextile.com/faq", "FAQs"],
      ["https://www.sarojtextile.com/blogs", "Blog"],
      ["https://www.sarojtextile.com/wholesale-fabric", "Wholesale @ ₹80"],
      ["https://www.sarojtextile.com/contact", "Contact"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="st-foot">
      <div className="st-wrap">
        <div className="st-foot__grid">
          <div>
            <Link className="st-brand" href="/"><img width={80} src="https://www.sarojtextile.com/public/img/uploads/settings/1758459499.png" alt="Saroj Textile" /></Link>
            <p className="st-foot__addr" style={{ marginTop: ".9rem" }}>
              {site.address.street}, {site.address.city} {site.address.postalCode}<br />
              <a href={`tel:${site.phoneRaw}`}>{site.phone}</a><br />
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </p>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <h2 style={{ fontSize: ".6rem", letterSpacing: ".22em", textTransform: "uppercase", color: "var(--cobalt)", margin: "0 0 1rem", fontWeight: 700 }}>
                {c.title}
              </h2>
              <ul>
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    {href.startsWith("http") ? <a href={href}>{label}</a> : <Link href={href}>{label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="st-foot__bar">
          <span>© {new Date().getFullYear()} {site.name} · {site.address.city}</span>
          <span>Cut, folded and posted from Jhotwara</span>
        </div>
      </div>
    </footer>
  );
}
