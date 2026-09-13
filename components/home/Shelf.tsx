import Link from "next/link";
import RevealLink from "@/components/ui/RevealLink";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import { bySlug } from "@/lib/products";
import { inr } from "@/lib/site";

/** The opening selection — a bento of five real pieces. */
const layout: [string, string][] = [
  ["kot-jewar-vase-and-jar", "st-tile--wide"],
  ["meenakari-wall-plate", "st-tile--tall"],
  ["brass-diya-hand-beaten", ""],
  ["marble-jali-lamp", ""],
  ["lac-bangles-stack-of-six", ""],
];

export default function Shelf() {
  return (
    <section className="st-sec" id="shelf">
      <div className="st-wrap">
        <Reveal className="st-eyebrow">Opening selection</Reveal>
        <Reveal as="h2" delay={1} className="st-h2">The first shelf.</Reveal>
        <Reveal as="p" delay={2} className="st-lede">
          Nineteen pieces made it through the first round. These five went out to the floor.
        </Reveal>

        <div className="st-shelf">
          {layout.map(([slug, mod], i) => {
            const p = bySlug[slug];
            if (!p) return null;
            return (
              <RevealLink key={slug} href={`/product/${slug}`}
                className={`st-tile ${mod}`.trim()} delay={(Math.min(i + 1, 4)) as 1 | 2 | 3 | 4}>
                {p.stock === "low" && <span className="st-tile__badge">Low stock</span>}
                {i === 0 && <span className="st-tile__badge">First firing</span>}
                <div className="st-tile__ph ph">
                  <Photo src={p.images[0].src} alt={p.name} note={p.images[0].note}
                    sizes="(max-width:840px) 50vw, 320px" />
                </div>
                <div className="st-tile__body">
                  <span className="st-tile__name">{p.name}</span>
                  <span className="st-tile__row">
                    <span className="st-tile__price">{inr(p.price)}</span>
                    <span className="st-tile__unit">{p.unit}</span>
                  </span>
                </div>
              </RevealLink>
            );
          })}
        </div>

        <Reveal className="row-gap stack-4">
          <Link href="/shop" className="st-btn st-btn--solid">See everything on the counter</Link>
          <Link href="/#making" className="st-btn">How they’re made</Link>
        </Reveal>
      </div>
    </section>
  );
}
