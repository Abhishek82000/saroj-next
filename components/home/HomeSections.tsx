import Hero from "@/components/home/Hero";
import CraftRoll from "@/components/home/CraftRoll";
import TwoHouses from "@/components/home/TwoHouses";
import Shelf from "@/components/home/Shelf";
import GiftBuilder from "@/components/home/GiftBuilder";
import FabricFan from "@/components/home/FabricFan";
import VideoBanner from "@/components/home/VideoBanner";
import Reels from "@/components/home/Reels";
import Voices from "@/components/home/Voices";
import Bulk from "@/components/home/Bulk";
import Journal from "@/components/home/Journal";
import Rail from "@/components/product/Rail";
import BannerSlider from "@/components/home/BannerSlider";
import JsonLd from "@/components/seo/JsonLd";
import { getBlogList } from "@/lib/blogs";
import { apiProductToProduct, buildReels, getHomeData } from "@/lib/home";
import { getFeaturedCategories } from "@/lib/nav";
import { products } from "@/lib/products";
import { breadcrumbLd, graph, itemListLd } from "@/lib/seo";
import { WHOLESALE_HOME } from "@/lib/wholesale";
import type { WholesalePage } from "@/lib/wholesalePage";

/**
 * The home page's sections. `/` and `/wholesale-fabric` are the same page:
 * the wholesale one takes its banners and category rails from the wholesale
 * feed (see getWholesalePage) and everything else from the retail one, and
 * because it is in wholesale mode its cards carry no add-to-cart.
 */
export default async function HomeSections({ wholesale }: { wholesale?: WholesalePage | null }) {
  const fresh = [...products].sort((a, b) => b.fresh - a.fresh).slice(0, 8);
  const homeData = await getHomeData();
  const tagSections = homeData.tagSections;
  const apiReels = buildReels(homeData);
  const featuredCategories = await getFeaturedCategories();
  const { posts: journalPosts } = await getBlogList();
  const isWholesale = wholesale !== undefined;

  /* Category rails: the wholesale feed's own in wholesale, the storefront's otherwise. */
  const categoryRails = isWholesale && wholesale?.rails.length
    ? wholesale.rails.map((r) => ({ id: r.id, slug: r.slug, name: r.name, items: r.items }))
    : homeData.categorySections.map((c) => ({ id: c.cat_id, slug: c.cat_slug, name: c.cat_name, items: c.products.map(apiProductToProduct) }));

  return (
    <main id="main">
      {/* Top banners from the feed (wholesale's own in wholesale, `top_slider` otherwise); the static hero if there are none. */}
      {(() => {
        const slides = isWholesale && wholesale?.slides.length ? wholesale.slides : homeData.slides;
        return slides.length ? <BannerSlider slides={slides} label={isWholesale ? "Wholesale offers" : "Offers"} /> : <Hero />;
      })()}
      <CraftRoll />
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
      <Shelf categories={featuredCategories} />
      {categoryRails.map((cat) => (
        <Rail key={cat.id} id={cat.slug} eyebrow="Off the kiln and off the loom" heading={cat.name} items={cat.items} />
      ))}
      <VideoBanner />
      <Reels items={apiReels} />
      <Voices />
      <Bulk />
      <Journal posts={journalPosts} />

      <JsonLd data={graph([
        breadcrumbLd(isWholesale
          ? [{ name: "Home", path: "/" }, { name: "Wholesale", path: WHOLESALE_HOME }]
          : [{ name: "Home", path: "/" }]),
        itemListLd(fresh, "/"),
      ])} />
    </main>
  );
}
