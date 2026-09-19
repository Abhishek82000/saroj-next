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
  /** The live API's own merchandising tag ("New", "Trending", ...), when it has one — overrides the generic Fabric/Handicraft badge. */
  label?: string;
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

/** One entry of the "tagsList" sidebar facet in GET /api/products. */
export interface ProductsApiTag {
  tag_id: number;
  tag_name: string;
  tag_slug: string;
}

/** One card of the "saleProducts" rail in GET /api/products. */
export interface ProductsApiSaleProduct {
  product_name: string;
  product_price: string;
  product_selling_price: string;
  product_image: string;
  product_slug: string;
  product_image_cdn: string;
}

/** GET /api/products?category=<slug> — a single category's product listing, one page at a time. */
export interface ProductsApiResponse {
  success: boolean;
  data: {
    category?: CommonCategoryRef | null;
    /** Present instead of `category` when the listing was fetched by ?tag=<slug>. */
    tag?: { id: number; name: string; slug: string } | null;
    /** Every storefront category, for the "Product categories" sidebar list. */
    categoryList?: CommonCategoryRef[];
    tagsList?: ProductsApiTag[];
    price_range?: { min: string; max: string };
    products: HomeApiProduct[];
    /** A handful of reduced-price picks for the "Recommended" sidebar rail. */
    saleProducts?: ProductsApiSaleProduct[];
    pagination: { current_page: number; last_page: number; total: number };
  };
}

/**
 * GET /api/products/{slug} — a single product's own page. Unlike the listing
 * endpoints, this one carries no price, stock or MRP for the product itself
 * (checked across several products, all missing it the same way) — only
 * name, photos, SEO meta and a `related_products` list that DOES have prices.
 */
export interface ProductDetailApiProduct {
  id: number;
  name: string;
  slug: string;
  image: string;
  meta_title: string;
  meta_description: string;
  gallery: string[];
  rating: number;
  review_count: number;
}

export interface ProductDetailApiResponse {
  success: boolean;
  data: {
    product: ProductDetailApiProduct;
    related_products: HomeApiProduct[];
  };
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

/** A category sidebar's "Recommended" pick — lighter than Product, no stock/craft data. */
export interface SaleProduct {
  name: string;
  slug: string;
  image: string;
  price: number;
  mrp: number;
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

/**
 * GET /api/page-data/<slug> — a static content page (Privacy Policy, Terms,
 * Return Policy, ...). Only the header/footer/breadcrumb come from this app;
 * `page_content` is the storefront's own rich-text HTML for the middle.
 */
export interface PageDataApiResponse {
  status: string;
  message: string;
  data: {
    page_id: number;
    page_name: string;
    page_url: string;
    /** null on pages this app renders with its own dedicated route instead (Contact). */
    page_content: string | null;
  } | null;
}

/** A blog's category, shared by the list and detail endpoints. */
export interface BlogApiCategory {
  category_id: number;
  category_name: string;
  category_slug: string;
  blogs_count?: number;
}

/** One post as returned by both GET /api/blogs and GET /api/blogs/<slug>. */
export interface BlogApiPost {
  blog_id: number;
  blog_name: string;
  blog_slug: string;
  blog_short_description: string | null;
  blog_desc: string;
  blog_meta_desc: string | null;
  blog_image: string | null;
  blog_date: string;
  blog_featured: number;
  categories?: BlogApiCategory;
}

/** GET /api/blogs?page=<n> — the journal's listing, one page at a time. */
export interface BlogsListApiResponse {
  success: boolean;
  data: {
    /** Present instead of null when the listing was fetched by ?category=<slug>. */
    category: { id: number; name: string; slug: string } | null;
    blogs: BlogApiPost[];
    pagination: { current_page: number; last_page: number; total: number };
    categories: BlogApiCategory[];
  };
}

/** One entry of a blog post's "related_products" — its own product shape,
    distinct from HomeApiProduct's field names. */
export interface BlogApiRelatedProduct {
  product_id: number;
  product_name: string;
  product_slug: string;
  product_price: string;
  product_selling_price: string;
  product_image_cdn: string;
  product_stock: number;
}

/** GET /api/blogs/<slug> — a single post plus a few related products. */
export interface BlogDetailApiResponse {
  success: boolean;
  data: {
    blog: BlogApiPost;
    related_products: BlogApiRelatedProduct[];
  };
}
