import FabricHouse from "@/components/handicraft/FabricHouse";
import HandicraftRail from "@/components/product/HandicraftRail";
import { categoryHref } from "@/lib/nav";
import type { HandiCat } from "@/lib/home";
import type { CommonFeaturedCategory } from "@/lib/types";

/** What a product listing shows once its last product is on screen: the fabric house and the craft bazaar. */
export default function ListingSections({ fabricCategories, handicraftCats }: { fabricCategories: CommonFeaturedCategory[]; handicraftCats: HandiCat[] }) {
  const slides = fabricCategories.map((c) => ({ name: c.name, href: categoryHref(c.slug), img: c.image }));

  return (
    <>
      {slides.length > 0 && <div className="hc"><FabricHouse slides={slides} reveal={false} /></div>}
      <HandicraftRail cats={handicraftCats} id="bazaar" />
    </>
  );
}
