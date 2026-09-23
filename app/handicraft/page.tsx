import type { Metadata } from "next";
import HandicraftPage from "@/components/handicraft/HandicraftPage";
import { getHandicraftData } from "@/lib/handicraft";
import { pageMeta } from "@/lib/seo";
import "@/styles/handicraft.css";

export const metadata: Metadata = pageMeta({
  title: "Handicraft",
  description:
    "The hand behind our cloth now works in clay, brass and enamel. Jaipur handicraft alongside the fabric house Saroj Textile has always been.",
  path: "/handicraft",
});

export default async function Handicraft() {
  const data = await getHandicraftData();
  return <HandicraftPage data={data} />;
}
