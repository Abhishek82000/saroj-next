import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { crafts } from "@/lib/crafts";
import { site } from "@/lib/site";

const at = (path: string) => site.url.replace(/\/$/, "") + path;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: at("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: at("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...crafts.map((c) => ({
      url: at(`/shop?craft=${c.key}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: at(`/product/${p.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
