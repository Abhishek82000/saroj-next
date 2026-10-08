"use client";
import { usePathname } from "next/navigation";
import { RouteSkeleton } from "@/components/ui/Skeleton";

/** Shown while any page without a prefetched loading screen of its own loads — shaped for that page. */
export default function Loading() {
  return <RouteSkeleton pathname={usePathname()} />;
}
