import RevealLink from "@/components/ui/RevealLink";
import Photo from "@/components/ui/Photo";
import Reveal from "@/components/ui/Reveal";
import { categoryHref } from "@/lib/nav";
import type { CommonFeaturedCategory } from "@/lib/types";

/** Small numbers read better spelled out than as digits. */
const spell = (n: number) =>
  ["", "one", "two", "three", "four", "five"][n] ?? String(n);

const VISIBLE = 5;

export default function Shelf({
  categories = [],
}: {
  categories?: CommonFeaturedCategory[];
}) {
  /* The layout is composed for five arches. */
  const shown = categories.slice(0, VISIBLE);
  if (shown.length === 0) return null;

  /* Only promise "the rest" when there actually is a rest. */
  const intro =
    shown.length < categories.length
      ? `${categories.length} collections make up the counter. These ${spell(shown.length)} open the shelf — the rest are a search away.`
      : "Every collection on the counter, each one printed, cut and folded in Jaipur.";

  const count =
    shown.length < categories.length
      ? `Showing ${shown.length} of ${categories.length}`
      : `${categories.length} ${categories.length === 1 ? "collection" : "collections"}`;

  return (
    <section className="coll-root" id="shelf" aria-labelledby="coll-title">
      <div className="coll-inner">
        <header className="coll-top">
          <div className="coll-top-main">
            <Reveal as="h2" className="coll-title" id="coll-title">
              The first shelf.
            </Reveal>
            <Reveal as="p" delay={1} className="coll-intro">
              {intro}
            </Reveal>
          </div>
          <div className="coll-meta">
            <span className="coll-rule" aria-hidden="true" />
            
          </div>
        </header>

        <ul className="coll-grid" data-count={shown.length}>
          {shown.map((c, i) => (
            <li className="coll-cell" key={c.id}>
              <RevealLink
                href={categoryHref(c.slug)}
                className="coll-card"
                delay={Math.min(i + 1, 4) as 1 | 2 | 3 | 4}
              >
                <span className="coll-card-media">
                  <Photo
                    src={c.image}
                    alt=""
                    sizes="(max-width:640px) 46vw, (max-width:1000px) 30vw, 20vw"
                  />
                </span>
                <span className="coll-card-name">{c.name}</span>
              </RevealLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}