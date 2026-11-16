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
      "",
    path: "/",
  }, await getHomeMeta());
}

export default function HomePage() {
  return <HomeSections />;
}
