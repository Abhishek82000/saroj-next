import Link from "@/components/ui/SiteLink";
import type { HcSlide } from "@/lib/handicraft";
import FabricStrip from "./FabricStrip";

/**
 * The fabric house: the pitch for the textile range, over every fabric
 * collection drifting past. Its styles live under `.hc`, so it needs that
 * wrapper. `reveal` is for pages whose own script fades in `.rv` elements
 * (HandicraftPage); anywhere else they would stay hidden.
 */
export default function FabricHouse({ slides, reveal = true }: { slides: HcSlide[]; reveal?: boolean }) {
  const rv = reveal ? "rv" : "";

  return (
    <section className="hc-sec hc-cloth mb-5" id="cloth">
      <span className="hc-cloth__mark hc-dv" aria-hidden="true">कपड़ा</span>
      <div className="hc-wrap hc-cloth__head">
        <div>
          <h2 className={`hc-h2 ${rv}`} data-d="1">Prints That Never Go <em>Out of Style.</em></h2>
        </div>
        <div className="hc-cloth__side">
          <p className={`hc-lede ${rv}`} data-d="2">Do not forget to explore our established textile category with a huge range of printed cotton fabric. We bring fabric that has ruled the industry over the last 30 years.</p>
          <div className={`hc-cloth__cta ${rv}`} data-d="3">
            <Link href="/shop" className="hc-btn hc-btn--solid">Shop all fabrics</Link>
            <span className="hc-cloth__count"><b>{slides.length}</b> collections on the line</span>
          </div>
        </div>
      </div>

      {/* Every fabric collection, drifting past under the fan. */}
      <FabricStrip slides={slides} />
    </section>
  );
}
