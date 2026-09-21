import type { Metadata } from "next";
import HomeSections from "@/components/home/HomeSections";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: `${site.name} — ${site.tagline}`,
  description:
    "Hand block printed Jaipuri cotton, Ajrakh and Kalamkari by the metre, alongside blue pottery, meenakari, brass and marble from the lanes that print our cloth. Cut to any length from one metre.",
  path: "/",
});

export default function HomePage() {
  return <HomeSections />;
}
