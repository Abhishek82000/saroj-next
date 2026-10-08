import Link from "next/link";
import FabricStrip from "@/components/handicraft/FabricStrip";
import { categoryHref } from "@/lib/nav";
import type { ProductDetail } from "@/lib/types";

/**
 * The handicraft categories at the foot of the product page, drawn as the
 * handicraft page's fabric-house section turned around: the same heading
 * block and the same clothesline strip, pointing the other way. The `hc`
 * wrapper brings in that page's scoped palette and styles.
 */
export default function HandicraftHouse({ categories }: { categories: ProductDetail["handicraftCategories"] }) {
  if (categories.length === 0) return null;
  const slides = categories.map((c) => ({ name: c.name, href: categoryHref(c.slug), img: c.image }));

  return (
    <div className="hc">
      <section className="hc-sec hc-cloth" aria-label="Handicraft categories">
        <span className="hc-cloth__mark hc-dv" aria-hidden="true">हस्तशिल्प</span>
        <div className="hc-wrap hc-cloth__head">
          <div>
            <div className="hc-eyebrow">The second house</div>
            <h2 className="hc-h2">Made by hand, <em>beside the cloth.</em></h2>
          </div>
          <div className="hc-cloth__side">
            <p className="hc-lede">Clay, brass, enamel and wood from the same Jaipur lanes that print our fabric. Pick a craft and see what is on the shelf today.</p>
            <div className="hc-cloth__cta">
              <Link href="/handicraft" className="hc-btn hc-btn--solid">Shop handicraft</Link>
              <span className="hc-cloth__count"><b>{slides.length}</b> {slides.length === 1 ? "craft" : "crafts"} on the line</span>
            </div>
          </div>
        </div>

        <FabricStrip slides={slides} />
      </section>
    </div>
  );
}
