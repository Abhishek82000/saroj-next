import Link from "next/link";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";

const PIC = "https://picsum.photos/seed/";
const CDN = "https://saroj-textile-store.b-cdn.net/products/";

const houses = [
  {
    tag: "Since 1998", est: "House one",
    title: "The fabric house",
    copy: "Bolt after bolt of Ajrakh, Kalamkari and Jaipuri cotton, cut to whatever length you ask for.",
    chips: ["Ajrakh", "Kalamkari", "Sanganeri", "Indigo", "Wholesale"],
    href: "/shop?craft=fabric",
    src: CDN + "48621785565568.webp",
    alt: "Teal pastel green with blue Ajrakh printed cotton",
  },
  {
    tag: "Opened this year", est: "House two",
    title: "The handicraft house",
    copy: "Pottery, enamel, brass, marble and puppets — all of it from lanes within an hour of the counter.",
    chips: ["Blue Pottery", "Meenakari", "Lac & Brass", "Marble Jali", "Kathputli"],
    href: "/shop?craft=pottery",
    src: PIC + "saroj-house-craft/1200/900",
    alt: "Handicraft on a workshop shelf",
  },
];

/** The two sides of the business, side by side. */
export default function TwoHouses() {
  return (
    <section className="st-sec" style={{paddingBlock:"clamp(28px,5vw,54px)"}}>
      <div className="st-wrap">
        <Reveal className="st-eyebrow">Under one roof</Reveal>
        <Reveal as="h2" delay={1} className="st-h2">Two houses,<br />one hand.</Reveal>

        <div className="st-houses">
          {houses.map((h, i) => (
            <Reveal key={h.title} delay={(i + 1) as 1 | 2}>
              <Link href={h.href} className="st-house" style={{ display: "flex" }}>
                <span className="st-house__ph ph">
                  <Photo src={h.src} alt={h.alt} sizes="(max-width:880px) 100vw, 620px" />
                </span>
                <span className="st-house__est">{h.est}</span>
                <div className="st-house__in">
                  <span className="st-house__tag">{h.tag}</span>
                  <h3>{h.title}</h3>
                  <p>{h.copy}</p>
                  <div className="st-house__chips">{h.chips.map((c) => <span key={c}>{c}</span>)}</div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="st-ledger">
          {[["28", "Years at the counter"], ["212", "Pieces on the shelf"], ["6", "Crafts taken on"], ["42", "Artisan families"]]
            .map(([n, label]) => (
              <div className="st-lg" key={label}><span>{n}</span><small>{label}</small></div>
            ))}
        </div>
      </div>
    </section>
  );
}
