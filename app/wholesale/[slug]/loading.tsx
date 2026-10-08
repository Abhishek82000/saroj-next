import { ListingSkeleton } from "@/components/ui/Skeleton";

/** Shown while a wholesale category or tag listing fetches. */
export default function Loading() {
  return <ListingSkeleton />;
}
