import type { Metadata } from "next";
import HomeSections from "@/components/home/HomeSections";
import WholesaleHome from "@/components/wholesale/WholesaleHome";
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
 * /wholesale-fabric — its own page, built from GET /api/wholesale-page-data;
 * prices only from that feed, and no add-to-cart. If the feed is down it falls
 * back to the shared home sections' wholesale-mode explainer.
 */
export default async function WholesalePage() {
  const page = await getWholesalePage();
  return page ? <WholesaleHome page={page} /> : <HomeSections wholesale={null} />;
}
