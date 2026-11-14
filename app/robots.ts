import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * /robots.txt. Googlebot and Googlebot-image get their own groups with an
 * empty Disallow (crawl everything); every other crawler gets the "*" rules.
 * (`disallow: [""]` — an array — is what makes Next print a bare "Disallow:".)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", disallow: [""] },
      { userAgent: "Googlebot-image", disallow: [""] },
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/blog/tag/*",
          "/blog/category/*",
          "/public/product/*",
          "/wholesale/product/*",
          "/public/*",
          "/cart",
          "/checkout",
          "/badmin",
          // Search and filter permutations are infinite; keep them out of the index.
          "/api/",
          "/shop?q=",
          "/*?*sort=",
        ],
      },
    ],
    sitemap: site.url.replace(/\/$/, "") + "/sitemap.xml",
  };
}
