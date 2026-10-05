import Hero from "@/components/home/Hero";
import CraftRoll from "@/components/home/CraftRoll";
import WaysToBuy from "@/components/home/WaysToBuy";
import OffersSlider from "@/components/home/OffersSlider";
import { getOffersFeed, offerSlides } from "@/lib/offers";
import Shelf from "@/components/home/Shelf";
import VideoBanner from "@/components/home/VideoBanner";
import Reels from "@/components/home/Reels";
import Voices from "@/components/home/Voices";
import Bulk from "@/components/home/Bulk";
import Journal from "@/components/home/Journal";
import Rail from "@/components/product/Rail";
import HandicraftRail from "@/components/product/HandicraftRail";
import BannerSlider from "@/components/home/BannerSlider";
import JsonLd from "@/components/seo/JsonLd";
import { getBlogList } from "@/lib/blogs";
import { apiProductToProduct, buildReels, getHomeData } from "@/lib/home";
import { getFeaturedCategories } from "@/lib/nav";
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
  const homeData = await getHomeData();
  const tagSections = homeData.tagSections;
  const apiReels = buildReels(homeData);
  const featuredCategories = await getFeaturedCategories();
  const { posts: journalPosts } = await getBlogList();
  const isWholesale = wholesale !== undefined;
  /* Live coupons, cart-milestone steps and free shipping (GET /api/offers) — a retail offer. */
  const feed = isWholesale ? null : await getOffersFeed();
  const offers = feed ? offerSlides(feed) : [];

  /* Category rails: the wholesale feed's own in wholesale, the storefront's otherwise. */
  const categoryRails = isWholesale && wholesale?.rails.length
    ? wholesale.rails.map((r) => ({ id: r.id, slug: r.slug, name: r.name, items: r.items }))
    : homeData.categorySections.map((c) => ({ id: c.cat_id, slug: c.cat_slug, name: c.cat_name, items: c.products.map(apiProductToProduct) }));

  return (
    <main id="main">
      <Hero />
      <CraftRoll />
      {tagSections.map((tag) => (
        <Rail
            key={tag.id}
            id={tag.slug}
            eyebrow="Off the kiln and off the loom"
            heading={tag.name}
            items={tag.products.map(apiProductToProduct)}
          />
      ))}
      
      <Reels items={apiReels} />
      <Shelf categories={featuredCategories} />
      {categoryRails.map((cat) => (
        <Rail key={cat.id} id={cat.slug} eyebrow="Off the kiln and off the loom" heading={cat.name} items={cat.items} />
      ))}
      <VideoBanner />      
      {homeData.handicraftSections.map((hc) => (
        <HandicraftRail key={`hc-${hc.id}`} id={hc.slug} eyebrow="Shaped by hand" heading={hc.name} items={hc.products.map(apiProductToProduct)} />
      ))}
      
      {/* `top_slider` banners — their own section under the hero, retail only. */}
      {!isWholesale && homeData.slides.length > 0 && <BannerSlider slides={homeData.slides} />}
      
      {offers.length > 1 && <OffersSlider slides={offers} />}
      {/* Wholesale + handicraft, each with its way in — retail only, wholesale is already inside. */}
      
      
      {!isWholesale && <WaysToBuy />}
      
      
      <Voices />
      <Bulk />
      <Journal posts={journalPosts} />

      <JsonLd data={graph([
        breadcrumbLd(isWholesale
          ? [{ name: "Home", path: "/" }, { name: "Wholesale", path: WHOLESALE_HOME }]
          : [{ name: "Home", path: "/" }]),
        itemListLd((tagSections[0]?.products ?? []).slice(0, 8).map(apiProductToProduct), "/"),
      ])} />
    </main>
  );
}
