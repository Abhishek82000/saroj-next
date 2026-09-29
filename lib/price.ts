import type { Product } from "./types";

/** Percent off MRP, rounded — 0 when there's no MRP. */
export const discount = (p: Pick<Product, "price" | "mrp">) =>
  (p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
