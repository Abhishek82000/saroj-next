import type { Metadata } from "next";
import CheckoutView from "@/components/cart/CheckoutView";

export const metadata: Metadata = { title: "Wholesale checkout", robots: { index: false, follow: false } };

/** /wholesale-fabric/checkout — the same page in wholesale mode (login required). */
export default function WholesaleCheckoutPage() {
  return <CheckoutView />;
}
