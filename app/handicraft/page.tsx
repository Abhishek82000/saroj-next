import type { Metadata } from "next";
import HandicraftPage from "@/components/handicraft/HandicraftPage";
import { getHandicraftData, loadHandicraftData } from "@/lib/handicraft";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Handicraft",
  description:
    "The hand behind our cloth now works in clay, brass and enamel. Jaipur handicraft alongside the fabric house Saroj Textile has always been.",
  path: "/handicraft",
});

export default async function Handicraft() {
  /* A failed API call throws: Next then keeps serving the last good page instead of
     caching this one without its handicraft. Only a build, with no good page yet and a
     deploy to protect, carries on without the data; the first visit after it refills the page. */
  const data = process.env.NEXT_PHASE === "phase-production-build"
    ? await getHandicraftData()
    : await loadHandicraftData();
  return <HandicraftPage data={data} />;
}
