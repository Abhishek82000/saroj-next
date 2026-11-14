import type { Metadata } from "next";
import HomeSections from "@/components/home/HomeSections";
import { getHomeMeta, withAdminMeta } from "@/lib/page-meta";
import { site } from "@/lib/site";

/* The admin's home meta (GET /api/home → meta) over these defaults. */
export async function generateMetadata(): Promise<Metadata> {
  return withAdminMeta({
    title: `${site.name} — ${site.tagline}`,
    absoluteTitle: true,
    description:
      "Hand block printed Jaipuri cotton, Ajrakh and Kalamkari by the meter, alongside blue pottery, meenakari, brass and marble from the lanes that print our cloth. Cut to any length from one meter.",
    path: "/",
  }, await getHomeMeta());
}

export default function HomePage() {
  return <HomeSections />;
}
