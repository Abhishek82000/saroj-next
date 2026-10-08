import { OrderStatusSkeleton } from "@/components/ui/Skeleton";

/** Shown before the wholesale order-status page's code runs. */
export default function Loading() {
  return <OrderStatusSkeleton />;
}
