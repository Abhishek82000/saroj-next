import type { Metadata } from "next";
import { Suspense } from "react";
import OrderStatusView from "@/components/cart/OrderStatusView";

export const metadata: Metadata = { title: "Order status", robots: { index: false, follow: false } };

/** /checkout/status?order_id=… — where Cashfree sends a retail buyer back. */
export default function OrderStatusPage() {
  return <Suspense><OrderStatusView /></Suspense>;
}
