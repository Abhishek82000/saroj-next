import type { Metadata } from "next";
import { getAdminPageMeta, withAdminMeta } from "@/lib/page-meta";
import HomeSections from "@/components/home/HomeSections";
import WholesaleHome from "@/components/wholesale/WholesaleHome";
import { getWholesalePage } from "@/lib/wholesalePage";
import { WHOLESALE_HOME, WHOLESALE_MIN_METRES } from "@/lib/wholesale";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return withAdminMeta({
    title: "Wholesale fabric",
    description: `Wholesale fabric from ${site.name}, Jaipur — cut to your lengths from ${WHOLESALE_MIN_METRES} m, at trade rates.`,
    path: WHOLESALE_HOME,
  }, await getAdminPageMeta("wholesale-fabric"));
}

/**
 * /wholesale-fabric — its own page, built from GET /api/wholesale-page-data;
 * prices only from that feed, and no add-to-cart.
 *
 * If the feed is down while the page is being refreshed in the background
 * (ISR, every 5 minutes), throwing makes Next keep serving the last good
 * page instead of caching a fallback over it. Only a build that finds the
 * feed down (nothing to keep yet) falls back to the shared home sections'
 * wholesale-mode explainer — and the next refresh replaces it.
 */
export default async function WholesalePage() {
  const page = await getWholesalePage();
  if (page) return <WholesaleHome page={page} />;
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error("Wholesale feed unavailable (GET /api/wholesale-page-data) — keeping the last good page.");
  }
  return <HomeSections wholesale={null} />;
}
