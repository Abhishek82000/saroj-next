import type { Metadata } from "next";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: false } };

/** /cart — the retail cart as a page. */
export default function CartPage() {
  return <CartView />;
}
