import type { Metadata } from "next";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Wholesale cart", robots: { index: false, follow: false } };

/** /wholesale-fabric/cart — the same page; the URL puts it in wholesale mode. */
export default function WholesaleCartPage() {
  return <CartView />;
}
