import type { Metadata } from "next";
import HomeSections from "@/components/home/HomeSections";
import { getWholesalePage } from "@/lib/wholesalePage";
import { WHOLESALE_HOME, WHOLESALE_MIN_METRES } from "@/lib/wholesale";
import { site } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Wholesale fabric",
  description: `Wholesale fabric from ${site.name}, Jaipur — cut to your lengths from ${WHOLESALE_MIN_METRES} m, at trade rates.`,
  path: WHOLESALE_HOME,
});

/**
 * /wholesale-fabric — the same page as the retail home, in wholesale mode:
 * banners and category rails from GET /api/wholesale-page-data, prices only
 * from that feed, and no add-to-cart.
 */
export default async function WholesalePage() {
  return <HomeSections wholesale={await getWholesalePage()} />;
}
