import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import CraftRoll from "@/components/home/CraftRoll";
import Wheel from "@/components/home/Wheel";
import TwoHouses from "@/components/home/TwoHouses";
import Shelf from "@/components/home/Shelf";
import GiftBuilder from "@/components/home/GiftBuilder";
import FabricFan from "@/components/home/FabricFan";
import VideoBanner from "@/components/home/VideoBanner";
import Reels from "@/components/home/Reels";
import Making from "@/components/home/Making";
import Voices from "@/components/home/Voices";
import Bulk from "@/components/home/Bulk";
import Journal from "@/components/home/Journal";
import Rail from "@/components/product/Rail";
import JsonLd from "@/components/seo/JsonLd";
import { apiProductToProduct, buildReels, getHomeData } from "@/lib/home";
import { getFeaturedCategories } from "@/lib/nav";
import { products } from "@/lib/products";
import { breadcrumbLd, graph, itemListLd, pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: `${site.name} — ${site.tagline}`,
  description:
    "Hand block printed Jaipuri cotton, Ajrakh and Kalamkari by the metre, alongside blue pottery, meenakari, brass and marble from the lanes that print our cloth. Cut to any length from one metre.",
  path: "/",
});

export default async function HomePage() {
  const fresh = [...products].sort((a, b) => b.fresh - a.fresh).slice(0, 8);
  const homeData = await getHomeData();
  const tagSections = homeData.tagSections;
  const categorySections = homeData.categorySections;
  const apiReels = buildReels(homeData);
  const featuredCategories = await getFeaturedCategories();

  return (
    <main id="main">
      <Hero />
      <CraftRoll />
      {/* <Wheel /> */}
      <TwoHouses />
      <VideoBanner />
      <Shelf categories={featuredCategories} />
      {tagSections.length > 0 ? (
        tagSections.map((tag) => (
          <Rail
            key={tag.id}
            id={tag.slug}
            eyebrow="Off the kiln and off the loom"
            heading={tag.name}
            items={tag.products.map(apiProductToProduct)}
          />
        ))
      ) : (
        <Rail id="new" eyebrow="Off the kiln and off the loom" heading="New this week." items={fresh} />
      )}
      {categorySections.map((cat) => (
        <Rail
          key={cat.cat_id}
          id={cat.cat_slug}
          eyebrow="Off the kiln and off the loom"
          heading={cat.cat_name}
          items={cat.products.map(apiProductToProduct)}
        />
      ))}
      <Reels items={apiReels} />
      <GiftBuilder />
      <FabricFan />
      {/* <Making /> */}
      <Voices />
      <Bulk />
      <Journal />

      <JsonLd data={graph([
        breadcrumbLd([{ name: "Home", path: "/" }]),
        itemListLd(fresh, "/"),
      ])} />
    </main>
  );
}
