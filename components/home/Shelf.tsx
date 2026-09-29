import RevealLink from "@/components/ui/RevealLink";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import { categoryHref } from "@/lib/nav";
import type { CommonFeaturedCategory } from "@/lib/types";


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

  /* Featured categories from the API only. */
  const plates: Plate[] = live.map((c) => ({
    key: String(c.id),
    href: categoryHref(c.slug),
    image: c.image,
    alt: c.name,
    name: c.name,
  }));

  if (plates.length === 0) return null;

  /* Only promise "the rest" when there actually is a rest — otherwise the
     sentence contradicts what's on screen. */
  const lede = live.length < categories.length
      ? `${categories.length} collections make up the counter. These ${spell(live.length)} open the shelf — the rest are a search away.`
      : "Every collection on the counter, each one printed, cut and folded in Jaipur.";

  return (
    <section className="st-sec st-shelf-sec" id="shelf">
      <div className="st-wrap">
        <div className="st-shelf__head">
          <div>
            <Reveal className="st-eyebrow">
              Shop by collection
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
      </div>
    </section>
  );
}
