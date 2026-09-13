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
