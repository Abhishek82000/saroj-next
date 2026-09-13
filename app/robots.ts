import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Search and filter permutations are infinite; keep them out of the index.
        disallow: ["/api/", "/shop?q=", "/*?*sort="],
      },
    ],
    sitemap: site.url.replace(/\/$/, "") + "/sitemap.xml",
    host: site.url,
  };
}
