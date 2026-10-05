import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";
import { WHOLESALE_HOME } from "@/lib/wholesale";

const CDN = "https://saroj-textile-store.b-cdn.net/products/";
/* Stand-ins until craft photography is on the CDN.
   SWAP: a blue pottery piece (tall shot) and a meenakari close-up (square). */
const PIC = "https://picsum.photos/seed/";

interface Way {
  id: string;
  kicker: string;
  title: string;
  copy: string;
  badge: string;
  cta: string;
  href: string;
  main: { src: string; alt: string };
  inset: { src: string; alt: string };
}

const WAYS: Way[] = [
  {
    id: "wholesale",
    kicker: "Wholesale fabric",
    title: "The trade counter.",
    copy: "Hand block printed Ajrakh, Kalamkari and Jaipuri cotton at trade rates, for boutiques, tailors and labels who buy by the bolt.",
    badge: "Since 1998",
    cta: "Explore wholesale",
    href: WHOLESALE_HOME,
    main: { src: CDN + "63141785559833.webp", alt: "Bolts of red Ajrakh hand block printed cotton" },
    inset: { src: CDN + "2201780380811.webp", alt: "Indigo Ajrakh print, close up" },
  },
  {
    id: "handicraft",
    kicker: "Jaipur handicraft",
    title: "The craft house.",
    copy: "Blue pottery from Kot Jewar, meenakari from Johari Bazaar, hand-beaten brass and marble, straight from the lanes that print our cloth.",
    badge: "Made in Jaipur",
    cta: "Explore handicraft",
    href: "/handicraft",
    main: { src: PIC + "saroj-craft-pottery/800/1000", alt: "Blue pottery from Kot Jewar" },
    inset: { src: PIC + "saroj-craft-meena/400/400", alt: "Meenakari enamel work, close up" },
  },
];

/**
 * Home: the two sides of the business, one full screen each.
 * Part one: picture left, words right. Part two: mirrored.
 * Retail home only (the wholesale home is already inside wholesale).
 */
export default function WaysToBuy() {
  return (
    <section className="wb-root" aria-label="Two ways to buy">
      {WAYS.map((w, i) => (
        <article
          key={w.id}
          className={`wb-part ${i % 2 ? "wb-part--flip wb-part--ink" : "wb-part--paper"}`}
          aria-labelledby={`wb-${w.id}`}
        >
          <Reveal className="wb-art">
            <div className="wb-arch">
              <Image
                src={w.main.src}
                alt={w.main.alt}
                fill
                sizes="(max-width:900px) 80vw, 40vw"
                className="wb-img"
              />
              <span className="wb-badge">{w.badge}</span>
            </div>
            <div className="wb-inset">
              <Image src={w.inset.src} alt={w.inset.alt} fill sizes="160px" className="wb-img" />
            </div>
          </Reveal>

          <div className="wb-text">
            <Reveal as="p" delay={1} className="wb-kicker">{w.kicker}</Reveal>
            <Reveal as="h2" delay={2} className="wb-heading" id={`wb-${w.id}`}>{w.title}</Reveal>
            <Reveal as="p" delay={3} className="wb-copy">{w.copy}</Reveal>
            <Reveal delay={4} className="wb-actions">
              <Link href={w.href} className="wb-cta">
                {w.cta}
                <Icon name="right" size={15} strokeWidth={1.8} />
              </Link>
            </Reveal>
          </div>
        </article>
      ))}
    </section>
  );
}