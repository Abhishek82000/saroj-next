import Link from "next/link";
import ShowMore from "@/components/ui/ShowMore";
import { categoryHref } from "@/lib/nav";
import type { CommonFeaturedCategory } from "@/lib/types";

/**
 * The handicraft categories (`handcategories` from /api/home), one screen tall
 * on deep madder: the heading on the left, and the categories as arched
 * windows drifting past in two lanes that run opposite ways — up and down on
 * desktop, left and right on phones. Pure CSS motion; it pauses on hover or
 * focus and holds still for reduced motion.
 */
export default function CraftHouse({ categories }: { categories: CommonFeaturedCategory[] }) {
  if (categories.length === 0) return null;

  /* Two lanes from alternate categories. A short list is repeated so each lane
     outruns its window; each lane is then drawn twice so the loop is seamless. */
  const lanes = [0, 1].map((k) => {
    let lane = categories.filter((_, i) => i % 2 === k);
    if (lane.length === 0) lane = categories;
    while (lane.length < 5) lane = [...lane, ...lane];
    return lane;
  });

  return (
    <section className="chs" aria-labelledby="chs-title">
      <span className="chs__mark" aria-hidden="true">हस्तशिल्प</span>
      <div className="chs__in">
        <div className="chs__copy">
          <h2 className="chs__title" id="chs-title">Handmade Finds, <em>You’ll Love</em></h2>
          <ShowMore fraction={0.75}>
            <p className="chs__lede">
              After establishing our name in the textile industry, we are now ready to take opportunities. We used our 30 years of knowledge, hard work, and love of textiles to make something special for you. Check out our brand-new handicrafts section.
            </p>
            <p className="chs__lede">
              The product you use every day says a lot about you. Products that are meant to add a classic touch to your everyday life.
            </p>
          </ShowMore>
          <div className="chs__cta">
            <Link href="/handicraft" className="chs__btn">Shop handicraft</Link>
            <span className="chs__count"><b>{categories.length}</b> {categories.length === 1 ? "craft" : "crafts"} on the shelf</span>
          </div>
        </div>

        <div className="chs__lanes" aria-hidden="true">
          {lanes.map((lane, k) => (
            <div className={`chs__lane chs__lane--${k ? "b" : "a"}`} key={k}>
              <div className="chs__track" data-marquee style={{ animationDuration: `${lane.length * 6}s` }}>
                {[...lane, ...lane].map((c, i) => (
                  <Link key={i} href={categoryHref(c.slug)} className="chs__tile" tabIndex={-1}>
                    <span className="chs__ph">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image} alt="" loading="lazy" draggable={false} />
                    </span>
                    <span className="chs__name">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
