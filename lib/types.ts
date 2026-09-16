export type Kind = "craft" | "fabric";
export type Stock = "in" | "low" | "out";

export interface Craft {
  key: string;
  name: string;
  hindi: string;
  lane: string;
  image: string;
}

export interface Product {
  slug: string;
  name: string;
  /** Short name for breadcrumbs and the sticky bar. */
  short: string;
  kind: Kind;
  craft: string;
  material: string;
  /** Price for one `unit`. */
  price: number;
  /** Struck-through list price. 0 when there is no reduction. */
  mrp: number;
  unit: string;
  stock: Stock;
  images: { src: string; note: string }[];
  /** Sort weights: how new it is, and how many have gone out. */
  fresh: number;
  sold: number;
  hindi?: string;
  /** Fabric is cut, so it carries a length range instead of a quantity. */
  cut?: { min: number; max: number; step: number; wholesale: number };
  description?: string;
  specs?: { label: string; value: string; note: string }[];
  /** Slugs shown in the "people also bought" rail. */
  alsoBought?: string[];
}

/** One product as returned by GET /api/home, inside a tag section. */
export interface HomeApiProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  selling_price: string;
  image: string;
  image_alt: string | null;
  moq: number;
  stock: number;
  inventory: number;
  type: number;
  label: string;
  rating: string;
  review_count: number;
  style_type: number;
  gallery: string[];
}

/** One row of the homepage rails, e.g. "New Arrivals" or "Best Seller". */
export interface HomeTagSection {
  id: number;
  name: string;
  slug: string;
  products: HomeApiProduct[];
}

/** One row of the homepage rails grouped by storefront category, e.g. "Ajrakh Collection". */
export interface HomeCategorySection {
  cat_id: number;
  cat_name: string;
  cat_slug: string;
  products: HomeApiProduct[];
}

/** One clip from the "video_products" list in GET /api/home. */
export interface HomeVideoProduct {
  product_id: number;
  product_name: string;
  product_price: string;
  product_selling_price: string;
  product_slug: string;
  product_video_cdn: string;
}

export interface HomeApiResponse {
  success: boolean;
  data: {
    tag_show_home_page: HomeTagSection[];
    category_show_home_page: HomeCategorySection[];
    video_products: HomeVideoProduct[];
  };
}

/** A single shoppable-reel card, as rendered by the Reels rail. */
export interface Reel {
  id: string;
  video: string;
  kind: "Fabric" | "Handicraft";
  name: string;
  price: number;
  mrp: number;
  unit: string;
  image: string;
  /** Catalogue slug when the piece has a page here; an outside URL otherwise. */
  slug?: string;
  href?: string;
}

/** A leaf category reference inside a /api/common menu node ([] when there is none). */
export interface CommonCategoryRef {
  cat_id: number;
  cat_name: string;
  cat_slug: string;
}

/** One node of the site-wide nav tree from GET /api/common. */
export interface CommonMenuItem {
  id: number;
  name: string;
  order: number;
  categories: CommonCategoryRef | [];
  children: CommonMenuItem[];
}

/** One tile from the "featured_categories" list in GET /api/common. */
export interface CommonFeaturedCategory {
  id: number;
  name: string;
  slug: string;
  image: string;
}

/** The admin-editable business settings from GET /api/common — only the fields we use. */
export interface CommonSettings {
  site_website_marque: string;
}

export interface CommonApiResponse {
  success: boolean;
  data: {
    settings: CommonSettings;
    menu: CommonMenuItem[];
    featured_categories: CommonFeaturedCategory[];
  };
}

export interface CartLine {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  qty: number;
  step: number;
  href?: string;
}
