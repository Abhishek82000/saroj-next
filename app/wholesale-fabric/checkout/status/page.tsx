import type { Metadata } from "next";
import { Suspense } from "react";
import OrderStatusView from "@/components/cart/OrderStatusView";

export const metadata: Metadata = { title: "Wholesale order status", robots: { index: false, follow: false } };

/** /wholesale-fabric/checkout/status?order_id=… — the same page in wholesale mode. */
export default function WholesaleOrderStatusPage() {
  return <Suspense><OrderStatusView /></Suspense>;
}
