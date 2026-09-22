import Link from "@/components/ui/SiteLink";
import RevealLink from "@/components/ui/RevealLink";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import { bySlug } from "@/lib/products";
import { categoryHref } from "@/lib/nav";
import { inr } from "@/lib/site";
import type { CommonFeaturedCategory } from "@/lib/types";

/** The opening selection, in the order it went out to the floor. */
const opening = [
  "kot-jewar-vase-and-jar",
  "meenakari-wall-plate",
  "brass-diya-hand-beaten",
  "marble-jali-lamp",
  "lac-bangles-stack-of-six",
];

/** Small numbers read better spelled out in a standfirst than as digits. */
const spell = (n: number) =>
  ["", "one", "two", "three", "four", "five"][n] ?? String(n);

/**
 * One plate on the wall. Both modes — live collections and the static
 * opening selection — are flattened into this shape first, so the markup
 * below stays a single list instead of a ternary wrapped around two trees.
 */
interface Plate {
  key: string;
  href: string;
  image: string;
  alt: string;
  note?: string;
  name: string;
  meta?: string;
  /** At most one marginal note per plate. */
  flag?: string;
}

export default function Shelf({ categories = [] }: { categories?: CommonFeaturedCategory[] }) {
  /* Five, not seven. The layout below is composed for five, and a shorter
     shelf of larger plates reads as a selection rather than a grid dump. */
  const live = categories.slice(0, 5);

  const plates: Plate[] = live.length > 0
    ? live.map((c) => ({
        key: String(c.id),
        href: categoryHref(c.slug),
        image: c.image,
        alt: c.name,
        name: c.name,
      }))
    : opening.flatMap((slug, i) => {
        const p = bySlug[slug];
        if (!p) return [];
        return [{
          key: slug,
          href: `/product/${slug}`,
          image: p.images[0].src,
          alt: p.name,
          note: p.images[0].note,
          name: p.name,
          meta: `${inr(p.price)} · ${p.unit}`,
          // Stock is the more useful of the two, so it wins the slot.
          flag: p.stock === "low" ? "Only a few left" : i === 0 ? "First firing" : undefined,
        }];
      });

  if (plates.length === 0) return null;

  /* Only promise "the rest" when there actually is a rest — otherwise the
     sentence contradicts what's on screen. */
  const lede = live.length === 0
    ? "Nineteen pieces made it through the first round. These five went out to the floor."
    : live.length < categories.length
      ? `${categories.length} collections make up the counter. These ${spell(live.length)} open the shelf — the rest are a search away.`
      : "Every collection on the counter, each one printed, cut and folded in Jaipur.";

  return (
    <section className="st-sec st-shelf-sec" id="shelf">
      <div className="st-wrap">
        <div className="st-shelf__head">
          <div>
            <Reveal className="st-eyebrow">
              {live.length > 0 ? "Shop by collection" : "Opening selection"}
            </Reveal>
            <Reveal as="h2" delay={1} className="st-h2">The first shelf.</Reveal>
          </div>
          <Reveal as="p" delay={2} className="st-shelf__lede">{lede}</Reveal>
        </div>

        <div className="st-hang">
          {plates.map((pl, i) => (
            <RevealLink key={pl.key} href={pl.href} className="st-piece"
              delay={(Math.min(i + 1, 4)) as 1 | 2 | 3 | 4}>
              <span className="st-piece__ph ph">
                <Photo src={pl.image} alt={pl.alt} note={pl.note}
                  sizes="(max-width:640px) 92vw, (max-width:1000px) 46vw, 33vw" />
              </span>

              {/* Draws left to right on hover — the only motion in the plate. */}
              <span className="st-piece__rule" aria-hidden="true" />

              <span className="st-piece__body">
                <span className="st-piece__i" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="st-piece__t">
                  <span className="st-piece__name">{pl.name}</span>
                  {(pl.meta || pl.flag) && (
                    <span className="st-piece__meta">
                      {pl.meta}
                      {pl.flag && <em>{pl.flag}</em>}
                    </span>
                  )}
                </span>
              </span>
            </RevealLink>
          ))}
        </div>

        <Reveal>
          <Link href="/shop" className="st-shelf__more">See everything on the counter</Link>
        </Reveal>
      </div>
    </section>
  );
}
