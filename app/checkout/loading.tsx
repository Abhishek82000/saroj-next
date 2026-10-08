import { CartSkeleton } from "@/components/ui/Skeleton";

/** Shown before the checkout page's code runs. */
export default function Loading() {
  return <CartSkeleton checkout />;
}
