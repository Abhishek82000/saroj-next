import { ListingSkeleton } from "@/components/ui/Skeleton";

/** Shown while a shop, category or tag listing fetches. */
export default function Loading() {
  return <ListingSkeleton />;
}
