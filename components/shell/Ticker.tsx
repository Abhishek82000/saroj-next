"use client";

import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import { isWholesalePath } from "@/lib/wholesale";

/** The marquee above the nav — trade messages on the wholesale pages, retail
    offers everywhere else. Duplicated so the loop is seamless. */
export default function Ticker() {
  const set = isWholesalePath(usePathname()) ? site.wholesaleTicker : site.ticker;
  const lines = [...set, ...set, ...set, ...set];

  return (
    <div className="st-top" aria-hidden="true">
      <ul data-marquee>
        {lines.map(([lead, strong], i) => <li key={i}>{lead}<b>{strong}</b></li>)}
      </ul>
    </div>
  );
}
