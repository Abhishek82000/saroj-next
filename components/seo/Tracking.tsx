"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window { fbq?: (...args: unknown[]) => void }
}

/**
 * The Pixel's own snippet only fires PageView on a full page load. Pages here
 * change in the browser without one, so this sends a PageView on every later
 * route change. (GA4 counts these itself through its history-change tracking.)
 * Rendered inside <Suspense> because it reads the query string.
 */
export function PixelPageViews() {
  const pathname = usePathname();
  const search = useSearchParams()?.toString();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; } // the snippet already sent this one
    window.fbq?.("track", "PageView");
  }, [pathname, search]);

  return null;
}
