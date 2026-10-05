import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { WHOLESALE_HOME } from "@/lib/wholesale";

const CDN = "https://saroj-textile-store.b-cdn.net/products/";
/* Stand-ins, as on /handicraft, until craft photography is on the CDN.
   SWAP: a blue pottery piece (tall shot) and a meenakari close-up (square). */
const PIC = "https://picsum.photos/seed/";

interface Way {
  n: string;
  kicker: string;
  title: string;
  copy: string;
  badge: string;
  facts: [string, string][];
  cta: string;
  href: string;
  main: { src: string; alt: string };
  inset: { src: string; alt: string };
}

/**
 * Home: the two sides of the business — wholesale fabric and Jaipur
 * handicraft — each with a photo, a few lines, three facts and the way in.
 * Retail home only (the wholesale home is already inside wholesale).
 */
export default function WaysToBuy() {
  const ways: Way[] = [
    {
      n: "01",
      kicker: "Wholesale fabric",
      title: "The trade counter.",
      copy: "Hand block printed Ajrakh, Kalamkari and Jaipuri cotton at trade rates — for boutiques, tailors and labels who buy by the bolt.",
      badge: "Since 1998",
      facts: [["₹80/m", "Trade rates from"], ["10 m", "Minimum a print"], ["GST", "Invoice on every order"]],
      cta: "Explore wholesale",
      href: WHOLESALE_HOME,
      main: { src: CDN + "63141785559833.webp", alt: "Bolts of red Ajrakh hand block printed cotton" },
      inset: { src: CDN + "2201780380811.webp", alt: "Indigo Ajrakh print, close up" },
    },
    {
      n: "02",
      kicker: "Jaipur handicraft",
      title: "The craft house.",
      copy: "Blue pottery from Kot Jewar, meenakari from Johari Bazaar, hand-beaten brass and marble — straight from the lanes that print our cloth.",
      badge: "Made in Jaipur",
      facts: [["6", "Crafts taken on"], ["42", "Artisan families"], ["1 hr", "Workshop to counter"]],
      cta: "Explore handicraft",
      href: "/handicraft",
      main: { src: PIC + "saroj-craft-pottery/800/1000", alt: "Blue pottery from Kot Jewar" },
      inset: { src: PIC + "saroj-craft-meena/400/400", alt: "Meenakari enamel work, close up" },
    },
  ];

  return (
    <section className="st-sec st-ways" aria-labelledby="ways-h">
      <div className="st-wrap">
        <header className="st-ways__head">
          <div>
            <Reveal className="st-eyebrow">Two counters, one family</Reveal>
            <Reveal as="h2" delay={1} className="st-h2" id="ways-h">
              Buy by the bolt,<br /><em>or by the piece.</em>
            </Reveal>
          </div>
          <Reveal as="p" delay={2} className="st-lede">
            We have cut cloth in Jhotwara since 1998. Today the same counter supplies boutiques and tailors
            by the metre — and brings Jaipur&apos;s handicraft home to yours.
          </Reveal>
        </header>

        <div className="st-ways__grid">
          {ways.map((w, i) => (
            <Reveal as="article" key={w.n} delay={(i + 1) as 1 | 2} className="st-way" aria-labelledby={`way-${w.n}`}>
              <div className="st-way__art">
                <div className="st-way__arch">
                  <Image src={w.main.src} alt={w.main.alt} fill sizes="(max-width:900px) 88vw, 540px" />
                  <span className="st-way__badge">{w.badge}</span>
                </div>
                <div className="st-way__inset">
                  <Image src={w.inset.src} alt={w.inset.alt} fill sizes="160px" />
                </div>
              </div>
              <div className="st-way__body">
                <p className="st-way__kick"><span>{w.n}</span>{w.kicker}</p>
                <h3 id={`way-${w.n}`}>{w.title}</h3>
                {/* <p className="st-way__copy">{w.copy}</p> */}
                {/* <dl className="st-way__facts">
                  {w.facts.map(([v, label]) => (
                    <div key={label}><dt>{label}</dt><dd>{v}</dd></div>
                  ))}
                </dl> */}
                <Link href={w.href} className="st-btn st-way__cta">
                  {w.cta}<Icon name="right" size={15} strokeWidth={1.8} />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
